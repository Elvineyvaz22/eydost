/**
 * eSIM Service Layer
 * ==================
 * Məlumatlar Supabase-dən gəlir (gündəlik bot sync ilə yenilənir).
 */

import { supabase } from '../lib/supabase';
import type { PackageData } from '../data/esimPackages';

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

export function formatPrice(sellMinor: number, currency = 'AZN', displayCurrency: 'USD' | 'AZN' = 'USD'): string {
  // sell_price_minor is in minor units (10000 = 1 AZN or 1 USD depending on currency)
  // Bot API returns AZN prices in AZN minor units
  const amount = sellMinor / 10000;
  const sourceCurrency = currency.toUpperCase();
  const usd = sourceCurrency === 'AZN' ? amount / 1.7 : amount;
  if (displayCurrency === 'AZN') return '₼' + (usd * 1.7).toFixed(2);
  return '$' + usd.toFixed(2);
}

export function formatGB(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb < 1) {
    const mb = bytes / (1024 * 1024);
    return Math.round(mb) + ' MB';
  }
  return gb.toFixed(1) + ' GB';
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

function localeForAppLanguage(lang: string): string {
  switch ((lang || 'en').toLowerCase()) {
    case 'az':
      return 'az-Latn';
    case 'ru':
      return 'ru-RU';
    case 'tr':
      return 'tr-TR';
    case 'ar':
      return 'ar';
    case 'es':
      return 'es';
    case 'zh':
      return 'zh-Hans';
    default:
      return 'en';
  }
}

/**
 * Localized country/region name for the UI + SEO, based on BCP-47 locale.
 * Falls back to our static English map when Intl.DisplayNames isn't available.
 */
export function getCountryNameLocalized(code: string, lang: string): string {
  const cc = (code || '').toUpperCase();
  if (!cc) return '';
  try {
    // Intl.DisplayNames may throw in older browsers; keep safe fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DisplayNames: any = (Intl as any).DisplayNames;
    if (typeof DisplayNames === 'function') {
      const dn = new DisplayNames([localeForAppLanguage(lang)], { type: 'region' });
      const name = dn.of(cc);
      if (name && typeof name === 'string') return name;
    }
  } catch {
    /* ignore */
  }
  return getCountryName(cc) || cc;
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

interface PublicApiPackage {
  package_code: string;
  slug: string;
  name: string;
  country_code: string;
  data_type?: number;
  unlimited?: boolean;
  currency?: string;
  sell_price?: string;
  sell_price_minor?: number;
  volume?: string | number;
  duration?: number;
}

const COUNTRY_PACKAGES_CACHE_PREFIX = 'eydost_esim_country_packages_';
const COUNTRY_PACKAGES_CACHE_TTL_MS = 10 * 60 * 1000;

type CachedCountryPackages = {
  savedAt: number;
  packages: ESIMPackageRaw[];
};

function getCountryPackagesCacheKey(countryCode: string) {
  return COUNTRY_PACKAGES_CACHE_PREFIX + countryCode.toUpperCase();
}

export function getCachedPackagesForCountry(countryCode: string): ESIMPackageRaw[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(getCountryPackagesCacheKey(countryCode));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedCountryPackages;
    if (!cached?.savedAt || !Array.isArray(cached.packages)) return null;
    if (Date.now() - cached.savedAt > COUNTRY_PACKAGES_CACHE_TTL_MS) return null;
    return cached.packages;
  } catch {
    return null;
  }
}

function setCachedPackagesForCountry(countryCode: string, packages: ESIMPackageRaw[]) {
  if (typeof window === 'undefined') return;
  try {
    if (packages.length === 0) {
      sessionStorage.removeItem(getCountryPackagesCacheKey(countryCode));
      return;
    }
    sessionStorage.setItem(
      getCountryPackagesCacheKey(countryCode),
      JSON.stringify({ savedAt: Date.now(), packages } satisfies CachedCountryPackages)
    );
  } catch {
    /* ignore cache quota/private mode */
  }
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

function publicApiToRaw(p: PublicApiPackage): ESIMPackageRaw {
  const volume = typeof p.volume === 'string' ? Number(p.volume) : Number(p.volume || 0);
  const sellMinor =
    typeof p.sell_price_minor === 'number'
      ? p.sell_price_minor
      : Math.round(Number(p.sell_price || 0) * 10000);

  return {
    packageCode: p.package_code,
    slug: p.slug || p.package_code,
    name: p.name,
    sell_price_minor: sellMinor,
    currencyCode: p.currency || 'AZN',
    volume: Number.isFinite(volume) ? volume : 0,
    duration: p.duration || 1,
    speed: '3G/4G/5G',
    description: p.name,
    is_unlimited: Boolean(p.unlimited || p.data_type === 2 || /GB\/Day/i.test(p.name)),
  };
}

async function fetchPackagesFromPublicApi(countryCode: string): Promise<ESIMPackageRaw[]> {
  const response = await fetch(
    `/api/public-api-proxy?path=/api/public/packages&country_code=${encodeURIComponent(countryCode.toUpperCase())}`
  );
  const json = await response.json();
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Live eSIM API unavailable');
  }
  return (Array.isArray(json.data) ? json.data : []).map(publicApiToRaw);
}

async function fetchPackagesFromSupabase(countryCode: string): Promise<ESIMPackageRaw[]> {
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
 * Fetch packages for a specific country from the live API, with Supabase fallback only on API errors.
 */
export async function fetchPublicPackagesForCountry(countryCode: string): Promise<ESIMPackageRaw[]> {
  try {
    const live = await fetchPackagesFromPublicApi(countryCode);
    setCachedPackagesForCountry(countryCode, live);
    return live;
  } catch {
    // Keep the country page usable if the upstream API or proxy is unavailable.
  }
  const fallback = await fetchPackagesFromSupabase(countryCode);
  setCachedPackagesForCountry(countryCode, fallback);
  return fallback;
}

/**
 * Fetch all packages grouped by country from Supabase.
 * The public API requires a country code, so search results are live-checked per country in the UI.
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

/** Cheapest package with a real price (skip 0 / missing from sync). */
export function pickCheapestPricedPackage(pkgs: ESIMPackageRaw[]): ESIMPackageRaw | null {
  const valid = pkgs.filter((p) => (p.sell_price_minor ?? 0) > 0);
  if (!valid.length) return null;
  return valid.reduce<ESIMPackageRaw | null>(
    (best, p) => (!best || p.sell_price_minor < best.sell_price_minor ? p : best),
    null
  );
}

function slugForCountryCode(cc: string, staticPackages: PackageData[]): string {
  const known = staticPackages.find((p) => p.countryCode.toUpperCase() === cc.toUpperCase());
  if (known) return known.slug;
  const name = getCountryName(cc) || cc;
  return `${name.toLowerCase().replace(/\s+/g, '-')}-esim`;
}

function planFromLivePackage(p: ESIMPackageRaw) {
  return {
    gb:
      p.volume > 0
        ? parseFloat((p.volume / (1024 * 1024 * 1024)).toFixed(1))
        : 1,
    days: p.duration,
    price: formatPrice(p.sell_price_minor, p.currencyCode),
    code: p.packageCode,
    id: p.slug,
  };
}

/**
 * All static countries stay visible; live Supabase prices override when valid.
 */
export function mergeStaticWithLive(
  staticPackages: PackageData[],
  liveByCountry: Record<string, ESIMPackageRaw[]>
): PackageData[] {
  const liveMap: Record<string, ESIMPackageRaw[]> = {};
  for (const [cc, pkgs] of Object.entries(liveByCountry)) {
    liveMap[cc.toUpperCase()] = pkgs;
  }

  const seen = new Set<string>();
  const merged: PackageData[] = [];

  for (const sp of staticPackages) {
    const cc = sp.countryCode.toUpperCase();
    seen.add(cc);
    const cheapest = pickCheapestPricedPackage(liveMap[cc] || []);
    const plans =
      cheapest != null
        ? [planFromLivePackage(cheapest)]
        : sp.plans.filter((pl) => pl.price && pl.price !== '$0.00');

    merged.push({
      ...sp,
      plans: plans.length > 0 ? plans : sp.plans,
    });
  }

  for (const [cc, pkgs] of Object.entries(liveMap)) {
    if (seen.has(cc)) continue;
    const cheapest = pickCheapestPricedPackage(pkgs);
    if (!cheapest) continue;
    merged.push({
      country: getCountryName(cc) || cc,
      countryCode: cc,
      flag: countryCodeToFlag(cc),
      slug: slugForCountryCode(cc, staticPackages),
      region: 'all',
      plans: [planFromLivePackage(cheapest)],
    });
  }

  return merged.sort((a, b) => a.country.localeCompare(b.country));
}

/**
 * Country search/list cards must show only sellable live countries.
 * Static data is used only for slug, region and featured metadata.
 */
export function mergeLiveCountriesWithStaticMeta(
  staticPackages: PackageData[],
  liveByCountry: Record<string, ESIMPackageRaw[]>
): PackageData[] {
  const merged: PackageData[] = [];

  for (const [rawCode, pkgs] of Object.entries(liveByCountry)) {
    const cc = rawCode.toUpperCase();
    const cheapest = pickCheapestPricedPackage(pkgs || []);
    if (!cheapest) continue;

    const staticMatch = staticPackages.find((p) => p.countryCode.toUpperCase() === cc);
    merged.push({
      ...(staticMatch || {
        country: getCountryName(cc) || cc,
        countryCode: cc,
        flag: countryCodeToFlag(cc),
        slug: slugForCountryCode(cc, staticPackages),
        region: 'all',
        plans: [],
      }),
      country: staticMatch?.country || getCountryName(cc) || cc,
      countryCode: cc,
      flag: staticMatch?.flag || countryCodeToFlag(cc),
      slug: slugForCountryCode(cc, staticPackages),
      region: staticMatch?.region || 'all',
      featured: staticMatch?.featured || false,
      plans: [planFromLivePackage(cheapest)],
    });
  }

  return merged.sort((a, b) => a.country.localeCompare(b.country));
}
