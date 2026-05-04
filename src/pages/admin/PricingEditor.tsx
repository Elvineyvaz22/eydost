import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { packages as staticPackages } from '../../data/esimPackages';
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

const PRICING_CONTENT_KEY = 'esim_pricing_rules';

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

const REGION_OPTIONS = [
  { id: 'EUROPE', label: 'Avropa - butun Avropa paketleri' },
  { id: 'ASIA', label: 'Asiya - butun Asiya paketleri' },
  { id: 'MIDDLE EAST & AFRICA', label: 'Middle East & Africa - butun region paketleri' },
  { id: 'AMERICAS', label: 'Americas - butun Amerika paketleri' },
];

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

function createRuleId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function PricingEditor() {
  const { liveCountryGroups, liveRegionalPackages, refreshLivePackages } = usePackages();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<RuleForm>(defaultForm);
  const [activeTab, setActiveTab] = useState<'rules' | 'quick'>('quick');

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

  const regionOptions = REGION_OPTIONS;

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
        .from('site_content')
        .select('value')
        .eq('key', PRICING_CONTENT_KEY)
        .maybeSingle();

      if (error) throw error;
      setRules(Array.isArray(data?.value) ? data.value as PricingRule[] : []);
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

  async function persistRules(nextRules: PricingRule[]) {
    // 1. Save rules
    const { error: rulesError } = await supabase
      .from('site_content')
      .upsert({
        key: PRICING_CONTENT_KEY,
        value: nextRules,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (rulesError) throw rulesError;

    // 2. Increment version to trigger site-wide cache refresh
    const nextVersion = Date.now().toString();
    await supabase
      .from('site_content')
      .upsert({
        key: 'pricing_version',
        value: nextVersion,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    localStorage.removeItem('eydost_live_packages');
    localStorage.removeItem('eydost_live_packages_time');
    localStorage.setItem('eydost_pricing_version', nextVersion);
    
    setRules(nextRules);
    refreshLivePackages().catch(() => undefined);
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
      const existing = rules.find(rule =>
        rule.target_type === payload.target_type &&
        (rule.target_id || null) === payload.target_id,
      );
      const targetIdToUpdate = editingId || existing?.id;
      const nextRules = targetIdToUpdate
        ? rules.map(rule => rule.id === targetIdToUpdate ? { ...rule, ...payload } : rule)
        : [...rules, { id: createRuleId(), ...payload }];

      await persistRules(nextRules);
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
      await persistRules(rules.filter(item => item.id !== rule.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qayda silinmedi.');
    }
  }

  async function toggleRule(rule: PricingRule) {
    try {
      await persistRules(rules.map(item => (
        item.id === rule.id ? { ...item, is_active: !item.is_active } : item
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status deyismedi.');
    }
  }
  
  async function adjustMargin(type: TargetType, id: string | null, delta: number) {
    try {
      const existing = rules.find(r => r.target_type === type && r.target_id === id);
      const currentMargin = existing?.margin || rules.find(r => r.target_type === 'global')?.margin || 1.75;
      const nextMargin = Math.max(0.1, Number((currentMargin + delta).toFixed(2)));
      
      const payload = {
        target_type: type,
        target_id: id,
        margin: nextMargin,
        fixed_price: null,
        is_active: true
      };
      
      const nextRules = existing 
        ? rules.map(r => r.id === existing.id ? { ...r, ...payload } : r)
        : [...rules, { id: createRuleId(), ...payload }];
        
      await persistRules(nextRules);
    } catch (err) {
      setError('Qiymet deyismedi.');
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

        <div className="flex border-b border-gray-100 mb-6">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-8 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'quick' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Tez idarəetmə (Dashboard)
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-8 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'rules' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Bütün qaydalar
          </button>
        </div>

        {activeTab === 'quick' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Global & Priority Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="w-20 h-20" />
                </div>
                <p className="text-xs font-bold text-cyan-400 uppercase mb-1">Əsas Qlobal Marja</p>
                <div className="flex items-center gap-4">
                  <p className="text-4xl font-black">{globalRule ? `+${marginToPercent(globalRule.margin)}%` : '+75%'}</p>
                  <div className="flex gap-1">
                    <button onClick={() => adjustMargin('global', null, 0.05)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold">+</button>
                    <button onClick={() => adjustMargin('global', null, -0.05)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold">-</button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 italic">Xüsusi qayda olmayan bütün paketlərə bu marja tətbiq olunur.</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-center">
                <h3 className="font-bold text-gray-900 mb-2">Necə işləyir?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Qiyməti qaldırmaq üçün <b>+</b>, endirmək üçün <b>-</b> düyməsini sıxın. 
                  Hər klik marjanı <b>5%</b> dəyişir. Dəyişiklik dərhal saytda aktiv olur.
                </p>
              </div>
            </div>

            {/* Regions */}
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-600" />
                Regionlar üzrə idarəetmə
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {regionOptions.map(region => {
                  const rule = rules.find(r => r.target_type === 'region' && r.target_id === region.id && r.is_active);
                  return (
                    <div key={region.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:border-cyan-200 transition-all shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 truncate">{region.label}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-black ${rule ? 'text-cyan-600' : 'text-gray-300'}`}>
                          {rule ? `+${marginToPercent(rule.margin)}%` : 'Default'}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => adjustMargin('region', region.id, 0.05)} className="w-8 h-8 rounded bg-gray-100 hover:bg-cyan-100 hover:text-cyan-600 flex items-center justify-center font-bold">+</button>
                          <button onClick={() => adjustMargin('region', region.id, -0.05)} className="w-8 h-8 rounded bg-gray-100 hover:bg-cyan-100 hover:text-cyan-600 flex items-center justify-center font-bold">-</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Countries Table */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-600" />
                  Ölkələr üzrə sürətli tənzimləmə
                </h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ölkə axtar..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <tr>
                        <th className="px-6 py-4">Ölkə</th>
                        <th className="px-6 py-4 text-center">Cari Marja</th>
                        <th className="px-6 py-4 text-right">Tez Ayar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {countryOptions
                        .filter(c => !search || c.label.toLowerCase().includes(search.toLowerCase()))
                        .slice(0, 15) // Limit for performance in quick view, user can use search
                        .map(country => {
                          const rule = rules.find(r => r.target_type === 'country' && r.target_id === country.id && r.is_active);
                          return (
                            <tr key={country.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-800">{country.label}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${rule ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {rule ? `+${marginToPercent(rule.margin)}%` : 'Qlobal/Region'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => adjustMargin('country', country.id, 0.05)} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-cyan-600 hover:text-white font-bold text-sm transition-all">+ 5%</button>
                                  <button onClick={() => adjustMargin('country', country.id, -0.05)} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-cyan-600 hover:text-white font-bold text-sm transition-all">- 5%</button>
                                  {rule && (
                                    <button onClick={() => deleteRule(rule)} className="p-1 text-gray-300 hover:text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {search.length === 0 && (
                  <div className="p-4 bg-gray-50 text-center text-xs text-gray-400">
                    Axtarış verərək digər ölkələri tapa bilərsiniz.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden animate-fade-in">
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
