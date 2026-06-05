import { FormEvent, useEffect, useState } from 'react';
import { Copy, ExternalLink, Globe2, Laptop, Loader2, LogOut, MapPin, Package, Plus, Smartphone, TrendingUp, Users, Wallet } from 'lucide-react';
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

  return (
    <div className="min-w-[280px] max-w-md">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex gap-2">
          <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Baxdığı paket</div>
            <div className="text-sm font-bold text-slate-900 leading-snug">{packageText}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
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
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totals, setTotals] = useState<Totals>({ leads: 0, sales: 0, commission: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [savingReferral, setSavingReferral] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState('');
  const [error, setError] = useState('');

  const rawSession = localStorage.getItem('eydost_agent_session');

  const load = async () => {
    if (!rawSession) {
      setLoading(false);
      return;
    }

    try {
      const session = JSON.parse(rawSession);
      if (!session?.agentId || !session?.accessCode) {
        localStorage.removeItem('eydost_agent_session');
        navigate('/agent/login', { replace: true });
        return;
      }

      const response = await fetch('/api/agent-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: session.agentId, accessCode: session.accessCode }),
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

  const createReferral = async (event: FormEvent) => {
    event.preventDefault();
    if (!rawSession) return;
    setSavingReferral(true);
    setError('');

    try {
      const session = JSON.parse(rawSession);
      const response = await fetch('/api/agent-create-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: session.agentId,
          accessCode: session.accessCode,
          referralCode: newReferralCode,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Referral kod yaradilmadi');
      setAgent(payload.agent);
      setNewReferralCode('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Referral kod yaradilmadi');
    } finally {
      setSavingReferral(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="Agent Dashboard" noIndex canonicalPath="/agent/dashboard" />
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">Ey Dost Agent</div>
            <div className="text-sm text-gray-500">{agent?.company_name || 'Agent panel'}</div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200">
            <LogOut className="w-4 h-4" />
            Cixis
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex items-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Yuklenir...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700 font-semibold">{error}</div>
        ) : agent ? (
          <div className="space-y-6">
            <section className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Salam, {agent.full_name}</h1>
                  <p className="text-gray-600 mt-1">Referral kodu yaradildiqdan sonra linkinizi paylasa ve neticeleri burada izleye bilersiniz.</p>
                </div>
                {agent.referral_code && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={copyReferral} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">
                      <Copy className="w-4 h-4" />
                      Linki kopyala
                    </button>
                    <a
                      href={`https://eydost.com/esim?ref=${agent.referral_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800"
                    >
                      Ac
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {agent.referral_code ? (
                <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm">
                  <b>Referral link:</b> https://eydost.com/esim?ref={agent.referral_code}
                </div>
              ) : agent.status === 'active' ? (
                <form onSubmit={createReferral} className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Referral kod yaradin</span>
                    <div className="mt-2 flex flex-col sm:flex-row gap-3">
                      <input
                        required
                        minLength={4}
                        value={newReferralCode}
                        onChange={(e) => setNewReferralCode(e.target.value)}
                        placeholder="mes: elvinagenti10"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
                      />
                      <button
                        type="submit"
                        disabled={savingReferral}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-60"
                      >
                        {savingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Yarat
                      </button>
                    </div>
                  </label>
                </form>
              ) : (
                <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 font-semibold">
                  Hesabiniz admin icazesi gozleyir. Icaze verilenden sonra referral kodu bu panelden ozunuz yaradacaqsiniz.
                </div>
              )}
            </section>

            <section className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Lead', value: totals.leads, icon: Users },
                { label: 'Satis meblegi', value: `$${totals.sales.toFixed(2)}`, icon: TrendingUp },
                { label: 'Komissiya', value: `$${totals.commission.toFixed(2)}`, icon: Wallet },
                { label: 'Odenilib', value: `$${totals.paid.toFixed(2)}`, icon: Wallet },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <Icon className="w-5 h-5 text-orange-600 mb-3" />
                    <div className="text-sm text-gray-500">{item.label}</div>
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                  </div>
                );
              })}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Son muracietler ve satislar</h2>
              </div>
              {referrals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Hele lead ve satis yoxdur. Referral kod aktiv olandan sonra WhatsApp klikleri ve satislar burada gorunecek.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left p-3">Tarix</th>
                        <th className="text-left p-3">Musteri</th>
                        <th className="text-left p-3">Xidmet</th>
                        <th className="text-left p-3">Detal</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-right p-3">Satis</th>
                        <th className="text-right p-3">Komissiya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100">
                          <td className="p-3">{new Date(row.created_at).toLocaleDateString('az-AZ')}</td>
                          <td className="p-3">{row.customer_name || row.customer_contact || '-'}</td>
                          <td className="p-3">{row.product_type}</td>
                          <td className="p-3">
                            <LeadDetails notes={row.notes} />
                          </td>
                          <td className="p-3">{row.status}</td>
                          <td className="p-3 text-right">${Number(row.sale_amount || 0).toFixed(2)}</td>
                          <td className="p-3 text-right">${Number(row.commission_amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

