import type { VercelRequest, VercelResponse } from '@vercel/node';

const BSQD_URL = process.env.BSQD_WEBHOOK_URL || 'https://bsqd.me/api/bot/388c046c-c54f-4b56-9107-24f4ffca0600/master/event/recieve_maps';
const BOT_ID = process.env.BSQD_BOT_ID || '388c046c-c54f-4b56-9107-24f4ffca0600';
const BSQD_TOKEN = process.env.BSQD_WEBHOOK_TOKEN || process.env.TAXI_WEBHOOK_TOKEN || '';

const hasValidLocation = (location: any) =>
  location &&
  typeof location.display_name === 'string' &&
  typeof location.formatted_address === 'string' &&
  typeof location.lat === 'number' &&
  typeof location.lng === 'number' &&
  Number.isFinite(location.lat) &&
  Number.isFinite(location.lng);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[VERCEL_taxi-webhook] method:', req.method);
  console.log('[VERCEL_taxi-webhook] body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  console.log('[VERCEL_taxi-webhook] body.pickup:', body?.pickup);
  console.log('[VERCEL_taxi-webhook] body.destination:', body?.destination);

  if (!body || !hasValidLocation(body.pickup) || !hasValidLocation(body.destination)) {
    console.log('[VERCEL_taxi-webhook] Invalid payload - missing pickup or destination');
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (!BSQD_TOKEN) {
    console.log('[VERCEL_taxi-webhook] Missing BSQD webhook token');
    return res.status(500).json({ error: 'Taxi webhook is not configured' });
  }

  try {
    console.log('[VERCEL_taxi-webhook] Forwarding to bsqd.me:', BSQD_URL);
    const response = await fetch(BSQD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BSQD_TOKEN}`,
      },
      body: JSON.stringify({
        bookingId: body.bookingId || '',
        bot_id: BOT_ID,
        user_id: 'master',
        pickup: body.pickup,
        destination: body.destination,
        confirmed_at: body.confirmed_at || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('[VERCEL_taxi-webhook] bsqd.me error:', response.status, text);
      return res.status(502).json({ error: 'bsqd.me error', detail: text });
    }

    console.log('[VERCEL_taxi-webhook] SUCCESS - bsqd.me responded OK');
    return res.status(200).json({ received: true });
  } catch (err) {
    console.log('[VERCEL_taxi-webhook] CATCH error:', String(err));
    return res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
}
