import type { VercelRequest, VercelResponse } from '@vercel/node';

type PlanType = 'standard' | 'daily';
type CountryCode = 'US' | 'CA' | 'MX';

interface InternalPlan {
  id: string;
  countryCode: CountryCode;
  country: string;
  name: string;
  data: string;
  days: string;
  costUsd: number;
  type: PlanType;
  network: string;
  featured?: boolean;
}

const MARKUP = 1.75;

const PLANS: InternalPlan[] = [
  { id: 'us-1gb-7d', countryCode: 'US', country: 'United States', name: 'United States 1GB 7Days', data: '1GB', days: '7', costUsd: 0.9, type: 'standard', network: '3G/4G/5G' },
  { id: 'us-3gb-15d', countryCode: 'US', country: 'United States', name: 'United States 3GB 15Days', data: '3GB', days: '15', costUsd: 2.2, type: 'standard', network: '3G/4G/5G' },
  { id: 'us-5gb-30d', countryCode: 'US', country: 'United States', name: 'United States 5GB 30Days', data: '5GB', days: '30', costUsd: 3.4, type: 'standard', network: '3G/4G/5G' },
  { id: 'us-10gb-30d', countryCode: 'US', country: 'United States', name: 'United States 10GB 30Days', data: '10GB', days: '30', costUsd: 6.63, type: 'standard', network: '3G/4G/5G', featured: true },
  { id: 'us-15gb-30d', countryCode: 'US', country: 'United States', name: 'United States 15GB 30Days', data: '15GB', days: '30', costUsd: 8.5, type: 'standard', network: '3G/4G/5G' },
  { id: 'us-20gb-30d', countryCode: 'US', country: 'United States', name: 'United States 20GB 30Days', data: '20GB', days: '30', costUsd: 12.43, type: 'standard', network: '3G/4G/5G', featured: true },
  { id: 'us-50gb-30d', countryCode: 'US', country: 'United States', name: 'United States 50GB 30Days', data: '50GB', days: '30', costUsd: 28, type: 'standard', network: '3G/4G/5G', featured: true },
  { id: 'us-100gb-10d-fifa', countryCode: 'US', country: 'United States', name: 'United States 100GB 10Days', data: '100GB', days: '10', costUsd: 69.9, type: 'standard', network: '3G/4G/5G', featured: true },
  { id: 'us-1gb-day', countryCode: 'US', country: 'United States', name: 'United States 1GB/Day', data: '1GB/Day', days: '1-365', costUsd: 1.3, type: 'daily', network: '3G/4G/5G' },
  { id: 'us-2gb-day', countryCode: 'US', country: 'United States', name: 'United States 2GB/Day', data: '2GB/Day', days: '1-365', costUsd: 1.59, type: 'daily', network: '3G/4G/5G' },
  { id: 'us-3gb-day', countryCode: 'US', country: 'United States', name: 'United States 3GB/Day', data: '3GB/Day', days: '1-365', costUsd: 3.8, type: 'daily', network: '3G/4G/5G' },
  { id: 'us-5gb-day', countryCode: 'US', country: 'United States', name: 'United States 5GB/Day', data: '5GB/Day', days: '1-365', costUsd: 3.21, type: 'daily', network: '3G/4G/5G' },
  { id: 'us-10gb-day', countryCode: 'US', country: 'United States', name: 'United States 10GB/Day', data: '10GB/Day', days: '1-365', costUsd: 4.95, type: 'daily', network: '3G/4G/5G', featured: true },
];

function salePrice(costUsd: number) {
  return Number((costUsd * MARKUP).toFixed(2));
}

function normalizeCountry(raw: unknown): CountryCode | undefined {
  const value = String(raw || '').trim().toUpperCase();
  if (value === 'US' || value === 'USA' || value === 'UNITED STATES') return 'US';
  if (value === 'CA' || value === 'CANADA') return 'CA';
  if (value === 'MX' || value === 'MEXICO') return 'MX';
  return undefined;
}

function normalizeType(raw: unknown): PlanType | undefined {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'standard' || value === 'daily') return value;
  return undefined;
}

function publicPlan(plan: InternalPlan) {
  return {
    id: plan.id,
    country_code: plan.countryCode,
    country: plan.country,
    name: plan.name,
    data: plan.data,
    days: plan.days,
    type: plan.type,
    network: plan.network,
    featured: Boolean(plan.featured),
    currency: 'USD',
    price_usd: salePrice(plan.costUsd),
    price: `$${salePrice(plan.costUsd).toFixed(2)}`,
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const country = normalizeCountry(req.query.country) || 'US';
  const type = normalizeType(req.query.type);
  const limit = Math.min(Math.max(Number(req.query.limit || 20) || 20, 1), 50);

  const packages = PLANS
    .filter((plan) => plan.countryCode === country)
    .filter((plan) => (type ? plan.type === type : true))
    .sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || salePrice(a.costUsd) - salePrice(b.costUsd))
    .slice(0, limit)
    .map(publicPlan);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    campaign: 'world-cup-2026',
    markup: 'included',
    country,
    packages,
  });
}
