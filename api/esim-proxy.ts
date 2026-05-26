import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * eSIM bot read-only proxy.
 *
 * The frontend (`/esim?wa_id=...` profile screen) needs to display the
 * customer's eSIMs, orders, and remaining usage WITHOUT exposing the
 * bot's `x-api-key` to the browser. This function attaches the key
 * server-side and forwards a tiny whitelist of GET endpoints.
 *
 * The site itself does NOT create orders or initiate payments — the user
 * buys via WhatsApp, where the bot handles checkout and fulfillment.
 */

const BOT_BASE = process.env.ESIM_BOT_BASE_URL || 'https://bot.eydost.az';
const BOT_API_KEY = process.env.ESIM_BOT_API_KEY;

type EndpointBuilder = (params: Record<string, string>) => {
  path: string;
  query?: Record<string, string>;
};

const ENDPOINTS: Record<string, EndpointBuilder> = {
  'customer-esims': (p) => ({
    path: `/api/public/customers/by-wa/${encodeURIComponent(p.wa_id)}/esims`,
  }),
  'customer-orders': (p) => ({
    path: `/api/public/customers/by-wa/${encodeURIComponent(p.wa_id)}/orders`,
  }),
  'esim-usage': (p) => ({
    path: `/api/public/esims/${encodeURIComponent(p.esim_id)}/usage`,
    query: p.wa_id ? { whatsapp_user_id: p.wa_id } : undefined,
  }),
};

function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({ success: false, error: { message } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { message: 'Method not allowed' } });
  }

  if (!BOT_API_KEY) {
    console.error('[esim-proxy] ESIM_BOT_API_KEY env var is missing');
    return res.status(500).json({
      success: false,
      error: { message: 'Server configuration error' },
    });
  }

  const endpointName = String(req.query.endpoint || '').trim();
  if (!endpointName || !(endpointName in ENDPOINTS)) {
    return badRequest(res, `Unknown endpoint: ${endpointName || '(empty)'}`);
  }

  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'endpoint') continue;
    if (typeof v === 'string') params[k] = v;
    else if (Array.isArray(v) && v.length > 0) params[k] = String(v[0]);
  }

  if (endpointName === 'customer-esims' || endpointName === 'customer-orders') {
    if (!params.wa_id) return badRequest(res, 'wa_id is required for this endpoint');
  }
  if (endpointName === 'esim-usage' && !params.esim_id) {
    return badRequest(res, 'esim_id is required for this endpoint');
  }

  const builder = ENDPOINTS[endpointName];
  const descriptor = builder(params);

  const url = new URL(descriptor.path, BOT_BASE);
  if (descriptor.query) {
    for (const [k, v] of Object.entries(descriptor.query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }

  try {
    const upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': BOT_API_KEY,
        Accept: 'application/json',
      },
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch (err: any) {
    console.error('[esim-proxy] upstream error:', err);
    return res.status(502).json({
      success: false,
      error: { message: err?.message || 'Upstream error' },
    });
  }
}
