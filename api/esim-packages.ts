const BOT_API = process.env.ESIM_BOT_BASE_URL
  ? `${process.env.ESIM_BOT_BASE_URL.replace(/\/+$/, '')}/api/public/packages`
  : 'https://bot.eydost.az/api/public/packages';
const BOT_API_KEY = process.env.ESIM_BOT_API_KEY;

export default async function handler(req: any, res: any) {
  if (!BOT_API_KEY) {
    console.error('[esim-packages] ESIM_BOT_API_KEY env var is missing');
    return res.status(500).json({ success: false, error: { message: 'Server configuration error' } });
  }

  const { country_code } = req.query || {};

  if (!country_code || typeof country_code !== 'string') {
    return res.status(400).json({ success: false, error: { message: 'country_code is required' } });
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
