import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PUBLIC_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function clean(value: unknown, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function normalizeReferral(value: unknown) {
  return clean(value, 64).replace(/[^a-zA-Z0-9_-]/g, '');
}

function moneyToUsd(value: unknown, currency: unknown) {
  const amount = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return String(currency || '').toUpperCase() === 'AZN'
    ? Number((amount / 1.7).toFixed(2))
    : Number(amount.toFixed(2));
}

async function createPublicOrder(body: Record<string, unknown>) {
  const url = new URL('/api/public/orders', PUBLIC_API_BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': PUBLIC_API_KEY || '',
      'x-auth-token': PUBLIC_API_AUTH_TOKEN || '',
      'x-public-api-key': PUBLIC_API_KEY || '',
      'x-api-auth-token': PUBLIC_API_AUTH_TOKEN || '',
      Authorization: `Bearer ${PUBLIC_API_AUTH_TOKEN || ''}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { success: false, raw: text };
  }

  if (!response.ok || !json?.success) {
    throw new Error(json?.error || json?.detail || text || 'Public order API failed');
  }

  return json.data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PUBLIC_API_KEY || !PUBLIC_API_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Public API env not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const referralCode = normalizeReferral(req.body?.referralCode || req.body?.referral_code);
  const packageCode = clean(req.body?.packageCode || req.body?.package_code, 80);
  const packageSlug = clean(req.body?.packageSlug || req.body?.package_slug || packageCode, 120);
  const countryCode = clean(req.body?.countryCode || req.body?.country_code, 8).toUpperCase();
  const periodNum = Math.max(1, Number(req.body?.periodNum || req.body?.period_num || 1));
  const dataType = Number(req.body?.dataType || req.body?.data_type || 1);

  if (!referralCode || !packageCode || !countryCode) {
    return res.status(400).json({ error: 'referralCode, packageCode and countryCode are required' });
  }

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, referral_code, commission_rate, status')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (agentError) return res.status(500).json({ error: agentError.message });
  if (!agent || agent.status !== 'active') {
    return res.status(404).json({ error: 'Active agent not found for referral code' });
  }

  const order = await createPublicOrder({
    transport: 'api',
    country_code: countryCode,
    package_code: packageCode,
    package_slug: packageSlug,
    data_type: dataType,
    period_num: periodNum,
    referral_code: referralCode,
    language_code: clean(req.body?.languageCode || req.body?.language_code || 'az', 12),
  });

  const orderId = clean(order?.id || order?.order_id || order?.provider_order_no, 80);
  const currency = clean(order?.currency || 'AZN', 8);
  const saleAmount = moneyToUsd(order?.sell_price || order?.original_sell_price, currency);
  const commissionAmount = Number(((saleAmount * Number(agent.commission_rate || 0)) / 100).toFixed(2));
  const notes = [
    req.body?.packageName ? `Package: ${clean(req.body.packageName, 160)}` : '',
    `Package code: ${packageCode}`,
    `Country: ${countryCode}`,
    req.body?.viewedPackage ? `Viewed package: ${clean(req.body.viewedPackage, 180)}` : '',
  ].filter(Boolean).join('\n');

  const payload = {
    agent_id: agent.id,
    customer_name: null,
    customer_contact: null,
    product_type: 'esim',
    order_reference: orderId || null,
    sale_amount: saleAmount,
    commission_amount: commissionAmount,
    status: 'confirmed',
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  if (orderId) {
    const { data: existing } = await supabase
      .from('agent_referrals')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('order_reference', orderId)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('agent_referrals').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('agent_referrals').insert(payload);
    }
  } else {
    await supabase.from('agent_referrals').insert(payload);
  }

  return res.status(200).json({ ok: true, order, orderId, saleAmount, commissionAmount });
}
