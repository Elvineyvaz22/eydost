import type { VercelRequest } from '@vercel/node';

const BOT_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;

export function botApiConfigured() {
  return Boolean(PUBLIC_API_KEY && PUBLIC_API_AUTH_TOKEN);
}

function clean(value: unknown, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function authHeaders(agentToken?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': PUBLIC_API_KEY || '',
    'x-auth-token': PUBLIC_API_AUTH_TOKEN || '',
    'x-public-api-key': PUBLIC_API_KEY || '',
    'x-api-auth-token': PUBLIC_API_AUTH_TOKEN || '',
  };

  if (agentToken) headers.Authorization = `Bearer ${agentToken}`;
  return headers;
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

export async function callBotAgentApi(path: string, options: {
  method?: 'GET' | 'POST';
  token?: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
} = {}) {
  const url = new URL(path, BOT_API_BASE_URL);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    const single = clean(value);
    if (single) url.searchParams.set(key, single);
  });

  const upstream = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: authHeaders(options.token),
    body: options.method === 'POST' ? JSON.stringify(options.body || {}) : undefined,
  });

  const payload = await readJson(upstream);
  if (!upstream.ok) {
    const message =
      payload?.error ||
      payload?.detail ||
      payload?.message ||
      `Bot API error (${upstream.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return payload;
}

export function unwrapData(payload: any) {
  return payload?.data ?? payload?.agent ?? payload;
}

export function pickAgentToken(payload: any) {
  return clean(
    payload?.access_token ||
    payload?.token ||
    payload?.agent_token ||
    payload?.data?.access_token ||
    payload?.data?.token ||
    payload?.data?.agent_token,
    2000
  );
}

export function normalizeAgent(raw: any, fallback: Record<string, unknown> = {}) {
  const agent = unwrapData(raw) || {};
  return {
    id: clean(agent.id ?? agent.agent_id ?? fallback.agentId ?? fallback.email),
    full_name: clean(agent.full_name ?? agent.fullName ?? agent.name ?? fallback.fullName ?? fallback.email),
    company_name: clean(agent.company_name ?? agent.companyName ?? agent.company ?? fallback.companyName ?? 'Agent'),
    email: clean(agent.email ?? fallback.email).toLowerCase(),
    referral_code: clean(agent.referral_code ?? agent.referralCode ?? agent.promo_code ?? agent.promoCode) || null,
    commission_rate: Number(agent.commission_rate ?? agent.commissionRate ?? 10),
    status: clean(agent.status ?? (agent.approved === false ? 'pending' : 'active')) || 'active',
  };
}

export function getAgentTokenFromRequest(req: VercelRequest) {
  return clean(
    req.body?.agentToken ||
    req.body?.token ||
    req.headers.authorization?.toString().replace(/^Bearer\s+/i, ''),
    2000
  );
}
