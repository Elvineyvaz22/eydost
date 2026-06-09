import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;

function clean(value: unknown, max = 200) {
  return String(value || '').trim().slice(0, max);
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

    return res.status(200).json({
      agent: normalizeAgent(payload, email),
      agentToken,
    });
  } catch (error: any) {
    console.error('[agent-login] error:', error);
    return res.status(502).json({ error: error?.message || 'Bot API login failed' });
  }
}
