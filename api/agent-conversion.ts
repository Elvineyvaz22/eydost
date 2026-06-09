import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function moneyToUsd(value: unknown, currency: unknown) {
  const amount = firstNumber(value);
  if (!amount) return 0;
  return firstString(currency).toUpperCase() === 'AZN'
    ? Number((amount / 1.7).toFixed(2))
    : Number(amount.toFixed(2));
}

function normalizeStatus(value: unknown) {
  const status = firstString(value).toLowerCase();
  if (['paid', 'success', 'succeeded', 'completed', 'done'].includes(status)) return 'paid';
  if (['confirmed', 'confirmed_payment', 'confirmed-order'].includes(status)) return 'confirmed';
  if (['cancelled', 'canceled', 'declined', 'failed', 'error'].includes(status)) return 'cancelled';
  if (['lead', 'view', 'clicked', 'opened', 'created'].includes(status)) return 'lead';
  return 'confirmed';
}

function extractReferralCode(body: Record<string, unknown>) {
  const directCode = firstString(
    body.referral_code,
    body.ref,
    body.agent_code,
    body.discount_code,
    body.promo_code
  );
  if (directCode) return directCode.replace(/[^a-zA-Z0-9_-]/g, '');

  const message = firstString(body.message, body.notes);
  if (!message) return '';

  const labeledMatch = message.match(
    /(?:endirim\s*kodu|indirim\s*kodu|promo\s*code|referral\s*code|agent\s*code|kod)\s*[:=-]?\s*([a-zA-Z0-9_-]{2,64})/i
  );
  if (labeledMatch?.[1]) return labeledMatch[1];

  const trimmed = message.trim();
  if (/^[a-zA-Z0-9_-]{2,64}$/.test(trimmed)) return trimmed;

  return '';
}

function buildReferralNotes(body: Record<string, unknown>) {
  const lines: string[] = [];
  const viewedPackage = firstString(
    body.viewed_package,
    body.viewedPackage,
    body.package_name,
    body.package,
    body.package_title
  );
  const packageCode = firstString(body.package_code, body.packageCode);
  const rawNotes = firstString(body.notes);

  if (viewedPackage) lines.push(`Package: ${viewedPackage}`);
  if (packageCode) lines.push(`Package code: ${packageCode}`);
  if (rawNotes) lines.push(`Notes: ${rawNotes}`);

  return lines.join('\n') || null;
}

function pickMetadataFromNotes(notes: string | null) {
  if (!notes) return {};
  const out: Record<string, string> = {};
  for (const line of notes.split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (!key || !value) continue;
    out[key] = value;
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (WEBHOOK_SECRET) {
    const provided = firstString(req.headers['x-agent-webhook-secret'], req.body?.secret);
    if (provided !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const rawBody = req.body || {};
  const body = (rawBody.data && typeof rawBody.data === 'object')
    ? { ...rawBody, ...(rawBody.data as Record<string, unknown>) }
    : rawBody;
  const referralCode = extractReferralCode(body);

  const orderReference = firstString(
    body.order_reference,
    body.order_id,
    body.payment_id,
    body.transaction_id,
    body.invoice_id,
    body.provider_order_no
  );
  const saleAmount = firstNumber(
    body.sale_amount,
    body.sell_price,
    body.amount,
    body.paid_amount,
    body.payment_amount,
    body.charged_amount,
    body.final_amount,
    body.discounted_price,
    body.checkout_amount,
    body.total_paid,
    body.total
  );
  const saleAmountUsd = moneyToUsd(saleAmount, body.currency);
  const productType = firstString(body.product_type, body.type) || 'esim';
  const status = normalizeStatus(
    body.status ||
    body.order_status ||
    body.payment_status ||
    body.event ||
    body.event_type
  );

  if (!referralCode) {
    return res.status(400).json({ error: 'referral_code is required' });
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

  const { data: recentLead } = await supabase
    .from('agent_referrals')
    .select('notes')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const leadMetadata =
    (recentLead || [])
      .map((row) => pickMetadataFromNotes(row.notes))
      .find((meta) => meta['source'] || meta['utm source'] || meta['medium'] || meta['campaign']) || {};

  const commissionAmount = Number(((saleAmountUsd * Number(agent.commission_rate || 0)) / 100).toFixed(2));
  const payload = {
    agent_id: agent.id,
    customer_name: firstString(body.customer_name, body.name) || null,
    customer_contact: firstString(body.customer_contact, body.phone, body.email, body.whatsapp) || null,
    product_type: ['esim', 'taxi', 'other'].includes(productType) ? productType : 'esim',
    order_reference: orderReference || null,
    sale_amount: saleAmountUsd,
    commission_amount: commissionAmount,
    status: ['lead', 'confirmed', 'paid', 'cancelled'].includes(status) ? status : 'confirmed',
    notes: [
      buildReferralNotes(body),
      leadMetadata['source'] ? `Source: ${leadMetadata['source']}` : '',
      leadMetadata['medium'] ? `Medium: ${leadMetadata['medium']}` : '',
      leadMetadata['campaign'] ? `Campaign: ${leadMetadata['campaign']}` : '',
    ].filter(Boolean).join('\n') || null,
    updated_at: new Date().toISOString(),
  };

  if (orderReference) {
    const { data: existing } = await supabase
      .from('agent_referrals')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('order_reference', orderReference)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('agent_referrals')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, referral: data, updated: true });
    }
  }

  const { data, error } = await supabase
    .from('agent_referrals')
    .insert(payload)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, referral: data, updated: false });
}
