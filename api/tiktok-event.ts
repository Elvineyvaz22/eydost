import type { VercelRequest, VercelResponse } from '@vercel/node';

const TIKTOK_EVENTS_API = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
const PIXEL_CODE = process.env.TIKTOK_PIXEL_ID || 'D914PTRC77U133LMFKFG';
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const EVENT_SECRET = process.env.TIKTOK_EVENT_SECRET;

const ALLOWED_EVENTS = new Set([
  'ViewContent',
  'Search',
  'InitiateCheckout',
  'PlaceAnOrder',
  'CompleteRegistration',
  'Purchase',
]);

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function clientIp(req: VercelRequest) {
  const forwarded = firstHeader(req.headers['x-forwarded-for']);
  return forwarded?.split(',')[0]?.trim() || firstHeader(req.headers['x-real-ip']) || undefined;
}

function asString(value: unknown, max = 300) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function asNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function normalizeContents(contents: unknown) {
  if (!Array.isArray(contents)) return undefined;
  const normalized = contents
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const contentId = asString(row.content_id, 120);
      const contentName = asString(row.content_name, 300);
      if (!contentId || !contentName) return null;
      return {
        content_id: contentId,
        content_type: row.content_type === 'product_group' ? 'product_group' : 'product',
        content_name: contentName,
      };
    })
    .filter(Boolean);
  return normalized.length ? normalized : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!ACCESS_TOKEN) {
    return res.status(200).json({ success: false, skipped: true, error: 'TIKTOK_ACCESS_TOKEN not configured' });
  }

  const body = req.body || {};
  const event = asString(body.event, 64);
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ success: false, error: 'Unsupported event' });
  }
  if (event === 'Purchase') {
    const providedSecret = firstHeader(req.headers['x-tiktok-event-secret']);
    if (!EVENT_SECRET || providedSecret !== EVENT_SECRET) {
      return res.status(403).json({ success: false, error: 'Purchase event requires server authorization' });
    }
  }

  const eventId = asString(body.event_id, 180) || `${event}_${Date.now()}`;
  const url = asString(body.url, 2048) || firstHeader(req.headers.referer) || 'https://eydost.com';
  const userAgent = asString(body.user_agent, 600) || firstHeader(req.headers['user-agent']);
  const ip = clientIp(req);
  const contents = normalizeContents(body.contents);
  const value = asNumber(body.value);
  const currency = asString(body.currency, 8) || 'USD';

  const properties: Record<string, unknown> = {
    content_type: 'product',
  };
  if (contents) properties.contents = contents;
  if (typeof value === 'number') properties.value = value;
  if (typeof value === 'number') properties.currency = currency;
  const searchString = asString(body.search_string, 300);
  if (searchString) properties.search_string = searchString;

  const contextUser: Record<string, unknown> = {};
  if (ip) contextUser.ip = ip;
  if (userAgent) contextUser.user_agent = userAgent;
  const ttclid = asString(body.ttclid, 500);
  const ttp = asString(body.ttp, 500);
  if (ttclid) contextUser.ttclid = ttclid;
  if (ttp) contextUser.ttp = ttp;

  const payload = {
    pixel_code: PIXEL_CODE,
    event,
    event_id: eventId,
    timestamp: new Date().toISOString(),
    context: {
      page: { url },
      user: contextUser,
    },
    properties,
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_API, {
      method: 'POST',
      headers: {
        'Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let json: unknown = text;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      // Keep raw response text for debugging without failing JSON parse.
    }

    if (!response.ok) {
      console.error('[tiktok-event] upstream error', response.status, json);
      return res.status(502).json({ success: false, error: 'TikTok Events API error' });
    }

    return res.status(200).json({ success: true, data: json });
  } catch (error: any) {
    console.error('[tiktok-event] failed', error);
    return res.status(502).json({ success: false, error: error?.message || 'TikTok Events API failed' });
  }
}
