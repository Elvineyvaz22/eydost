import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_BASE = process.env.ESIM_BOT_BASE_URL || 'https://bot.eydost.az';
const BOT_API_KEY = process.env.ESIM_BOT_API_KEY;

type EndpointBuilder = (params: Record<string, string>, body?: any) => {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, string>;
  body?: any;
};

const ENDPOINTS: Record<string, EndpointBuilder> = {
  'customer-esims': (p) => ({
    method: 'GET',
    path: `/api/public/customers/by-wa/${encodeURIComponent(p.wa_id)}/esims`,
  }),
  'customer-orders': (p) => ({
    method: 'GET',
    path: `/api/public/customers/by-wa/${encodeURIComponent(p.wa_id)}/orders`,
  }),
  'esim-usage': (p) => ({
    method: 'GET',
    path: `/api/public/esims/${encodeURIComponent(p.esim_id)}/usage`,
    query: p.wa_id ? { whatsapp_user_id: p.wa_id } : undefined,
  }),
  'order-detail': (p) => ({
    method: 'GET',
    path: `/api/public/orders/${encodeURIComponent(p.order_id)}`,
    query: p.wa_id ? { whatsapp_user_id: p.wa_id } : undefined,
  }),
  'order-esim': (p) => ({
    method: 'GET',
    path: `/api/public/orders/${encodeURIComponent(p.order_id)}/esim`,
    query: p.wa_id ? { whatsapp_user_id: p.wa_id } : undefined,
  }),
  'packages': (p) => ({
    method: 'GET',
    path: `/api/public/packages`,
    query: {
      country_code: p.country_code,
      ...(p.package_code ? { package_code: p.package_code } : {}),
    },
  }),
  'create-order': (p, body) => ({
    method: 'POST',
    path: `/api/public/orders`,
    body: {
      transport: 'web',
      country_code: body?.country_code,
      package_code: body?.package_code,
      whatsapp_user_id: p.wa_id || body?.whatsapp_user_id,
      ...(body?.language_code ? { language_code: body.language_code } : {}),
      ...(body?.full_name ? { full_name: body.full_name } : {}),
    },
  }),
};

function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({ success: false, error: { message } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

  const needsWa = ['customer-esims', 'customer-orders', 'create-order'];
  if (needsWa.includes(endpointName) && !params.wa_id) {
    return badRequest(res, 'wa_id is required for this endpoint');
  }

  const builder = ENDPOINTS[endpointName];
  let descriptor: ReturnType<EndpointBuilder>;
  try {
    descriptor = builder(params, req.body);
  } catch (err: any) {
    return badRequest(res, err?.message || 'Invalid parameters');
  }

  if (req.method === 'POST' && descriptor.method !== 'POST') {
    return badRequest(res, `Endpoint ${endpointName} expects ${descriptor.method}`);
  }

  const url = new URL(descriptor.path, BOT_BASE);
  if (descriptor.query) {
    for (const [k, v] of Object.entries(descriptor.query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }

  try {
    const upstream = await fetch(url.toString(), {
      method: descriptor.method,
      headers: {
        'x-api-key': BOT_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: descriptor.method === 'POST' ? JSON.stringify(descriptor.body ?? {}) : undefined,
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
