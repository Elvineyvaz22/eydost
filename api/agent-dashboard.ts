import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const BOT_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;
const AGENT_COMMISSION_PERCENT = 15;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      const parsed = Number(value.replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function unwrapData(payload: any) {
  return payload?.data ?? payload?.agent ?? payload;
}

function normalizeAgent(raw: any) {
  const data = raw?.data ?? raw;
  const agent = data?.agent ?? data;
  const firstCode = Array.isArray(data?.codes) ? data.codes[0] : null;
  return {
    id: firstString(agent?.id, agent?.email),
    full_name: firstString(agent?.full_name, agent?.name, agent?.email),
    company_name: firstString(agent?.company_name, agent?.company, 'Agent'),
    email: firstString(agent?.email).toLowerCase(),
    referral_code: firstString(agent?.referral_code, firstCode?.referral_code, firstCode?.code) || null,
    commission_rate: AGENT_COMMISSION_PERCENT,
    status: firstString(agent?.status, agent?.is_active === false ? 'pending' : 'active') || 'active',
  };
}

function getAgentTokenFromRequest(req: VercelRequest) {
  return firstString(
    req.body?.agentToken,
    req.body?.token,
    req.headers.authorization?.toString().replace(/^Bearer\s+/i, '')
  );
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function callBotAgentApi(path: string, token: string, query?: Record<string, unknown>) {
  const url = new URL(path, BOT_API_BASE_URL);
  Object.entries(query || {}).forEach(([key, value]) => {
    const single = firstString(value);
    if (single) url.searchParams.set(key, single);
  });

  const upstream = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': PUBLIC_API_KEY || '',
      'x-auth-token': PUBLIC_API_AUTH_TOKEN || '',
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await readJson(upstream);
  if (!upstream.ok) {
    const detail = payload?.detail || payload?.error || payload?.message || `Bot API error (${upstream.status})`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return payload;
}

function normalizeRows(payload: any) {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.searches)) return data.searches;
  if (Array.isArray(data?.conversions)) return data.conversions;
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
  if (['paid', 'success', 'succeeded', 'completed', 'done', 'delivered', 'fulfilled'].includes(status)) return 'paid';
  if (['confirmed', 'created', 'pending_payment'].includes(status)) return 'confirmed';
  if (['cancelled', 'canceled', 'declined', 'failed', 'error'].includes(status)) return 'cancelled';
  return 'lead';
}

function buildNotes(row: any) {
  const packageDetails = row.package_details || row.packageDetails || {};
  const lines = [
    firstString(row.package_name, packageDetails.name, row.package, row.package_title, row.name)
      ? `Package: ${firstString(row.package_name, packageDetails.name, row.package, row.package_title, row.name)}`
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
  const commissionAmount = Number((saleAmount * (AGENT_COMMISSION_PERCENT / 100)).toFixed(2));

  return {
    id: firstString(row.id, row.order_id, row.payment_id, row.transaction_id, index),
    customer_name: firstString(row.customer_name, row.full_name, row.client_name, row.name) || null,
    customer_contact: firstString(row.customer_contact, row.customer_phone, row.phone, row.phone_number, row.email, row.whatsapp_number) || null,
    product_type: firstString(row.product_type, row.order_type, row.type) || 'esim',
    order_reference: firstString(row.order_reference, row.order_id, row.payment_id, row.transaction_id, row.provider_order_no) || null,
    sale_amount: saleAmount,
    commission_amount: commissionAmount,
    status: normalizeStatus(row),
    notes: buildNotes(row),
    created_at: firstString(row.created_at, row.createdAt, row.purchased_at, row.updated_at, row.date) || new Date().toISOString(),
  };
}

function normalizeSearch(row: any, index: number) {
  return normalizeReferral(
    {
      ...row,
      id: firstString(row.id, row.package_code, row.package_slug, index),
      status: firstString(row.event_type, row.status) || 'lead',
      product_type: 'esim',
      notes: [
        firstString(row.package_name) ? `Package: ${firstString(row.package_name)}` : '',
        firstString(row.package_code) ? `Package code: ${firstString(row.package_code)}` : '',
        firstString(row.country_code) ? `Country: ${firstString(row.country_code)}` : '',
        firstString(row.package_slug) ? `Page: ${firstString(row.package_slug)}` : '',
      ].filter(Boolean).join('\n'),
    },
    index
  );
}

function normalizeLocalReferral(row: any, index: number) {
  return normalizeReferral(
    {
      ...row,
      id: `local-${firstString(row.id, index)}`,
      amount: row.sale_amount,
      status: row.status || 'lead',
      product_type: row.product_type || 'esim',
      order_reference: row.order_reference,
      notes: row.notes,
    },
    index
  );
}

function normalizeConversion(row: any, index: number) {
  const packageDetails = row.package_details || row.packageDetails || {};
  return normalizeReferral(
    {
      ...row,
      status: firstString(row.status) || 'paid',
      product_type: 'esim',
      notes: [
        firstString(row.package_name, packageDetails.name) ? `Package: ${firstString(row.package_name, packageDetails.name)}` : '',
        firstString(row.package_code) ? `Package code: ${firstString(row.package_code)}` : '',
        firstString(row.country_code) ? `Country: ${firstString(row.country_code)}` : '',
        firstString(row.order_id) ? `Order reference: ${firstString(row.order_id)}` : '',
        firstString(row.transaction_id) ? `Transaction id: ${firstString(row.transaction_id)}` : '',
      ].filter(Boolean).join('\n') || row.notes,
    },
    index
  );
}

function normalizeTotals(mePayload: any, referrals: ReturnType<typeof normalizeReferral>[]) {
  const data = mePayload?.data ?? mePayload ?? {};
  const totals = data.totals || data.stats || data;
  const soldEsimPrice = firstNumber(totals.sold_esim_price, totals.soldEsimPrice);

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

  const fallbackSales = Number(fallback.sales.toFixed(2));
  const fallbackCommission = Number(fallback.commission.toFixed(2));
  const normalizedSoldEsimPrice = moneyToUsd(soldEsimPrice, totals.currency || 'AZN');
  const sales = fallbackSales || normalizedSoldEsimPrice;
  const commission = fallbackCommission || Number((sales * (AGENT_COMMISSION_PERCENT / 100)).toFixed(2));

  const paidCount = referrals.filter((row) => row.status === 'paid').length;
  const trafficRows = referrals.filter((row) => row.status !== 'paid');
  const eventOf = (row: ReturnType<typeof normalizeReferral>) =>
    firstString(row.notes?.match(/^Event:\s*(.+)$/im)?.[1]).toLowerCase();
  const linkClicks = trafficRows.filter((row) => eventOf(row) === 'visit').length;
  const whatsappClicks = trafficRows.filter((row) => eventOf(row) === 'whatsapp_click').length;
  const packageViews = trafficRows.filter((row) => {
    const event = eventOf(row);
    return event === 'package_view' || (!event && Boolean(firstString(row.notes?.match(/^Package:/im)?.[0], row.notes?.match(/^Viewed package:/im)?.[0])));
  }).length;

  return {
    leads: firstNumber(totals.search_count, totals.searches_count, totals.leads, totals.lead_count, totals.clicks) || fallback.leads,
    linkClicks,
    packageViews,
    whatsappClicks,
    conversions: paidCount || firstNumber(totals.conversion_count, totals.conversions, totals.sale_count, totals.sales_count),
    sales,
    commission,
    paid: commission,
  };
}

async function getLocalReferrals(referralCode: string) {
  const supabase = getSupabase();
  if (!supabase || !referralCode) return [];

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (agentError || !agent?.id) return [];

  const { data, error } = await supabase
    .from('agent_referrals')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !Array.isArray(data)) return [];
  return data.map(normalizeLocalReferral);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PUBLIC_API_KEY || !PUBLIC_API_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const agentToken = getAgentTokenFromRequest(req);
  if (!agentToken) {
    return res.status(401).json({ error: 'Agent session is required' });
  }

  try {
    const [mePayload, searchesPayload, purchasesResult] = await Promise.all([
      callBotAgentApi('/api/agents/me', agentToken),
      callBotAgentApi('/api/agents/searches', agentToken, { limit: 100 }),
      callBotAgentApi('/api/agents/purchases', agentToken, { limit: 100 }).catch((error) => ({
        __error: error?.message || 'Purchases endpoint unavailable',
      })),
    ]);

    const agent = normalizeAgent(mePayload);
    const localReferrals = await getLocalReferrals(agent.referral_code || '');
    const searches = normalizeRows(searchesPayload).map(normalizeSearch);
    const conversions = (purchasesResult as any)?.__error
      ? []
      : normalizeRows(purchasesResult).map(normalizeConversion);
    const referrals = [...conversions, ...localReferrals, ...searches].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const totals = normalizeTotals(mePayload, referrals);

    return res.status(200).json({
      agent,
      referrals,
      totals,
      raw: { me: mePayload, searches: searchesPayload, purchases: purchasesResult, conversions: purchasesResult },
    });
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'Panel yuklenmedi' });
  }
}
