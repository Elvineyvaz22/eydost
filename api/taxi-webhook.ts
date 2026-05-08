import type { VercelRequest, VercelResponse } from '@vercel/node';

const BSQD_URL = 'https://bsqd.me/api/bot/388c046c-c54f-4b56-9107-24f4ffca0600/master/event/recieve_maps';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[VERCEL_taxi-webhook] method:', req.method);
  console.log('[VERCEL_taxi-webhook] body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  const bookingIdFromUrl = req.query.bookingId as string | undefined;
  console.log('[VERCEL_taxi-webhook] bookingId from URL:', bookingIdFromUrl);
  console.log('[VERCEL_taxi-webhook] body.pickup:', body?.pickup);
  console.log('[VERCEL_taxi-webhook] body.destination:', body?.destination);

  if (!body || !body.pickup || !body.destination) {
    console.log('[VERCEL_taxi-webhook] Invalid payload - missing pickup or destination');
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    console.log('[VERCEL_taxi-webhook] Forwarding to bsqd.me:', BSQD_URL);
    const response = await fetch(BSQD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: body.bookingId || '',
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
