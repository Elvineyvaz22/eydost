import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { packages as staticPackages, regionalPackages, globalPackage } from '../../data/esimPackages';
import { usePackages } from '../../contexts/PackagesContext';
import {
  AlertCircle,
  Check,
  Globe,
  MapPin,
  Package,
  Percent,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

type TargetType = 'global' | 'region' | 'country' | 'package';
type PriceMode = 'margin' | 'fixed';

interface PricingRule {
  id: string;
  target_type: TargetType;
  target_id: string | null;
  margin: number;
  fixed_price: number | null;
  is_active: boolean;
}

interface RuleForm {
  target_type: TargetType;
  target_id: string;
  mode: PriceMode;
  percent: string;
  fixed_price: string;
  is_active: boolean;
}

const defaultForm: RuleForm = {
  target_type: 'country',
  target_id: '',
  mode: 'margin',
  percent: '75',
  fixed_price: '',
  is_active: true,
};

const targetLabels: Record<TargetType, string> = {
  global: 'Butun paketler',
  region: 'Region',
  country: 'Olke',
  package: 'Paket',
};

function marginToPercent(margin: number) {
  return ((margin - 1) * 100).toFixed(0);
}

function percentToMargin(percent: string) {
  const parsed = Number(percent);
  return Number.isFinite(parsed) ? Number(((100 + parsed) / 100).toFixed(4)) : 1;
}

function fixedDollarsToUnits(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 10000) : null;
}

function unitsToDollars(value: number | null) {
  return value ? (value / 10000).toFixed(2) : '';
}

function normalizeTarget(type: TargetType, value: string) {
  if (type === 'global') return null;
  return value.trim().toUpperCase();
}

export default function PricingEditor() {
  const { liveCountryGroups, liveRegionalPackages } = usePackages();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<RuleForm>(defaultForm);

  const countryOptions = useMemo(() => {
    if (liveCountryGroups.length > 0) {
      return liveCountryGroups
        .map(group => ({
          id: group.countryCode.toUpperCase(),
          label: `${group.countryName} (${group.countryCode.toUpperCase()})`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return staticPackages
      .map(pkg => ({
        id: pkg.countryCode.toUpperCase(),
        label: `${pkg.country} (${pkg.countryCode.toUpperCase()})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [liveCountryGroups]);

  const regionOptions = useMemo(() => {
    return [...regionalPackages, globalPackage].map(region => ({
      id: region.name.toUpperCase(),
      label: region.name,
    }));
  }, []);

  const packageOptions = useMemo(() => {
    const livePackageOptions = [
      ...liveCountryGroups.flatMap(group => group.packages.map(pkg => ({
        id: pkg.packageCode,
        label: `${group.countryName} ${pkg.name} (${pkg.packageCode})`,
      }))),
      ...liveRegionalPackages.map(pkg => ({
        id: pkg.packageCode,
        label: `${pkg.name} (${pkg.packageCode})`,
      })),
    ].filter(option => option.id);

    if (livePackageOptions.length > 0) {
      return livePackageOptions.sort((a, b) => a.label.localeCompare(b.label));
    }

    return staticPackages.flatMap(pkg =>
      pkg.plans.map((plan, index) => ({
        id: plan.code || `${pkg.countryCode.toUpperCase()}-${index + 1}`,
        label: `${pkg.country} ${plan.gb}GB / ${plan.days} gun`,
      })),
    );
  }, [liveCountryGroups, liveRegionalPackages]);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('esim_pricing')
        .select('*')
        .order('target_type', { ascending: true })
        .order('target_id', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qiymet qaydalari yuklenmedi.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm(type: TargetType = 'country') {
    setEditingId(null);
    setForm({ ...defaultForm, target_type: type, target_id: type === 'global' ? '' : defaultForm.target_id });
    setShowForm(true);
  }

  function openEditForm(rule: PricingRule) {
    setEditingId(rule.id);
    setForm({
      target_type: rule.target_type,
      target_id: rule.target_id || '',
      mode: rule.fixed_price ? 'fixed' : 'margin',
      percent: marginToPercent(rule.margin),
      fixed_price: unitsToDollars(rule.fixed_price),
      is_active: rule.is_active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const targetId = normalizeTarget(form.target_type, form.target_id);
    if (form.target_type !== 'global' && !targetId) {
      setError('Hedef secin ve ya kod daxil edin.');
      setSaving(false);
      return;
    }

    const payload = {
      target_type: form.target_type,
      target_id: targetId,
      margin: form.mode === 'margin' ? percentToMargin(form.percent) : 1,
      fixed_price: form.mode === 'fixed' ? fixedDollarsToUnits(form.fixed_price) : null,
      is_active: form.is_active,
    };

    try {
      let result;
      if (editingId) {
        result = await supabase
          .from('esim_pricing')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
      } else {
        const existing = rules.find(rule =>
          rule.target_type === payload.target_type &&
          (rule.target_id || null) === payload.target_id,
        );

        if (existing) {
          result = await supabase
            .from('esim_pricing')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('esim_pricing')
            .insert([payload])
            .select()
            .single();
        }
      }

      if (result.error) throw result.error;
      await fetchRules();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qayda saxlanilmadi.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(rule: PricingRule) {
    if (!confirm(`${rule.target_id || 'Qlobal'} qaydasini silmek isteyirsiniz?`)) return;

    try {
      const { error } = await supabase.from('esim_pricing').delete().eq('id', rule.id);
      if (error) throw error;
      setRules(current => current.filter(item => item.id !== rule.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qayda silinmedi.');
    }
  }

  async function toggleRule(rule: PricingRule) {
    try {
      const { error } = await supabase
        .from('esim_pricing')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);
      if (error) throw error;
      setRules(current => current.map(item => (
        item.id === rule.id ? { ...item, is_active: !item.is_active } : item
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status deyismedi.');
    }
  }

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter(rule =>
      targetLabels[rule.target_type].toLowerCase().includes(query) ||
      (rule.target_id || 'global').toLowerCase().includes(query),
    );
  }, [rules, search]);

  const globalRule = rules.find(rule => rule.target_type === 'global' && rule.is_active);

  const targetOptions = form.target_type === 'country'
    ? countryOptions
    : form.target_type === 'region'
      ? regionOptions
      : form.target_type === 'package'
        ? packageOptions
        : [];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">eSIM qiymetleri</h1>
            <p className="text-gray-500">Qlobal, region, olke ve paket uzre artim, endirim ve sabit qiymet teyin edin.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openCreateForm('global')} className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800">
              <Globe className="w-4 h-4" />
              Qlobal
            </button>
            <button onClick={() => openCreateForm('region')} className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:border-cyan-300">
              <MapPin className="w-4 h-4" />
              Region
            </button>
            <button onClick={() => openCreateForm('country')} className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:border-cyan-300">
              <MapPin className="w-4 h-4" />
              Olke
            </button>
            <button onClick={() => openCreateForm('package')} className="inline-flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-cyan-700">
              <Package className="w-4 h-4" />
              Paket
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-lg p-5">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Aktiv qlobal qayda</p>
            <p className="text-2xl font-black text-gray-900">
              {globalRule ? `+${marginToPercent(globalRule.margin)}%` : '+75%'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Diger qayda tapilmasa bu marja istifade olunur.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-5">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Prioritet sirasi</p>
            <p className="text-sm font-bold text-gray-900">Paket → Olke → Region → Qlobal</p>
            <p className="text-xs text-gray-500 mt-2">Daha konkret qayda umumi qaydani evez edir.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-5">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Endirim</p>
            <p className="text-sm font-bold text-gray-900">Menfi faiz yazin</p>
            <p className="text-xs text-gray-500 mt-2">Meselen: -10% API qiymetinden 10% asagi, +40% ise artimdir.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Qayda axtar..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-cyan-400"
              />
            </div>
            <button onClick={() => openCreateForm()} className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-cyan-700">
              <Plus className="w-4 h-4" />
              Yeni qayda
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[820px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase">Hedef</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase">Kod / ad</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase">Qiymet qaydasi</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase text-right">Emeliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">Yuklenir...</td>
                  </tr>
                ) : filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">Qayda tapilmadi.</td>
                  </tr>
                ) : filteredRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 items-center justify-center">
                          {rule.target_type === 'package' ? <Package className="w-4 h-4" /> : rule.target_type === 'global' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{targetLabels[rule.target_type]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">{rule.target_id || 'GLOBAL'}</span>
                    </td>
                    <td className="px-5 py-4">
                      {rule.fixed_price ? (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900">
                          <Check className="w-4 h-4 text-green-600" />
                          ${(rule.fixed_price / 10000).toFixed(2)} sabit
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-2 text-sm font-bold ${rule.margin >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                          {rule.margin >= 1 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Number(marginToPercent(rule.margin)) >= 0 ? '+' : ''}{marginToPercent(rule.margin)}%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleRule(rule)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {rule.is_active ? 'Aktiv' : 'Passiv'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditForm(rule)} className="px-3 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                          Edit
                        </button>
                        <button onClick={() => deleteRule(rule)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-xl shadow-2xl">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">{editingId ? 'Qaydani deyis' : 'Yeni qiymet qaydasi'}</h2>
                <button onClick={closeForm} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={saveRule} className="p-5 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['global', 'region', 'country', 'package'] as TargetType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(current => ({ ...current, target_type: type, target_id: '' }))}
                      className={`py-2.5 rounded-lg text-sm font-bold border ${form.target_type === type ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      {targetLabels[type]}
                    </button>
                  ))}
                </div>

                {form.target_type !== 'global' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hedef secimi</label>
                    <select
                      value={form.target_id}
                      onChange={event => setForm(current => ({ ...current, target_id: event.target.value }))}
                      className="w-full bg-gray-50 border border-transparent rounded-lg px-4 py-3 text-sm outline-none focus:bg-white focus:border-cyan-400"
                    >
                      <option value="">Secin...</option>
                      {targetOptions.map(option => (
                        <option key={`${option.id}-${option.label}`} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      value={form.target_id}
                      onChange={event => setForm(current => ({ ...current, target_id: event.target.value }))}
                      placeholder="Veya kodu elle yazin: AZ, EUROPE, PACKAGE_CODE"
                      className="mt-2 w-full bg-gray-50 border border-transparent rounded-lg px-4 py-3 text-sm outline-none focus:bg-white focus:border-cyan-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Qiymet rejimi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(current => ({ ...current, mode: 'margin' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold border ${form.mode === 'margin' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      <Percent className="w-4 h-4" />
                      Faiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(current => ({ ...current, mode: 'fixed' }))}
                      className={`py-3 rounded-lg font-bold border ${form.mode === 'fixed' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      Sabit $
                    </button>
                  </div>
                </div>

                {form.mode === 'margin' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Faiz deyisimi</label>
                    <input
                      type="number"
                      step="1"
                      value={form.percent}
                      onChange={event => setForm(current => ({ ...current, percent: event.target.value }))}
                      className="w-full bg-gray-50 border border-transparent rounded-lg px-4 py-3 text-sm outline-none focus:bg-white focus:border-cyan-400"
                      placeholder="Meselen: 75, 40, -10"
                    />
                    <p className="mt-2 text-xs text-gray-500">+75% = API qiymeti x 1.75. -10% = API qiymeti x 0.90.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sabit satis qiymeti ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.fixed_price}
                      onChange={event => setForm(current => ({ ...current, fixed_price: event.target.value }))}
                      className="w-full bg-gray-50 border border-transparent rounded-lg px-4 py-3 text-sm outline-none focus:bg-white focus:border-cyan-400"
                      placeholder="Meselen: 7.99"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <span className="text-sm font-bold text-gray-700">Qayda aktiv olsun</span>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={event => setForm(current => ({ ...current, is_active: event.target.checked }))}
                    className="w-5 h-5 accent-cyan-600"
                  />
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-5 py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">
                    Legv et
                  </button>
                  <button disabled={saving} className="px-5 py-3 rounded-lg font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60">
                    {saving ? 'Saxlanilir...' : 'Saxla'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
