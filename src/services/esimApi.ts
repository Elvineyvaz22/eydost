/**
 * eSIM Access API — Frontend Service Layer
 * ==========================================
 * Fetches real package data from the Python backend (which calls eSIM Access API).
 * All requests go through Vite proxy: /api/esim → http://localhost:8000/api/esim
 */

import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ESIMPackageRaw {
  packageCode: string;
  slug: string;
  name: string;
  price: number;          // in units (divide by 10000 for USD)
  sellingPrice?: number;   // calculated price from backend
  currencyCode: string;
  retailPrice: number;
  volume: number;         // in bytes
  duration: number;
  durationUnit: string;   // "DAY"
  location: string;       // comma-separated ISO Alpha-2 codes e.g. "TR,AZ,GE"
  description: string;
  activeType: number;     // 1 = auto-activate, 2 = manual
  speed: string;
  smsStatus: number;
  dataType: number;
  favorite: boolean;
  supportTopUpType: number;
  fupPolicy?: string;
  locationNetworkList?: { locationName: string; locationLogo: string; operatorList?: { operatorName: string; networkType: string }[] }[];
}

export interface ESIMCountryGroup {
  countryCode: string;    // ISO Alpha-2
  countryName: string;
  flag: string;           // emoji flag
  packages: ESIMPackageRaw[];
}

interface PricingRule {
  target_type: 'global' | 'region' | 'country' | 'package';
  target_id: string | null;
  margin: number;
  fixed_price: number | null;
  is_active: boolean;
}

const REGION_CODES: Record<string, Set<string>> = {
  EUROPE: new Set(['AL', 'AD', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA', 'VA']),
  ASIA: new Set(['AM', 'AZ', 'BD', 'BN', 'BT', 'CN', 'GE', 'HK', 'ID', 'IN', 'JP', 'KH', 'KR', 'KZ', 'LA', 'LK', 'MM', 'MN', 'MO', 'MY', 'NP', 'PH', 'PK', 'SG', 'TH', 'TW', 'UZ', 'VN']),
  'MIDDLE EAST': new Set(['AE', 'BH', 'IL', 'IQ', 'JO', 'KW', 'LB', 'OM', 'QA', 'SA']),
  AFRICA: new Set(['AO', 'BW', 'CI', 'CM', 'DZ', 'EG', 'ET', 'GH', 'KE', 'MA', 'ML', 'MZ', 'NG', 'SN', 'TN', 'TZ', 'UG', 'ZA', 'ZM', 'ZW']),
  'NORTH AMERICA': new Set(['CA', 'MX', 'US', 'PR']),
  'SOUTH AMERICA': new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE']),
  CARIBBEAN: new Set(['BS', 'BB', 'CU', 'DM', 'DO', 'GD', 'HT', 'JM', 'KN', 'LC', 'VC', 'TT']),
  OCEANIA: new Set(['AU', 'FJ', 'NZ', 'PG', 'WS']),
};

// ── Price helper ──────────────────────────────────────────────────────────────
// eSIM Access prices are in units where 10000 = $1.00
// We apply a 1.75x retail markup
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

// ── Country code → emoji flag ─────────────────────────────────────────────────
export function countryCodeToFlag(code: string): string {
  if (!code || code.startsWith('!')) return '🌍';
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

// Full country name map (ISO Alpha-2)
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

function normalizeTarget(value?: string | null): string {
  return (value || '').trim().toUpperCase().replace(/[-_]/g, ' ');
}

function packageRegions(pkg: ESIMPackageRaw): Set<string> {
  const codes = (pkg.location || '')
    .split(',')
    .map(code => normalizeTarget(code))
    .filter(code => code && !code.startsWith('!'));

  if (codes.includes('GL') || codes.includes('GLOBAL')) return new Set(['GLOBAL']);

  return new Set(
    Object.entries(REGION_CODES)
      .filter(([, regionCodes]) => codes.length > 0 && codes.every(code => regionCodes.has(code)))
      .map(([region]) => region),
  );
}

async function fetchPricingRules(): Promise<PricingRule[]> {
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'esim_pricing_rules')
    .maybeSingle();

  return Array.isArray(data?.value)
    ? (data.value as PricingRule[]).filter(rule => rule.is_active)
    : [];
}

function applyRule(rule: PricingRule, apiPrice: number): number {
  if (rule.fixed_price !== null && rule.fixed_price !== undefined) return rule.fixed_price;
  return Math.round(apiPrice * (rule.margin || 1.75));
}

async function applyPricingRules(packages: ESIMPackageRaw[]): Promise<ESIMPackageRaw[]> {
  const rules = await fetchPricingRules().catch(() => []);
  if (rules.length === 0) return packages;

  return packages.map(pkg => {
    const locations = (pkg.location || '').split(',').map(code => normalizeTarget(code)).filter(Boolean);
    const countryCode = locations.length === 1 ? locations[0] : '';
    const regions = packageRegions(pkg);
    const rule =
      rules.find(item => item.target_type === 'package' && normalizeTarget(item.target_id) === normalizeTarget(pkg.packageCode)) ||
      rules.find(item => item.target_type === 'country' && normalizeTarget(item.target_id) === countryCode) ||
      rules.find(item => item.target_type === 'region' && regions.has(normalizeTarget(item.target_id))) ||
      rules.find(item => item.target_type === 'global');

    return rule ? { ...pkg, sellingPrice: applyRule(rule, pkg.price) } : pkg;
  });
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** Fetch all packages from backend */
async function fetchAllPackages(): Promise<ESIMPackageRaw[]> {
  const res = await fetch('/api/esim/packages?package_type=BASE', {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return applyPricingRules(data.packages || []);
}

/** Fetch packages for a specific country */
export async function fetchPackagesForCountry(countryCode: string): Promise<ESIMPackageRaw[]> {
  const res = await fetch(`/api/esim/packages?location_code=${countryCode}&package_type=BASE`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const packages = await applyPricingRules(data.packages || []);
  // Filter to packages that only serve this exact country (not regional)
  return packages.filter((p: ESIMPackageRaw) => {
    const locs = p.location.split(',');
    return locs.length === 1 && locs[0].toUpperCase() === countryCode.toUpperCase();
  });
}

/** Fetch packages for a country (includes regional ones that cover it) */
export async function fetchAllPackagesForCountry(countryCode: string): Promise<ESIMPackageRaw[]> {
  const res = await fetch(`/api/esim/packages?location_code=${countryCode}&package_type=BASE`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return applyPricingRules(data.packages || []);
}

/**
 * Fetch all packages and group them by individual country.
 * Single-country packages → go to that country.
 * Multi-country (regional) → grouped separately.
 */
export async function fetchCountryGroups(): Promise<{
  countryGroups: ESIMCountryGroup[];
  regionalPackages: ESIMPackageRaw[];
}> {
  const packages = await fetchAllPackages();

  const countryMap = new Map<string, ESIMPackageRaw[]>();
  const regionalPackages: ESIMPackageRaw[] = [];

  for (const pkg of packages) {
    const locations = (pkg.location || '').split(',').map(l => l.trim()).filter(Boolean);
    if (locations.length === 1 && !locations[0].startsWith('!')) {
      const code = locations[0].toUpperCase();
      if (!countryMap.has(code)) countryMap.set(code, []);
      countryMap.get(code)!.push(pkg);
    } else {
      regionalPackages.push(pkg);
    }
  }

  const countryGroups: ESIMCountryGroup[] = Array.from(countryMap.entries())
    .map(([code, pkgs]) => ({
      countryCode: code,
      countryName: getCountryName(code),
      flag: countryCodeToFlag(code),
      packages: pkgs.sort((a, b) => a.price - b.price),
    }))
    .sort((a, b) => a.countryName.localeCompare(b.countryName));

  return { countryGroups, regionalPackages };
}

/** Fetch current account balance */
export async function fetchBalance(): Promise<{ balance: number; currencyCode?: string }> {
  const res = await fetch('/api/esim/balance');
  if (!res.ok) throw new Error(`Balance API error: ${res.status}`);
  return res.json();
}

/** Place an eSIM order */
export async function placeOrder(params: {
  packageCode: string;
  count?: number;
  transactionId?: string;
}): Promise<{ orderNo: string; transactionId: string }> {
  const res = await fetch('/api/esim/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      package_code: params.packageCode,
      count: params.count || 1,
      transaction_id: params.transactionId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.message || `Order failed: ${res.status}`);
  }
  return res.json();
}

/** Poll for eSIM QR code after ordering */
export async function getESIMByOrder(orderNo: string): Promise<any[]> {
  const res = await fetch(`/api/esim/esim/${orderNo}`);
  if (res.status === 202) throw new Error('PENDING'); // still allocating
  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  const data = await res.json();
  return data.esims || [];
}
