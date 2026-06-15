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

function normalizeReferralCode(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const agentId = String(req.body?.agentId || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const accessCode = String(req.body?.accessCode || '').trim();
  const referralCode = normalizeReferralCode(req.body?.referralCode);

  if ((!agentId && !email) || !accessCode || !referralCode) {
    return res.status(400).json({ error: 'Agent session və referral kod tələb olunur' });
  }

  if (referralCode.length < 4) {
    return res.status(400).json({ error: 'Referral kod ən azı 4 simvol olmalıdır' });
  }

  let agentQuery = supabase
    .from('agents')
    .select('id, referral_code, status, email')
    .eq('access_code', accessCode);

  if (email) {
    agentQuery = agentQuery.eq('email', email);
  } else {
    agentQuery = agentQuery.eq('id', agentId);
  }

  const { data: agent, error: agentError } = await agentQuery.maybeSingle();

  if (agentError) return res.status(500).json({ error: agentError.message });
  if (!agent) return res.status(401).json({ error: 'Agent session düzgün deyil' });
  if (agent.status === 'blocked') {
    return res.status(403).json({ error: 'Agent bloklanıb' });
  }
  const existingAgentCode = normalizeReferralCode(agent.referral_code);
  if (existingAgentCode && !existingAgentCode.startsWith('pending-')) {
    return res.status(409).json({ error: 'Referral kod artıq yaradılıb' });
  }

  const { data: existingCode } = await supabase
    .from('agents')
    .select('id')
    .eq('referral_code', referralCode)
    .maybeSingle();
  if (existingCode && existingCode.id !== agent.id) {
    return res.status(409).json({ error: 'Bu referral kod artıq istifadə olunur' });
  }

  const { data, error } = await supabase
    .from('agents')
    .update({ referral_code: referralCode, status: 'pending' })
    .eq('id', agent.id)
    .select('id, full_name, company_name, email, referral_code, commission_rate, status')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ agent: data });
}
