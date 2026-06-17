import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const BOT_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function clean(value: unknown, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function firstHeader(req: VercelRequest, name: string) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeAgent(raw: any, fallbackEmail: string) {
  const data = raw?.data ?? raw;
  const agent = data?.agent ?? data;
  const firstCode = Array.isArray(data?.codes) ? data.codes[0] : null;

  return {
    id: clean(agent?.id ?? fallbackEmail),
    full_name: clean(agent?.full_name ?? agent?.name ?? fallbackEmail),
    company_name: clean(agent?.company_name ?? agent?.company ?? 'Agent'),
    email: clean(agent?.email ?? fallbackEmail).toLowerCase(),
    referral_code: clean(agent?.referral_code ?? firstCode?.referral_code ?? firstCode?.code) || null,
    commission_rate: Number(agent?.commission_rate ?? 10),
    status: clean(agent?.status ?? (agent?.is_active === false ? 'pending' : 'active')) || 'active',
  };
}

function pickAgentToken(raw: any) {
  return clean(
    raw?.access_token ||
    raw?.token ||
    raw?.agent_token ||
    raw?.data?.access_token ||
    raw?.data?.token ||
    raw?.data?.agent_token,
    2000
  );
}

async function recordAgentLogin(req: VercelRequest, agent: ReturnType<typeof normalizeAgent>) {
  const supabase = getSupabase();
  if (!supabase || !agent.email) return;

  try {
    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('email', agent.email)
      .maybeSingle();

    await supabase.from('agent_login_events').insert({
      agent_id: data?.id || null,
      email: agent.email,
      event_type: 'login',
      ip_country: clean(firstHeader(req, 'x-vercel-ip-country'), 40) || null,
      ip_region: clean(firstHeader(req, 'x-vercel-ip-country-region'), 80) || null,
      ip_city: clean(firstHeader(req, 'x-vercel-ip-city'), 80) || null,
      user_agent: clean(firstHeader(req, 'user-agent'), 300) || null,
    });
  } catch (error) {
    console.warn('[agent-login] login analytics skipped:', error);
  }
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PUBLIC_API_KEY || !PUBLIC_API_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const email = clean(req.body?.email, 320).toLowerCase();
  const password = clean(req.body?.password || req.body?.accessCode || req.body?.access_code, 200);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const upstream = await fetch(new URL('/api/agents/login', BOT_API_BASE_URL).toString(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': PUBLIC_API_KEY,
        'x-auth-token': PUBLIC_API_AUTH_TOKEN,
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await readJson(upstream);
    if (!upstream.ok) {
      const detail = payload?.detail || payload?.error || payload?.message || 'Giris alinmadi';
      return res.status(upstream.status).json({ error: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    }

    const agentToken = pickAgentToken(payload);
    if (!agentToken) {
      return res.status(502).json({ error: 'Agent token did not return from bot API' });
    }

    const agent = normalizeAgent(payload, email);
    await recordAgentLogin(req, agent);

    return res.status(200).json({
      agent,
      agentToken,
    });
  } catch (error: any) {
    console.error('[agent-login] error:', error);
    return res.status(502).json({ error: error?.message || 'Bot API login failed' });
  }
}
