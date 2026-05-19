/**
 * Taxi webhook proxy — runs on Vercel Edge before static SPA.
 * Fixes POST /api/taxi-webhook returning 405 when api/ serverless is not deployed.
 */

const BSQD_URL =
  'https://bsqd.me/api/bot/388c046c-c54f-4b56-9107-24f4ffca0600/master/event/recieve_maps';
const BOT_ID = '388c046c-c54f-4b56-9107-24f4ffca0600';

export const config = {
  matcher: '/api/taxi-webhook',
};

export default async function middleware(request: Request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: {
    bookingId?: string;
    pickup?: unknown;
    destination?: unknown;
    confirmed_at?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.pickup || !body.destination) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const token = process.env.BSQD_TOKEN || 'vlmftc3wuyeme247ns3sbg2drggop5ba7dgja4vr';

  try {
    const upstream = await fetch(BSQD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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

    if (!upstream.ok) {
      const detail = await upstream.text();
      return Response.json({ error: 'bsqd.me error', detail }, { status: 502 });
    }

    return Response.json({ received: true });
  } catch (err) {
    return Response.json({ error: 'Proxy error', detail: String(err) }, { status: 500 });
  }
}
