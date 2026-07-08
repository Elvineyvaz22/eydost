import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { syncAffiliateCode, deleteAffiliateCode } from './lib/taxibooker';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function clean(value: unknown, max = 120) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

async function verifyAdmin(req: VercelRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false as const, status: 500, message: 'Supabase auth env not configured' };
  }

  const auth = req.headers.authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false as const, status: 401, message: 'Missing bearer token' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { ok: false as const, status: 401, message: 'Invalid session' };

  const role = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'admin') return { ok: false as const, status: 403, message: 'Admin role required' };

  return { ok: true as const };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  const affiliateCode = clean(req.body?.affiliate_code || req.body?.referral_code || req.body?.code, 80)
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const expireDate = clean(req.body?.expire_date, 20) || '2026-12-31';
  const action = clean(req.body?.action, 20).toLowerCase() === 'delete' ? 'delete' : 'put';

  if (!affiliateCode) {
    return res.status(400).json({ error: 'affiliate_code is required' });
  }

  const result = action === 'delete'
    ? await deleteAffiliateCode(affiliateCode)
    : await syncAffiliateCode(affiliateCode, expireDate);

  return res.status(result.ok ? 200 : result.status).json({
    ok: result.ok,
    action,
    affiliate_code: affiliateCode,
    expire_date: action === 'delete' ? null : expireDate,
    upstream_status: result.status,
    upstream_body: result.body,
    attempted: result.attempted,
  });
}

