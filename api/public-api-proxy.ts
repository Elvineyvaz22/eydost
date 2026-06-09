import type { VercelRequest, VercelResponse } from '@vercel/node';

const PUBLIC_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;

const DEFAULT_ALLOWED_ORIGINS = ['https://eydost.com', 'https://eydost.az'];
const DEFAULT_ALLOWED_HOSTS = ['eydost.com', 'eydost.az'];

const ALLOWED_PATH_PREFIXES = [
  '/api/public/',
  '/public/',
];

function splitEnvList(value: string | undefined, fallback: string[]) {
  const items = (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, '').toLowerCase();
}

function normalizeHost(value: string) {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
}

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return true;
  const allowed = splitEnvList(process.env.PUBLIC_API_ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS)
    .map(normalizeOrigin);
  return allowed.includes(normalizeOrigin(origin));
}

function isAllowedHost(host: string | undefined) {
  if (!host) return true;
  const cleanHost = normalizeHost(host).split(':')[0];
  const allowed = splitEnvList(process.env.PUBLIC_API_ALLOWED_HOSTS, DEFAULT_ALLOWED_HOSTS)
    .map(normalizeHost)
    .map((item) => item.split(':')[0]);
  return allowed.includes(cleanHost) || cleanHost.endsWith('.vercel.app');
}

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function cleanProxyPath(rawPath: string) {
  const decoded = decodeURIComponent(rawPath || '').trim();
  if (!decoded.startsWith('/')) return '';
  if (decoded.includes('://')) return '';
  if (decoded.includes('..')) return '';
  if (!ALLOWED_PATH_PREFIXES.some((prefix) => decoded.startsWith(prefix))) return '';
  return decoded;
}

async function readJsonBody(req: VercelRequest) {
  if (!req.body) return undefined;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return req.body;
    }
  }
  return req.body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    const origin = String(req.headers.origin || '');
    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(origin));
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!PUBLIC_API_KEY || !PUBLIC_API_AUTH_TOKEN) {
    console.error('[public-api-proxy] PUBLIC_API_KEY or PUBLIC_API_AUTH_TOKEN is missing');
    return res.status(500).json({ ok: false, error: 'Server configuration error' });
  }

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;

  if (!isAllowedOrigin(origin) || !isAllowedHost(host)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const proxyPath = cleanProxyPath(getSingleQueryValue(req.query.path as string | string[] | undefined));
  if (!proxyPath) {
    return res.status(400).json({
      ok: false,
      error: 'Valid public API path is required',
    });
  }

  const url = new URL(proxyPath, PUBLIC_API_BASE_URL);
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    const single = getSingleQueryValue(value as string | string[] | undefined);
    if (single) url.searchParams.set(key, single);
  }

  try {
    const body = req.method === 'POST' ? await readJsonBody(req) : undefined;
    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': PUBLIC_API_KEY,
        'x-auth-token': PUBLIC_API_AUTH_TOKEN,
        'x-public-api-key': PUBLIC_API_KEY,
        'x-api-auth-token': PUBLIC_API_AUTH_TOKEN,
        Authorization: `Bearer ${PUBLIC_API_AUTH_TOKEN}`,
      },
      body: req.method === 'POST' ? JSON.stringify(body || {}) : undefined,
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';

    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(origin));
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Content-Type', contentType);
    if (req.method === 'GET' && proxyPath === '/api/public/packages') {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    return res.status(upstream.status).send(text);
  } catch (error: any) {
    console.error('[public-api-proxy] upstream error:', error);
    return res.status(502).json({
      ok: false,
      error: error?.message || 'Upstream error',
    });
  }
}
