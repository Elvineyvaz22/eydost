/**
 * eSIM Service Layer
 * ==================
 * Bütün məlumatlar artıq bot.eydost.az public API-dən gəlir.
 * (eSIM Access API artıq istifadə olunmur)
 */

import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ESIMPackageRaw {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  sellingPrice?: number;
  sell_price_minor?: number;
  currencyCode: string;
  retailPrice: number;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
  description: string;
  activeType: number;
  speed: string;
  smsStatus: number;
  dataType: number;
  favorite: boolean;
  supportTopUpType: number;
  fupPolicy?: string;
  locationNetworkList?: { locationName: string; locationLogo: string; operatorList?: { operatorName: string; networkType: string }[] }[];
}

export interface ESIMCountryGroup {
  countryCode: string;
  countryName: string;
  flag: string;
  packages: ESIMPackageRaw[];
}

// ── Price helpers ─────────────────────────────────────────────────────────────

export function formatPrice(units: number, markup = 1.75, sellingPrice?: number): string {
  const usd = sellingPrice ? (sellingPrice / 10000) : (units / 10000) * markup;
  return `$${usd.toFixed(2)}`;
}

export function formatGB(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)}GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

// ── Country helpers ───────────────────────────────────────────────────────────

export function countryCodeToFlag(code: string): string {
  if (!code || code.startsWith('!')) return '🌍';
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

const COUNTRY_NAMES: Record<string, string> = {
  AZ: 'Azerbaijan', TR: 'Turkey', RU: 'Russia', UA: 'Ukraine', GE: 'Georgia',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', IT: 'Italy', ES: 'Spain',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria', PL: 'Poland',
  PT: 'Portugal', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece',
  HR: 'Croatia', SK: 'Slovakia', SI: 'Slovenia', EE: 'Estonia', LV: 'Latvia',
  LT: 'Lithuania', IE: 'Ireland', LU: 'Luxembourg', MT: 'Malta', CY: 'Cyprus',
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador',
  CN: 'China', JP: 'Japan', KR: 'South Korea', HK: 'Hong Kong', TW: 'Taiwan',
  SG: 'Singapore', MY: 'Malaysia', TH: 'Thailand', ID: 'Indonesia', PH: 'Philippines',
  VN: 'Vietnam', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka',
  AU: 'Australia', NZ: 'New Zealand',
  AE: 'UAE', SA: 'Saudi Arabia', IL: 'Israel', JO: 'Jordan', KW: 'Kuwait',
  QA: 'Qatar', BH: 'Bahrain', OM: 'Oman', LB: 'Lebanon', EG: 'Egypt',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', TZ: 'Tanzania',
  ET: 'Ethiopia', MA: 'Morocco', TN: 'Tunisia', DZ: 'Algeria', UG: 'Uganda',
  MO: 'Macau', KH: 'Cambodia', KZ: 'Kazakhstan', UZ: 'Uzbekistan', AM: 'Armenia',
  IS: 'Iceland', AL: 'Albania', BA: 'Bosnia', MK: 'North Macedonia', RS: 'Serbia',
  MD: 'Moldova', MN: 'Mongolia', MM: 'Myanmar', NP: 'Nepal', LY: 'Libya',
  IQ: 'Iraq', IR: 'Iran', AF: 'Afghanistan', JM: 'Jamaica', TT: 'Trinidad & Tobago',
  PR: 'Puerto Rico', CR: 'Costa Rica', PA: 'Panama', GT: 'Guatemala', HN: 'Honduras',
  SV: 'El Salvador', NI: 'Nicaragua', DO: 'Dominican Republic', CU: 'Cuba',
  BO: 'Bolivia', PY: 'Paraguay', UY: 'Uruguay', GY: 'Guyana', SR: 'Suriname',
  BY: 'Belarus', MZ: 'Mozambique', ZW: 'Zimbabwe', ZM: 'Zambia', AO: 'Angola',
  CM: 'Cameroon', SN: 'Senegal', CI: 'Ivory Coast', ML: 'Mali',
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] || code;
}

// ── Pricing Rules (Supabase) ──────────────────────────────────────────────────

interface PricingRule {
  target_type: 'global' | 'region' | 'country' | 'package';
  target_id: string | null;
  margin: number;
  fixed_price: number | null;
  is_active: boolean;
}

async function fetchPricingRules(): Promise<PricingRule[]> {
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'esim_pricing_rules')
    .maybeSingle();

  if (!Array.isArray(data?.value)) return [];
  return (data.value as PricingRule[]).filter(rule => rule.is_active !== false);
}

// ── Public API (bot.eydost.az) ─────────────────────────────────────────────────

/**
 * Fetch packages for a specific country using the bot.eydost.az public API.
 * Returns packages sorted by price ascending.
 */
export async function fetchPublicPackagesForCountry(countryCode: string): Promise<ESIMPackageRaw[]> {
  // Use Vercel serverless proxy to avoid CORS issues in production
  const baseUrl = import.meta.env.DEV ? 'http://localhost:5173' : '';
  const res = await fetch(`${baseUrl}/api/esim-packages?country_code=${countryCode}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'API error');

  return (data.data || []).map((p: any) => {
    const sellMinor = p.sell_price_minor ?? 0;
    return {
      packageCode: p.package_code,
      slug: p.slug,
      name: p.name,
      price: 0,
      sell_price_minor: sellMinor,
      sellingPrice: sellMinor * 100,
      currencyCode: p.currency,
      retailPrice: 0,
      volume: parseInt(p.volume),
      duration: p.duration,
      durationUnit: 'DAY',
      location: p.country_code,
      description: p.name,
      activeType: 1,
      speed: '4G',
      smsStatus: 0,
      dataType: 0,
      favorite: false,
      supportTopUpType: 0,
    };
  }).sort((a: ESIMPackageRaw, b: ESIMPackageRaw) => (a.sell_price_minor ?? 0) - (b.sell_price_minor ?? 0));
}
