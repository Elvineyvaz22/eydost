import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.TAXIBOOKER_TRIP_WEBHOOK_SECRET;
const TAXI_COMMISSION_PERCENT = Number(process.env.TAXI_AGENT_COMMISSION_PERCENT || 5);

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function clean(value: unknown, max = 160) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return '';
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function normalizeAffiliateCode(value: unknown) {
  return clean(value, 80).replace(/[^a-zA-Z0-9_-]/g, '');
}

function moneyToUsd(value: unknown, currency: unknown) {
  const amount = firstNumber(value);
  if (!amount) return 0;

  const code = firstString(currency).toUpperCase();
  if (code === 'AZN') return Number((amount / 1.7).toFixed(2));
  return Number(amount.toFixed(2));
}

function verifyWebhook(req: VercelRequest) {
  if (!WEBHOOK_SECRET) return false;

  const bearer = req.headers.authorization;
  const bearerToken = typeof bearer === 'string' && bearer.startsWith('Bearer ') ? bearer.slice(7).trim() : '';
  const headerToken = firstString(req.headers['x-taxibooker-webhook-secret']);
  const bodyToken = firstString(req.body?.secret);
  return [bearerToken, headerToken, bodyToken].includes(WEBHOOK_SECRET);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!WEBHOOK_SECRET) return res.status(500).json({ error: 'TAXIBOOKER_TRIP_WEBHOOK_SECRET not configured' });
  if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid webhook secret' });

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase env not configured' });

  const rawBody = req.body || {};
  const body = rawBody.data && typeof rawBody.data === 'object'
    ? { ...rawBody, ...(rawBody.data as Record<string, unknown>) }
    : rawBody;

  const affiliateCode = normalizeAffiliateCode(
    body.affiliate_code ||
    body.affiliateCode ||
    body.referral_code ||
    body.agent_code ||
    body.promo_code
  );
  const tripId = firstString(body.trip_id, body.tripId, body.booking_id, body.bookingId, body.id);
  const tripFare = firstNumber(body.tripfare, body.trip_fare, body.fare, body.tripFare, body.amount, body.total);
  const currency = firstString(body.currency, body.trip_currency, body.fare_currency) || 'USD';

  if (!affiliateCode) return res.status(400).json({ error: 'affiliate_code is required' });
  if (!tripId) return res.status(400).json({ error: 'trip_id is required' });
  if (!tripFare) return res.status(400).json({ error: 'tripfare is required' });

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, referral_code, commission_rate, status')
    .eq('referral_code', affiliateCode)
    .maybeSingle();

  if (agentError) return res.status(500).json({ error: agentError.message });
  if (!agent || agent.status !== 'active') {
    return res.status(404).json({ error: 'Active agent not found for affiliate code' });
  }

  const explicitUsd = firstNumber(body.tripfare_usd, body.trip_fare_usd, body.sale_amount_usd, body.amount_usd);
  const saleAmountUsd = explicitUsd ? Number(explicitUsd.toFixed(2)) : moneyToUsd(tripFare, currency);
  const commissionRate = TAXI_COMMISSION_PERCENT;
  const commissionAmount = Number((saleAmountUsd * (commissionRate / 100)).toFixed(2));
  const now = new Date().toISOString();

  const payload = {
    agent_id: agent.id,
    customer_name: firstString(body.customer_name, body.name, body.passenger_name) || null,
    customer_contact: firstString(body.customer_contact, body.phone, body.email, body.whatsapp, body.passenger_phone) || null,
    product_type: 'taxi',
    order_reference: tripId,
    sale_amount: saleAmountUsd,
    commission_amount: commissionAmount,
    status: 'paid',
    notes: [
      `Taxi trip started`,
      `Trip ID: ${tripId}`,
      `Affiliate code: ${affiliateCode}`,
      `Trip fare: ${tripFare}`,
      `Currency: ${currency}`,
      firstString(body.pickup, body.pickup_address) ? `Pickup: ${firstString(body.pickup, body.pickup_address)}` : '',
      firstString(body.destination, body.dropoff, body.dropoff_address) ? `Destination: ${firstString(body.destination, body.dropoff, body.dropoff_address)}` : '',
    ].filter(Boolean).join('\n'),
    updated_at: now,
  };

  const { data: existing } = await supabase
    .from('agent_referrals')
    .select('id')
    .eq('agent_id', agent.id)
    .eq('order_reference', tripId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('agent_referrals')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, updated: true, referral: data });
  }

  const { data, error } = await supabase
    .from('agent_referrals')
    .insert(payload)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, updated: false, referral: data });
}
