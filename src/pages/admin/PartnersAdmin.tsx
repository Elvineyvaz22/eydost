import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Loader2, RefreshCw, Search, Users } from 'lucide-react';
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

export default function PartnersAdmin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [applicationsResult, agentsResult] = await Promise.all([
        supabase.from('partner_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('agents').select('*').order('created_at', { ascending: false }),
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (agentsResult.error) throw agentsResult.error;

      setApplications((applicationsResult.data || []) as Application[]);
      setAgents((agentsResult.data || []) as Agent[]);
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

        <div className="grid md:grid-cols-3 gap-4">
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
