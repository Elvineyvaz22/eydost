import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Returns visitor country code (ISO 3166-1 alpha-2) from edge headers on Vercel. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw =
    req.headers['x-vercel-ip-country'] ||
    req.headers['cf-ipcountry'] ||
    req.headers['x-country-code'];
  const country =
    typeof raw === 'string' ? raw.trim().toUpperCase() : Array.isArray(raw) ? raw[0]?.trim().toUpperCase() : null;

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({ country: country && country.length === 2 ? country : null });
}
