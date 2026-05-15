const BOT_API = 'https://bot.eydost.az/api/public/packages';
const env = (globalThis as any).process?.env || {};
const BOT_API_KEY = env.BOT_API_KEY;

export default async function handler(req: any, res: any) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { message: 'Method not allowed' } });
  }

  const { country_code } = req.query || {};

  if (!country_code || typeof country_code !== 'string') {
    return res.status(400).json({ success: false, error: { message: 'country_code is required' } });
  }

  if (!BOT_API_KEY) {
    console.error('BOT_API_KEY is not configured for esim-packages proxy');
    return res.status(500).json({ success: false, error: { message: 'Package API is not configured' } });
  }

  try {
    const response = await fetch(`${BOT_API}?country_code=${encodeURIComponent(country_code)}`, {
      headers: {
        'x-api-key': BOT_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: `API error: ${response.status}` } });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('esim-packages proxy error:', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Internal error' } });
  }
}