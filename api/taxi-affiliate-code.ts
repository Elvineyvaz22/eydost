import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { deleteAffiliateCode, syncAffiliateCode } from './lib/taxibooker';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

  const result =
    action === 'delete'
      ? await deleteAffiliateCode(affiliateCode)
      : await syncAffiliateCode(affiliateCode, resolveExpireDate(req.body?.expire_date));

  return res.status(result.ok ? 200 : result.status).json({
    ok: result.ok,
    upstream_status: result.status,
    upstream_body: result.body,
    attempted: result.attempted,
  });
}
