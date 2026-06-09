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

  const agentId = String(req.body?.agentId || '').trim();
  const accessCode = String(req.body?.accessCode || '').trim();

  if (!agentId || !accessCode) {
    return res.status(400).json({ error: 'Agent session is required' });
  }

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, full_name, company_name, email, referral_code, commission_rate, status')
    .eq('id', agentId)
    .eq('access_code', accessCode)
    .maybeSingle();

  if (agentError) return res.status(500).json({ error: agentError.message });
  if (!agent || agent.status === 'blocked') {
    return res.status(401).json({ error: 'Agent session is not valid' });
  }

  const { data: referrals, error: referralsError } = await supabase
    .from('agent_referrals')
    .select('id, customer_name, customer_contact, product_type, order_reference, sale_amount, commission_amount, status, notes, created_at')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (referralsError) return res.status(500).json({ error: referralsError.message });

  const rows = referrals || [];
  const totals = rows.reduce(
    (acc, row) => {
      acc.leads += 1;
      if (row.status === 'paid') {
        acc.sales += Number(row.sale_amount || 0);
        acc.commission += Number(row.commission_amount || 0);
        acc.paid += Number(row.commission_amount || 0);
      }
      return acc;
    },
    { leads: 0, sales: 0, commission: 0, paid: 0 }
  );

  return res.status(200).json({ agent, referrals: rows, totals });
}
