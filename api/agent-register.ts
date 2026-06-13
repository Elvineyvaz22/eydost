import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;

function clean(value: unknown, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function isStrongAccessCode(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

function botApiConfigured() {
  return Boolean(PUBLIC_API_KEY && PUBLIC_API_AUTH_TOKEN);
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
    const registerPayload = await callBotAgentApi('/api/agents/register', 'POST', {
      email,
      password: accessCode,
      phone_number: phoneNumber,
    });

    const loginPayload = await callBotAgentApi('/api/agents/login', 'POST', {
      email,
      password: accessCode,
    }).catch(() => null);

    return res.status(200).json({
      agent: normalizeAgent(loginPayload || registerPayload, { fullName, companyName, email }),
      agentToken: loginPayload ? pickAgentToken(loginPayload) : null,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Qeydiyyat alinmadi' });
  }
}
