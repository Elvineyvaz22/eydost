/**
 * Admin sync trigger — secure replacement for the old VITE_APP_API_KEY flow.
 *
 * Browser sends the user's Supabase JWT (extracted from `supabase.auth.getSession()`
 * on the client). This function verifies it server-side and, if valid, returns
 * sync status (GET) or kicks off the daily sync (POST) without ever exposing
 * a secret in the client bundle.
 *
 * Security model:
 *   - Authorisation: `Authorization: Bearer <supabase_jwt>` from the admin client.
 *   - The Supabase **anon** key (already public) is used here only to call
 *     `auth.getUser(jwt)` for verification — Supabase enforces the signature.
 *   - Triggering the actual sync uses `CRON_SECRET` from server env, which is
 *     never sent to the browser.
 *
 * Routes consumed:
 *   GET  /api/admin-sync   → returns { synced, count, synced_at }
 *   POST /api/admin-sync   → triggers /api/sync-esim-packages with CRON_SECRET
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
// Public anon key — fine to use here since we only call auth.getUser(jwt) which
// validates the JWT signature against Supabase's keys.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

type AuthResult = { ok: true } | { ok: false; status: number; message: string };

async function verifyAdmin(req: VercelRequest): Promise<AuthResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, status: 500, message: 'Supabase env not configured' };
  }
  const auth = req.headers['authorization'];
  const token =
    typeof auth === 'string' && auth.startsWith('Bearer ')
      ? auth.slice('Bearer '.length).trim()
      : '';
  if (!token) {
    return { ok: false, status: 401, message: 'Missing bearer token' };
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, message: 'Invalid session' };
  }
  // Hard role check. `app_metadata` is server-side only — a regular signed-in
  // user cannot set or change it. This is the same gate the SPA uses so the
  // backend never relies on the client's word for admin status.
  const role = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'admin') {
    return { ok: false, status: 403, message: 'Admin role required' };
  }
  return { ok: true };
}

async function getSyncStatus(): Promise<{
  synced: boolean;
  count?: number;
  synced_at?: string;
  message?: string;
}> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { synced: false, message: 'Supabase service env not configured' };
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { count } = await supabase
    .from('esim_packages')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  const { data: latest } = await supabase
    .from('esim_packages')
    .select('last_synced_at')
    .order('last_synced_at', { ascending: false })
    .limit(1);
  const syncedAt = (latest?.[0] as { last_synced_at?: string } | undefined)?.last_synced_at;
  if (!count || count === 0) {
    return { synced: false, message: 'No packages in Supabase yet' };
  }
  return { synced: true, count, synced_at: syncedAt };
}

async function triggerSync(req: VercelRequest): Promise<{ status: number; body: unknown }> {
  if (!CRON_SECRET) {
    return { status: 500, body: { error: 'CRON_SECRET not configured' } };
  }
  // Build absolute URL to /api/sync-esim-packages on the same deployment. Vercel
  // exposes the request host on `x-forwarded-host`, falling back to `host`.
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const base = host ? `${proto}://${host}` : '';
  const url = `${base}/api/sync-esim-packages`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      Accept: 'application/json',
    },
  });
  const body = await upstream.json().catch(() => ({ error: 'Non-JSON response' }));
  return { status: upstream.status, body };
}

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const auth: AuthResult = await verifyAdmin(req);
  if (auth.ok !== true) {
    return res.status(auth.status).json({ error: auth.message });
  }

  if (req.method === 'GET') {
    const status = await getSyncStatus();
    return res.status(200).json(status);
  }

  if (req.method === 'POST') {
    const result = await triggerSync(req);
    return res.status(result.status).json(result.body);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
