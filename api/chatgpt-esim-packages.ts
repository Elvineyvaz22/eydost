import type { VercelRequest, VercelResponse } from '@vercel/node';

type PackageType = 'standard' | 'daily';

const PUBLIC_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.ESIM_BOT_BASE_URL ||
  'https://bot.eydost.az';

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const PUBLIC_API_AUTH_TOKEN = process.env.PUBLIC_API_AUTH_TOKEN;
const AZN_PER_USD = 1.7;

function clean(value: unknown, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function normalizeCountry(raw: unknown) {
  const value = clean(raw, 40).toUpperCase();
  if (value === 'TR' || value === 'TURKEY' || value === 'TURKIYE' || value === 'TÜRKIYE' || value === 'TÜRKIYƏ') return 'TR';
  if (value === 'US' || value === 'USA' || value === 'UNITED STATES') return 'US';
  return value || 'TR';
}

function normalizeType(raw: unknown): PackageType | undefined {
  const value = clean(raw, 20).toLowerCase();
  if (value === 'standard' || value === 'daily') return value;
  return undefined;
}

function bytesToGb(volume: unknown) {
  const bytes = Number(volume || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb < 1) return null;
  return Number.isInteger(gb) ? `${gb}GB` : `${Number(gb.toFixed(1))}GB`;
}

function aznToUsd(value: unknown) {
  const azn = Number(value || 0);
  if (!Number.isFinite(azn) || azn <= 0) return 0;
  return Number((azn / AZN_PER_USD).toFixed(2));
}

function packageType(item: any): PackageType {
  return item?.unlimited || item?.data_type === 2 || String(item?.name || '').toLowerCase().includes('/day')
    ? 'daily'
    : 'standard';
}

function publicPackage(item: any) {
  const type = packageType(item);
  const data = bytesToGb(item?.volume);
  const priceUsd = aznToUsd(item?.sell_price);

  if (!data || priceUsd <= 0) return null;

  return {
    package_code: item.package_code,
    slug: item.slug,
    country_code: item.country_code,
    name: item.name,
    data,
    duration_days: item.duration || null,
    type,
    unlimited: Boolean(item.unlimited),
    currency: 'USD',
    price_usd: priceUsd,
    price: `$${priceUsd.toFixed(2)}`,
  };
}

function dedupePackages(packages: any[]) {
  const seen = new Set<string>();
  return packages.filter((item) => {
    const key = `${item.type}:${item.data}:${item.duration_days}:${item.price_usd}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchPackages(countryCode: string) {
  const url = new URL('/api/public/packages', PUBLIC_API_BASE_URL);
  url.searchParams.set('country_code', countryCode);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-api-key': PUBLIC_API_KEY || '',
      'x-auth-token': PUBLIC_API_AUTH_TOKEN || '',
      Authorization: PUBLIC_API_AUTH_TOKEN ? `Bearer ${PUBLIC_API_AUTH_TOKEN}` : '',
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || payload?.detail || `Package API error ${response.status}`);
  return Array.isArray(payload?.data) ? payload.data : [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!PUBLIC_API_KEY || !PUBLIC_API_AUTH_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Server configuration error' });
  }

  const countryCode = normalizeCountry(req.query.country || req.query.country_code);
  const type = normalizeType(req.query.type);
  const limit = Math.min(Math.max(Number(req.query.limit || 8) || 8, 1), 20);

  try {
    const rawPackages = await fetchPackages(countryCode);
    const packages = dedupePackages(
      rawPackages
        .map(publicPackage)
        .filter(Boolean)
        .filter((item: any) => (type ? item.type === type : true))
        .sort((a: any, b: any) => {
          if (a.type !== b.type) return a.type === 'standard' ? -1 : 1;
          return a.price_usd - b.price_usd;
        })
    ).slice(0, limit);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      source: 'bot.eydost.az',
      country_code: countryCode,
      currency: 'USD',
      packages,
      assistant_note: 'Show only these package prices. Do not invent unavailable packages or prices.',
    });
  } catch (error: any) {
    return res.status(502).json({ ok: false, error: error?.message || 'Failed to fetch packages' });
  }
}
