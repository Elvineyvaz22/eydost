import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CalendarClock, CheckCircle2, Copy, Loader2, RefreshCw, Search, TrendingUp, Users } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type Application = {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string | null;
  partner_type: string;
  monthly_clients: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type Agent = {
  id: string;
  application_id: string | null;
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string | null;
  partner_type: string;
  referral_code: string | null;
  access_code: string;
  commission_rate: number;
  status: string;
  created_at: string;
};

type AgentReferral = {
  id: string;
  agent_id: string;
  sale_amount: number | null;
  commission_amount: number | null;
  status: string;
  created_at: string;
};

type AgentLoginEvent = {
  id: string;
  agent_id: string | null;
  email: string;
  event_type: string;
  ip_country: string | null;
  ip_city: string | null;
  created_at: string;
};

type AgentActivity = {
  agent: Agent;
  logins: AgentLoginEvent[];
  referrals: AgentReferral[];
  loginCount: number;
  lastLogin: string | null;
  leads: number;
  sales: number;
  saleAmount: number;
  commission: number;
  score: number;
};

function makeCode(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 18);
  return `${base || 'agent'}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function isRecent(value: string | null, hours: number) {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() <= hours * 60 * 60 * 1000;
}

export default function PartnersAdmin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentReferrals, setAgentReferrals] = useState<AgentReferral[]>([]);
  const [agentLoginEvents, setAgentLoginEvents] = useState<AgentLoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [applicationsResult, agentsResult, referralsResult, loginEventsResult] = await Promise.all([
        supabase.from('partner_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('agents').select('*').order('created_at', { ascending: false }),
        supabase
          .from('agent_referrals')
          .select('id, agent_id, sale_amount, commission_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(2000),
        supabase
          .from('agent_login_events')
          .select('id, agent_id, email, event_type, ip_country, ip_city, created_at')
          .order('created_at', { ascending: false })
          .limit(2000),
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (agentsResult.error) throw agentsResult.error;

      setApplications((applicationsResult.data || []) as Application[]);
      setAgents((agentsResult.data || []) as Agent[]);
      setAgentReferrals(referralsResult.error ? [] : ((referralsResult.data || []) as AgentReferral[]));
      setAgentLoginEvents(loginEventsResult.error ? [] : ((loginEventsResult.data || []) as AgentLoginEvent[]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Partner məlumatları yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const agentByApplication = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((agent) => {
      if (agent.application_id) map.set(agent.application_id, agent);
    });
    return map;
  }, [agents]);

  const agentActivity = useMemo<AgentActivity[]>(() => {
    const loginMap = new Map<string, AgentLoginEvent[]>();
    const referralMap = new Map<string, AgentReferral[]>();

    agentLoginEvents.forEach((event) => {
      const keys = [event.agent_id, event.email.toLowerCase()].filter(Boolean) as string[];
      keys.forEach((key) => {
        const list = loginMap.get(key) || [];
        list.push(event);
        loginMap.set(key, list);
      });
    });

    agentReferrals.forEach((referral) => {
      const list = referralMap.get(referral.agent_id) || [];
      list.push(referral);
      referralMap.set(referral.agent_id, list);
    });

    return agents
      .map((agent) => {
        const loginsById = loginMap.get(agent.id) || [];
        const loginsByEmail = loginMap.get(agent.email.toLowerCase()) || [];
        const logins = [...loginsById, ...loginsByEmail]
          .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const referrals = referralMap.get(agent.id) || [];
        const paid = referrals.filter((item) => item.status === 'paid');
        const leads = referrals.filter((item) => item.status !== 'paid').length;
        const sales = paid.length;
        const saleAmount = paid.reduce((sum, item) => sum + Number(item.sale_amount || 0), 0);
        const commission = paid.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
        const lastLogin = logins[0]?.created_at || null;
        const score = logins.length * 2 + leads * 3 + sales * 10 + saleAmount;

        return {
          agent,
          logins,
          referrals,
          loginCount: logins.length,
          lastLogin,
          leads,
          sales,
          saleAmount,
          commission,
          score,
        };
      })
      .sort((a, b) => b.score - a.score || new Date(b.agent.created_at).getTime() - new Date(a.agent.created_at).getTime());
  }, [agents, agentLoginEvents, agentReferrals]);

  const activeLast24h = agentActivity.filter((item) => isRecent(item.lastLogin, 24)).length;
  const totalLeadCount = agentActivity.reduce((sum, item) => sum + item.leads, 0);
  const totalSalesCount = agentActivity.reduce((sum, item) => sum + item.sales, 0);

  const filteredApplications = applications.filter((item) => {
    const text = `${item.full_name} ${item.company_name} ${item.email} ${item.whatsapp || ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });
  const filteredStandaloneAgents = agents.filter((agent) => {
    if (agent.application_id) return false;
    const text = `${agent.full_name} ${agent.company_name} ${agent.email} ${agent.whatsapp || ''} ${agent.referral_code || ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const createAgent = async (application: Application) => {
    setSavingId(application.id);
    setError('');
    try {
      const referralCode = makeCode(application.company_name || application.full_name);
      const accessCode = makeAccessCode();
      const { error: insertError } = await supabase.from('agents').insert({
        application_id: application.id,
        full_name: application.full_name,
        company_name: application.company_name,
        email: application.email.toLowerCase(),
        whatsapp: application.whatsapp,
        partner_type: application.partner_type,
        referral_code: referralCode,
        access_code: accessCode,
        commission_rate: 10,
        status: 'active',
      });
      if (insertError) throw insertError;

      await supabase.from('partner_applications').update({ status: 'approved' }).eq('id', application.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent yaradılmadı');
    } finally {
      setSavingId(null);
    }
  };

  const copyAgentInfo = async (agent: Agent) => {
    const text = [
      `Agent panel: https://eydost.com/agent/login`,
      `Email: ${agent.email}`,
      `Giriş kodu: ${agent.access_code}`,
      agent.referral_code ? `Referral link: https://eydost.com/esim?ref=${agent.referral_code}` : 'Referral link: hələ yaradılmayıb',
      agent.referral_code ? `Referral kod: ${agent.referral_code}` : 'Referral kod: hələ yaradılmayıb',
    ].join('\n');
    await navigator.clipboard.writeText(text);
  };

  const updateAgentStatus = async (agent: Agent, status: 'active' | 'paused' | 'blocked') => {
    setSavingId(agent.id);
    setError('');
    try {
      const { error: updateError } = await supabase.from('agents').update({ status }).eq('id', agent.id);
      if (updateError) throw updateError;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent statusu yenilənmədi');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partnerlər və agentlər</h1>
            <p className="text-gray-600 mt-1">Müraciətləri təsdiqlə, agent kodu yarat və giriş məlumatlarını paylaş.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Yenilə
          </button>
        </div>

        {error && <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">{error}</div>}

        <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500">Müraciətlər</div>
            <div className="text-3xl font-bold text-gray-900">{applications.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500">Aktiv agentlər</div>
            <div className="text-3xl font-bold text-gray-900">{agents.filter((a) => a.status === 'active').length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500">Təsdiq gözləyən agent</div>
            <div className="text-3xl font-bold text-gray-900">{agents.filter((a) => a.status === 'pending').length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500">Agent loginləri</div>
            <div className="text-3xl font-bold text-gray-900">{agentLoginEvents.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500">24 saat aktiv</div>
            <div className="text-3xl font-bold text-gray-900">{activeLast24h}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500">Lead / satış</div>
            <div className="text-3xl font-bold text-gray-900">{totalLeadCount}/{totalSalesCount}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Agent aktivliyi və müştəri gücü
              </h2>
              <p className="text-sm text-gray-500 mt-1">Profil girişləri, referral lead-ləri və satış nəticələri eyni admin paneldə göstərilir.</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {agentActivity.length} agent
            </span>
          </div>

          {loading ? (
            <div className="p-8 flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Yüklənir...
            </div>
          ) : agentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Agent aktivliyi üçün məlumat yoxdur.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {agentActivity.slice(0, 20).map((item) => {
                const recent = isRecent(item.lastLogin, 24);
                const lastPlace = item.logins[0]
                  ? [item.logins[0].ip_country, item.logins[0].ip_city].filter(Boolean).join(' / ')
                  : '';

                return (
                  <div key={item.agent.id} className="p-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_170px_150px_150px_150px] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-black text-gray-900">{item.agent.company_name || item.agent.full_name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          item.agent.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.agent.status}
                        </span>
                        {recent && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                            <Activity className="w-3 h-3" />
                            aktiv
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {item.agent.email} {item.agent.referral_code ? `• ${item.agent.referral_code}` : ''}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-3">
                      <div className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Son giriş
                      </div>
                      <div className="mt-1 text-sm font-bold text-gray-900">{formatDateTime(item.lastLogin)}</div>
                      {lastPlace && <div className="mt-1 text-xs text-gray-500">{lastPlace}</div>}
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-3">
                      <div className="text-xs font-bold uppercase text-blue-500">Login</div>
                      <div className="mt-1 text-2xl font-black text-blue-900">{item.loginCount}</div>
                    </div>

                    <div className="rounded-2xl bg-orange-50 p-3">
                      <div className="text-xs font-bold uppercase text-orange-500">Lead</div>
                      <div className="mt-1 text-2xl font-black text-orange-900">{item.leads}</div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <div className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Satış
                      </div>
                      <div className="mt-1 text-lg font-black text-emerald-900">{item.sales} • {money(item.saleAmount)}</div>
                      <div className="text-xs font-bold text-emerald-700">Komissiya {money(item.commission)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ad, şirkət, email və ya telefon axtar"
              className="w-full outline-none"
            />
          </div>

          {loading ? (
            <div className="p-8 flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Yüklənir...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              Müraciət tapılmadı.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredApplications.map((application) => {
                const agent = agentByApplication.get(application.id);
                return (
                  <div key={application.id} className="p-5 grid lg:grid-cols-[1fr_320px] gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-gray-900">{application.company_name}</h2>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                          {application.partner_type}
                        </span>
                        {agent && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Agent yaradılıb
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><b>Ad:</b> {application.full_name}</p>
                        <p><b>Email:</b> {application.email}</p>
                        <p><b>WhatsApp:</b> {application.whatsapp || '-'}</p>
                        <p><b>Aylıq müştəri:</b> {application.monthly_clients || '-'}</p>
                        {application.message && <p><b>Mesaj:</b> {application.message}</p>}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      {agent ? (
                        <div className="space-y-3 text-sm">
                          <p><b>Referral kod:</b> {agent.referral_code || 'Hələ yaradılmayıb'}</p>
                          <p><b>Giriş kodu:</b> {agent.access_code}</p>
                          <p><b>Komissiya:</b> {agent.commission_rate}%</p>
                          <p><b>Status:</b> {agent.status}</p>
                          {agent.status !== 'active' && (
                            <button
                              disabled={savingId === agent.id}
                              onClick={() => updateAgentStatus(agent, 'active')}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
                            >
                              {savingId === agent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Təsdiq et və aktiv et
                            </button>
                          )}
                          {agent.status === 'active' && (
                            <button
                              disabled={savingId === agent.id}
                              onClick={() => updateAgentStatus(agent, 'paused')}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
                            >
                              Dayandır
                            </button>
                          )}
                          <button
                            onClick={() => copyAgentInfo(agent)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                            Giriş məlumatını kopyala
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={savingId === application.id}
                          onClick={() => createAgent(application)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:opacity-60"
                        >
                          {savingId === application.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Agent yarat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Özü qeydiyyatdan keçən agentlər</h2>
            <p className="text-sm text-gray-500 mt-1">Bu agentlər panelə girə bilir, amma status aktiv olana qədər kodları satış yazmır.</p>
          </div>

          {loading ? (
            <div className="p-8 flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Yüklənir...
            </div>
          ) : filteredStandaloneAgents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Özü qeydiyyatdan keçən agent yoxdur.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStandaloneAgents.map((agent) => (
                <div key={agent.id} className="p-5 grid lg:grid-cols-[1fr_320px] gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-lg font-bold text-gray-900">{agent.company_name}</h2>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {agent.partner_type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        agent.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><b>Ad:</b> {agent.full_name}</p>
                      <p><b>Email:</b> {agent.email}</p>
                      <p><b>WhatsApp:</b> {agent.whatsapp || '-'}</p>
                      <p><b>Referral kod:</b> {agent.referral_code || 'Agent hələ yaratmayıb'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                    <p><b>Giriş kodu:</b> {agent.access_code}</p>
                    <p><b>Komissiya:</b> {agent.commission_rate}%</p>
                    {agent.status !== 'active' ? (
                      <button
                        disabled={savingId === agent.id}
                        onClick={() => updateAgentStatus(agent, 'active')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
                      >
                        {savingId === agent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Təsdiq et və aktiv et
                      </button>
                    ) : (
                      <button
                        disabled={savingId === agent.id}
                        onClick={() => updateAgentStatus(agent, 'paused')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
                      >
                        Dayandır
                      </button>
                    )}
                    <button
                      onClick={() => copyAgentInfo(agent)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                      Giriş məlumatını kopyala
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
