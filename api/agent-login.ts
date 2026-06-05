import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const accessCode = String(req.body?.accessCode || '').trim();

  if (!email || !accessCode) {
    return res.status(400).json({ error: 'Email and access code are required' });
  }

  const { data, error } = await supabase
    .from('agents')
    .select('id, full_name, company_name, email, referral_code, commission_rate, status')
    .eq('email', email)
    .eq('access_code', accessCode)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.status === 'blocked') {
    return res.status(401).json({ error: 'Agent tapılmadı və ya giriş bloklanıb' });
  }

  return res.status(200).json({ agent: data });
}
