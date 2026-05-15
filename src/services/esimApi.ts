/**
 * eSIM Service Layer
 * ==================
 * Məlumatlar Supabase-dən gəlir (gündəlik bot sync ilə yenilənir).
 */

import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ESIMPackageRaw {
  packageCode: string;
  slug: string;
  name: string;
  sell_price_minor: number;
  currencyCode: string;
  volume: number;       // bytes
  duration: number;    // days
  speed: string;
  description: string;
  is_unlimited: boolean;
}

// ── Price helpers ─────────────────────────────────────────────────────────────

export function formatPrice(sellMinor: number, currency = 'AZN'): string {
  // sell_price_minor is in minor units (10000 = 1 AZN or 1 USD depending on currency)
  // Bot API returns AZN prices in AZN minor units
  // Convert AZN → USD at 1.7 rate for display
  const azn = currency === 'AZN' ? sellMinor / 10000 : sellMinor / 10000;
  const usd = azn / 1.7;
  return '$' + usd.toFixed(2);
}

export function formatGB(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
  return Math.round(bytes / (1024 * 1024)) + ' MB';
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

// ── Supabase queries ──────────────────────────────────────────────────────────

interface DbPackage {
  country_code: string;
  package_code: string;
  slug: string;
  name: string;
  volume_bytes: number;
  duration_days: number;
  sell_price_minor: number;
  currency_code: string;
  is_unlimited: boolean;
  speed: string;
  description: string;
}

function dbToRaw(p: DbPackage): ESIMPackageRaw {
  return {
    packageCode: p.package_code,
    slug: p.slug || p.package_code,
    name: p.name,
    sell_price_minor: p.sell_price_minor,
    currencyCode: p.currency_code || 'AZN',
    volume: p.volume_bytes,
    duration: p.duration_days,
    speed: p.speed || '4G',
    description: p.description || p.name,
    is_unlimited: p.is_unlimited || false,
  };
}

/**
 * Fetch packages for a specific country from Supabase.
 */
export async function fetchPublicPackagesForCountry(countryCode: string): Promise<ESIMPackageRaw[]> {
  const { data, error } = await supabase
    .from('esim_packages')
    .select('country_code, package_code, slug, name, volume_bytes, duration_days, sell_price_minor, currency_code, is_unlimited, speed, description')
    .eq('country_code', countryCode.toUpperCase())
    .eq('is_active', true)
    .order('sell_price_minor', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(dbToRaw);
}

/**
 * Fetch all packages grouped by country from Supabase.
 */
export async function fetchAllCountriesPackages(): Promise<Record<string, ESIMPackageRaw[]>> {
  const { data, error } = await supabase
    .from('esim_packages')
    .select('country_code, package_code, slug, name, volume_bytes, duration_days, sell_price_minor, currency_code, is_unlimited, speed, description')
    .eq('is_active', true)
    .order('sell_price_minor', { ascending: true });

  if (error) throw new Error(error.message);

  const result: Record<string, ESIMPackageRaw[]> = {};
  for (const row of data || []) {
    const cc = row.country_code;
    if (!cc) continue;
    if (!result[cc]) result[cc] = [];
    result[cc].push(dbToRaw(row));
  }
  return result;
}

/**
 * Get list of countries that have packages.
 */
export async function fetchCountriesList(): Promise<string[]> {
  const { data } = await supabase
    .from('esim_packages')
    .select('country_code')
    .eq('is_active', true);

  const codes = new Set<string>();
  for (const row of data || []) {
    if (row.country_code) codes.add(row.country_code);
  }
  return Array.from(codes).sort();
}