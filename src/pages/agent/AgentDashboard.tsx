import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Globe2, Laptop, Loader2, LogOut, MapPin, Package, Smartphone, TrendingUp, Users, Wallet } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import Seo from '../../components/Seo';

type Agent = {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  referral_code: string | null;
  commission_rate: number;
  status: string;
};

type Referral = {
  id: string;
  customer_name: string | null;
  customer_contact: string | null;
  product_type: string;
  order_reference: string | null;
  sale_amount: number;
  commission_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
};

type Totals = {
  leads: number;
  sales: number;
  commission: number;
  paid: number;
};

function money(value: number): string {
  return `$${Number(value || 0).toFixed(2)}`;
}

function parseLeadNotes(notes: string | null) {
  const result: Record<string, string> = {};
  if (!notes) return result;

  notes.split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index === -1) return;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (key && value) result[key] = value;
  });

  return result;
}

function LeadDetails({ notes }: { notes: string | null }) {
  const data = parseLeadNotes(notes);
  const packageText =
    data['viewed package'] ||
    data['package'] ||
    data['package code'] ||
    data['baxdığı paket'] ||
    data['baxdigi paket'] ||
    data['paket'] ||
    data['paket kodu'] ||
    'Paket məlumatı yoxdur';
  const device = data['device'] || data['cihaz'];
  const geo = data['geo'] || data['təxmini ölkə/şəhər'] || data['texmini olke/seher'];
  const page = data['page'] || data['səhifə'] || data['sehife'];
  const language = data['language'] || data['brauzer dili'];
  const source = data['source'] || data['utm source'] || data['mənbə'];
  const medium = data['medium'] || data['utm medium'];
  const campaign = data['campaign'] || data['utm campaign'];
  const orderReference = data['order reference'] || data['order_id'] || data['transaction id'] || data['provider order no'];

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex gap-2">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase text-slate-400">Baxdığı paket</div>
            <div className="break-words text-sm font-bold leading-snug text-slate-900">{packageText}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {orderReference && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Package className="w-3.5 h-3.5" />
              {orderReference}
            </span>
          )}
          {device && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {device === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
              {device}
            </span>
          )}
          {geo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5" />
              {geo}
            </span>
          )}
          {language && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              {language}
            </span>
          )}
          {page && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <ExternalLink className="w-3.5 h-3.5" />
              {page}
            </span>
          )}
          {source && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              Mənbə: {source}
            </span>
          )}
          {medium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              Medium: {medium}
            </span>
          )}
          {campaign && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              Campaign: {campaign}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-red-200';
    default:
      return 'bg-amber-50 text-amber-700 ring-amber-200';
  }
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totals, setTotals] = useState<Totals>({ leads: 0, sales: 0, commission: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rawSession = localStorage.getItem('eydost_agent_session');

  const load = async () => {
    if (!rawSession) {
      setLoading(false);
      return;
    }

    try {
      const session = JSON.parse(rawSession);
      if (!session?.agentToken) {
        localStorage.removeItem('eydost_agent_session');
        navigate('/agent/login', { replace: true });
        return;
      }

      const response = await fetch('/api/agent-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentToken: session.agentToken }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Panel yuklenmedi');

      setAgent(payload.agent);
      setReferrals(payload.referrals || []);
      setTotals(payload.totals || { leads: 0, sales: 0, commission: 0, paid: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Panel yuklenmedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [rawSession]);

  if (!rawSession) return <Navigate to="/agent/login" replace />;

  const logout = () => {
    localStorage.removeItem('eydost_agent_session');
    navigate('/agent/login');
  };

  const copyReferral = async () => {
    if (!agent?.referral_code) return;
    await navigator.clipboard.writeText(`https://eydost.com/esim?ref=${agent.referral_code}`);
  };

  const referralLink = agent?.referral_code ? `https://eydost.com/esim?ref=${agent.referral_code}` : '';
  const conversionRate = totals.leads > 0 ? Math.round((referrals.filter((item) => item.status === 'paid').length / totals.leads) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Seo title="Agent Dashboard" noIndex canonicalPath="/agent/dashboard" />
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="text-lg font-black text-slate-950">Ey Dost Agent</div>
            <div className="truncate text-sm text-slate-500">{agent?.company_name || 'Agent panel'}</div>
          </div>
          <button onClick={logout} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 font-bold text-slate-700 transition hover:bg-slate-200">
            <LogOut className="w-4 h-4" />
            Çıxış
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Yüklənir...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 font-semibold text-red-700">{error}</div>
        ) : agent ? (
          <div className="space-y-5">
            <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:items-stretch">
                <div className="min-w-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 ring-1 ring-white/10">
                    <span className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {agent.status === 'active' ? 'Aktiv agent' : 'Təsdiq gözləyir'}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Salam, {agent.full_name}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Referral linkinizi paylaşın, WhatsApp kliklərini və satış nəticələrini bu paneldən izləyin.
                  </p>
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-bold uppercase text-slate-400">Komissiya faizi</div>
                      <div className="mt-1 text-2xl font-black">{Number(agent.commission_rate || 0).toFixed(0)}%</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-bold uppercase text-slate-400">Konversiya</div>
                      <div className="mt-1 text-2xl font-black">{conversionRate}%</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-bold uppercase text-slate-400">Kod</div>
                      <div className="mt-1 truncate text-xl font-black">{agent.referral_code || 'Yaradılmayıb'}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-white p-4 text-slate-950 shadow-sm sm:p-5">
                  {agent.referral_code ? (
                    <div className="flex h-full flex-col justify-between gap-5">
                      <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-700">
                          <CheckCircle2 className="h-5 w-5" />
                          Link aktivdir
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-bold uppercase text-slate-400">Referral link</div>
                          <div className="mt-2 break-all text-sm font-bold text-slate-900">{referralLink}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={copyReferral} className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 font-black text-white transition hover:bg-blue-700">
                          <Copy className="w-4 h-4" />
                          Kopyala
                        </button>
                        <a href={referralLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 font-black text-white transition hover:bg-slate-800">
                          Aç
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                      Referral kodu bot backenddə/admin tərəfdə təsdiqlənəndən sonra burada görünəcək.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Lead', value: totals.leads, icon: Users, tone: 'bg-orange-50 text-orange-700' },
                { label: 'Satış məbləği', value: money(totals.sales), icon: TrendingUp, tone: 'bg-blue-50 text-blue-700' },
                { label: 'Komissiya', value: money(totals.commission), icon: Wallet, tone: 'bg-emerald-50 text-emerald-700' },
                { label: 'Ödənilib', value: money(totals.paid), icon: Wallet, tone: 'bg-slate-100 text-slate-700' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-slate-500">{item.label}</div>
                    <div className="mt-1 text-3xl font-black text-slate-950">{item.value}</div>
                  </div>
                );
              })}
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Son müraciətlər və satışlar</h2>
                  <p className="text-sm text-slate-500">Kliklər, baxılan paketlər və ödəniş statusları.</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {referrals.length} qeyd
                </span>
              </div>
              {referrals.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  Hələ lead və satış yoxdur. Referral kod aktiv olandan sonra WhatsApp klikləri və satışlar burada görünəcək.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {referrals.map((row) => (
                    <div key={row.id} className="grid gap-4 p-4 transition hover:bg-slate-50/80 lg:grid-cols-[140px_1fr_140px_140px] lg:items-center">
                      <div>
                        <div className="text-sm font-black text-slate-950">{new Date(row.created_at).toLocaleDateString('az-AZ')}</div>
                        <div className="mt-1 text-xs font-semibold uppercase text-slate-400">{row.product_type}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusStyle(row.status)}`}>
                            {row.status}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">{row.customer_name || row.customer_contact || 'Müştəri məlumatı yoxdur'}</span>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {parseLeadNotes(row.notes)['source'] && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                              Mənbə: {parseLeadNotes(row.notes)['source']}
                            </span>
                          )}
                          {parseLeadNotes(row.notes)['medium'] && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                              Medium: {parseLeadNotes(row.notes)['medium']}
                            </span>
                          )}
                          {parseLeadNotes(row.notes)['campaign'] && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
                              Campaign: {parseLeadNotes(row.notes)['campaign']}
                            </span>
                          )}
                        </div>
                        <div className="max-w-2xl">
                            <LeadDetails notes={row.notes} />
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 lg:text-right">
                        <div className="text-xs font-bold uppercase text-slate-400">Satış</div>
                        <div className="text-lg font-black text-slate-950">{money(row.sale_amount)}</div>
                        {row.order_reference && (
                          <div className="mt-1 text-xs font-semibold text-slate-400">Order: {row.order_reference}</div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-3 lg:text-right">
                        <div className="text-xs font-bold uppercase text-emerald-600">Komissiya</div>
                        <div className="text-lg font-black text-emerald-700">{money(row.commission_amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

