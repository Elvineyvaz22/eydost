import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BSQD_BOT_ID = process.env.TAXIBOOKER_BSQD_BOT_ID || '388c046c-c54f-4b56-9107-24f4ffca0600';
const BSQD_TOKEN = process.env.TAXIBOOKER_BSQD_TOKEN;

type AuthResult = { ok: true } | { ok: false; status: number; message: string };

function clean(value: unknown, max = 120) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function normalizeAffiliateCode(value: unknown) {
  return clean(value, 80).replace(/[^a-zA-Z0-9_-]/g, '');
}

async function verifyAdmin(req: VercelRequest): Promise<AuthResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, status: 500, message: 'Supabase auth env not configured' };
  }

  const auth = req.headers.authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, message: 'Missing bearer token' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, message: 'Invalid session' };

  const role = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'admin') return { ok: false, status: 403, message: 'Admin role required' };

  return { ok: true };
}

function resolveExpireDate(value: unknown) {
  const explicit = clean(value, 20);
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear.toISOString().slice(0, 10);
}

async function sendToBsqd(action: 'put' | 'delete', affiliateCode: string, expireDate?: string) {
  if (!BSQD_TOKEN) {
    return { status: 500, body: { error: 'TAXIBOOKER_BSQD_TOKEN not configured' } };
  }

  const eventName = action === 'delete' ? 'affiliate_DEL' : 'affiliate_PUT';
  const url = `https://bsqd.me/api/bot/${BSQD_BOT_ID}/master/event/${eventName}`;
  const payload =
    action === 'delete'
      ? { affiliate_code: affiliateCode }
      : { affiliate_code: affiliateCode, expire_date: expireDate };

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BSQD_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  const body = text ? safeJson(text) : { ok: upstream.ok };
  return { status: upstream.ok ? 200 : 502, body: { ok: upstream.ok, upstream_status: upstream.status, upstream_body: body } };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await verifyAdmin(req);
  if (auth.ok !== true) return res.status(auth.status).json({ error: auth.message });

  const affiliateCode = normalizeAffiliateCode(req.body?.affiliate_code || req.body?.referral_code || req.body?.code);
  if (!affiliateCode) return res.status(400).json({ error: 'affiliate_code is required' });

  const actionRaw = clean(req.body?.action || req.body?.status, 20).toLowerCase();
  const action: 'put' | 'delete' =
    ['delete', 'del', 'remove', 'paused', 'blocked', 'inactive'].includes(actionRaw) ? 'delete' : 'put';

  const result = await sendToBsqd(action, affiliateCode, resolveExpireDate(req.body?.expire_date));
  return res.status(result.status).json(result.body);
}
