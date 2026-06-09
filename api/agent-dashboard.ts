import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  botApiConfigured,
  callBotAgentApi,
  getAgentTokenFromRequest,
  normalizeAgent,
  unwrapData,
} from '../src/server/botAgent';

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
      const parsed = Number(value.replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function normalizeRows(payload: any) {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.searches)) return data.searches;
  if (Array.isArray(data?.referrals)) return data.referrals;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
}

function moneyToUsd(value: unknown, currency: unknown) {
  const amount = firstNumber(value);
  if (!amount) return 0;
  return firstString(currency).toUpperCase() === 'AZN'
    ? Number((amount / 1.7).toFixed(2))
    : Number(amount.toFixed(2));
}

function normalizeStatus(row: any) {
  const status = firstString(row.status, row.payment_status, row.order_status, row.event).toLowerCase();
  if (['paid', 'success', 'succeeded', 'completed', 'done'].includes(status)) return 'paid';
  if (['confirmed', 'created', 'pending_payment'].includes(status)) return 'confirmed';
  if (['cancelled', 'canceled', 'declined', 'failed', 'error'].includes(status)) return 'cancelled';
  return 'lead';
}

function buildNotes(row: any) {
  const lines = [
    firstString(row.package_name, row.package, row.package_title, row.name)
      ? `Package: ${firstString(row.package_name, row.package, row.package_title, row.name)}`
      : '',
    firstString(row.package_code, row.packageCode) ? `Package code: ${firstString(row.package_code, row.packageCode)}` : '',
    firstString(row.country_code, row.countryCode) ? `Country: ${firstString(row.country_code, row.countryCode)}` : '',
    firstString(row.source, row.utm_source) ? `Source: ${firstString(row.source, row.utm_source)}` : '',
    firstString(row.medium, row.utm_medium) ? `Medium: ${firstString(row.medium, row.utm_medium)}` : '',
    firstString(row.campaign, row.utm_campaign) ? `Campaign: ${firstString(row.campaign, row.utm_campaign)}` : '',
    firstString(row.device) ? `Device: ${firstString(row.device)}` : '',
    firstString(row.geo, row.location) ? `Geo: ${firstString(row.geo, row.location)}` : '',
  ].filter(Boolean);

  return lines.join('\n') || firstString(row.notes) || null;
}

function normalizeReferral(row: any, index: number) {
  const currency = firstString(row.currency, 'USD');
  const saleAmount = moneyToUsd(
    row.sale_amount ??
    row.sell_price ??
    row.amount ??
    row.paid_amount ??
    row.payment_amount ??
    row.total,
    currency
  );
  const commissionAmount = moneyToUsd(row.commission_amount ?? row.commission, currency);

  return {
    id: firstString(row.id, row.order_id, row.payment_id, row.transaction_id, index),
    customer_name: firstString(row.customer_name, row.full_name, row.client_name, row.name) || null,
    customer_contact: firstString(row.customer_contact, row.phone, row.phone_number, row.email, row.whatsapp_number) || null,
    product_type: firstString(row.product_type, row.order_type, row.type) || 'esim',
    order_reference: firstString(row.order_reference, row.order_id, row.payment_id, row.transaction_id, row.provider_order_no) || null,
    sale_amount: saleAmount,
    commission_amount: commissionAmount || Number((saleAmount * 0.1).toFixed(2)),
    status: normalizeStatus(row),
    notes: buildNotes(row),
    created_at: firstString(row.created_at, row.createdAt, row.updated_at, row.date) || new Date().toISOString(),
  };
}

function normalizeTotals(mePayload: any, referrals: ReturnType<typeof normalizeReferral>[]) {
  const data = unwrapData(mePayload) || {};
  const totals = data.totals || data.stats || data;

  const fallback = referrals.reduce(
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

  return {
    leads: firstNumber(totals.leads, totals.lead_count, totals.clicks, totals.searches_count) || fallback.leads,
    sales: firstNumber(totals.sales, totals.sales_amount, totals.total_sales) || fallback.sales,
    commission: firstNumber(totals.commission, totals.commission_amount, totals.total_commission) || fallback.commission,
    paid: firstNumber(totals.paid, totals.paid_commission, totals.paid_amount) || fallback.paid,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!botApiConfigured()) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const agentToken = getAgentTokenFromRequest(req);
  if (!agentToken) {
    return res.status(401).json({ error: 'Agent session is required' });
  }

  try {
    const [mePayload, searchesPayload] = await Promise.all([
      callBotAgentApi('/api/agents/me', { token: agentToken }),
      callBotAgentApi('/api/agents/searches', { token: agentToken, query: { limit: 100 } }),
    ]);

    const agent = normalizeAgent(mePayload);
    const referrals = normalizeRows(searchesPayload).map(normalizeReferral);
    const totals = normalizeTotals(mePayload, referrals);

    return res.status(200).json({ agent, referrals, totals, raw: { me: mePayload, searches: searchesPayload } });
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'Panel yuklenmedi' });
  }
}
