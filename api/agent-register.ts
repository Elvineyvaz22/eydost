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

function clean(value: unknown, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function isStrongAccessCode(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

function botApiConfigured() {
  return Boolean(PUBLIC_API_KEY && PUBLIC_API_AUTH_TOKEN);
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

function normalizeAgent(raw: any, fallback: Record<string, unknown>) {
  const data = raw?.data ?? raw ?? {};
  const agent = data?.agent ?? data;
  const firstCode = Array.isArray(data?.codes) ? data.codes[0] : null;

  return {
    id: clean(agent?.id ?? fallback.email),
    full_name: clean(agent?.full_name ?? agent?.name ?? fallback.fullName ?? fallback.email),
    company_name: clean(agent?.company_name ?? agent?.company ?? fallback.companyName ?? 'Agent'),
    email: clean(agent?.email ?? fallback.email).toLowerCase(),
    referral_code: clean(agent?.referral_code ?? firstCode?.referral_code ?? firstCode?.code) || null,
    commission_rate: Number(agent?.commission_rate ?? 15),
    status: clean(agent?.status ?? (agent?.is_active === false ? 'pending' : 'active')) || 'active',
  };
}

async function callBotAgentApi(path: string, method: 'POST', body: Record<string, unknown>) {
  const upstream = await fetch(new URL(path, BOT_API_BASE_URL).toString(), {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': PUBLIC_API_KEY || '',
      'x-auth-token': PUBLIC_API_AUTH_TOKEN || '',
    },
    body: JSON.stringify(body),
  });

  const payload = await readJson(upstream);
  if (!upstream.ok) {
    const detail = payload?.detail || payload?.error || payload?.message || `Bot API error (${upstream.status})`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return payload;
}

async function mirrorAgentToSupabase(agent: ReturnType<typeof normalizeAgent>, values: {
  fullName: string;
  companyName: string;
  phoneNumber: string;
  accessCode: string;
}) {
  const supabase = getSupabase();
  if (!supabase || !agent.email) return;

  const referralCode =
    clean(agent.referral_code, 80).replace(/[^a-zA-Z0-9_-]/g, '') ||
    `pending-${clean(agent.id || agent.email, 40).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  await supabase
    .from('agents')
    .upsert(
      {
        application_id: null,
        full_name: values.fullName || agent.full_name || agent.email,
        company_name: values.companyName || agent.company_name || 'Agent',
        email: agent.email,
        whatsapp: values.phoneNumber || null,
        partner_type: 'agency',
        referral_code: referralCode,
        access_code: values.accessCode,
        commission_rate: 15,
        status: agent.referral_code ? 'active' : 'pending',
      },
      { onConflict: 'email' }
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!botApiConfigured()) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const fullName = clean(req.body?.fullName || req.body?.full_name);
  const companyName = clean(req.body?.companyName || req.body?.company_name);
  const email = clean(req.body?.email, 320).toLowerCase();
  const phoneNumber = clean(req.body?.phoneNumber || req.body?.phone_number, 50);
  const accessCode = clean(req.body?.accessCode || req.body?.password, 200);

  if (!fullName || !companyName || !email || !phoneNumber || !accessCode) {
    return res.status(400).json({ error: 'Ad, sirket adi, telefon, email ve giris kodu teleb olunur' });
  }

  if (!isStrongAccessCode(accessCode)) {
    return res.status(400).json({ error: 'Giris kodu minimum 8 simvol, 1 boyuk herf ve 1 reqem olmalidir' });
  }

  try {
    let registerPayload: any = null;
    let registerError: Error | null = null;

    try {
      registerPayload = await callBotAgentApi('/api/agents/register', 'POST', {
        email,
        password: accessCode,
        phone_number: phoneNumber,
      });
    } catch (error: any) {
      registerError = error instanceof Error ? error : new Error(error?.message || 'Qeydiyyat alinmadi');
    }

    const loginPayload = await callBotAgentApi('/api/agents/login', 'POST', {
      email,
      password: accessCode,
    }).catch((error) => {
      if (registerError) throw registerError;
      throw error;
    });

    const agent = normalizeAgent(loginPayload || registerPayload, { fullName, companyName, email });
    await mirrorAgentToSupabase(agent, { fullName, companyName, phoneNumber, accessCode });

    return res.status(200).json({
      agent,
      agentToken: loginPayload ? pickAgentToken(loginPayload) : null,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Qeydiyyat alinmadi' });
  }
}
