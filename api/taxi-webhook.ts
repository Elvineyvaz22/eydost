import type { VercelRequest, VercelResponse } from '@vercel/node';

const BSQD_URL = 'https://bsqd.me/api/bot/388c046c-c54f-4b56-9107-24f4ffca0600/master/event/recieve_maps';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || !body.pickup || !body.destination) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
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
      return res.status(502).json({ error: 'bsqd.me error', detail: text });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
}
