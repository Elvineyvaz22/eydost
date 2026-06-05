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

function cleanText(value: unknown, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function isStrongAccessCode(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const fullName = cleanText(req.body?.fullName);
  const companyName = cleanText(req.body?.companyName);
  const email = cleanText(req.body?.email).toLowerCase();
  const accessCode = cleanText(req.body?.accessCode, 40);
  const partnerType = cleanText(req.body?.partnerType || 'agency', 40) || 'agency';

  if (!fullName || !companyName || !email || !accessCode) {
    return res.status(400).json({ error: 'Ad, sirket adi, email ve giris kodu teleb olunur' });
  }

  if (!isStrongAccessCode(accessCode)) {
    return res.status(400).json({ error: 'Giris kodu minimum 8 simvol, 1 boyuk herf ve 1 reqem olmalidir' });
  }

  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existingAgent) {
    return res.status(409).json({ error: 'Bu email ile agent artiq movcuddur' });
  }

  const { data, error } = await supabase
    .from('agents')
    .insert({
      full_name: fullName,
      company_name: companyName,
      email,
      whatsapp: null,
      partner_type: partnerType,
      referral_code: null,
      access_code: accessCode,
      commission_rate: 10,
      status: 'pending',
    })
    .select('id, full_name, company_name, email, referral_code, access_code, commission_rate, status')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ agent: data });
}
