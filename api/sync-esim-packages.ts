/**
 * Vercel Cron API — Gündə 1 dəfə bot.eydost.az-dan bütün paketləri çəkib Supabase-yə yazır.
 * 
 * Setup:
 * 1. Bu faylı vercel.json cron siyahısına əlavə edin (aşağıya baxın)
 * 2. Supabase migration faylını apply edin: supabase/migrations/20260515000000_create_esim_packages_table.sql
 * 3. Environment variables əlavə edin (əgər yoxdursa):
 *    SUPABASE_URL — Supabase project URL
 *    SUPABASE_SERVICE_ROLE_KEY — service_role key (anon deyil!)
 * 
 * Vercel cron setup (vercel.json-ə əlavə edin):
 * {
 *   "crons": [{ "path": "/api/sync-esim-packages", "schedule": "0 6 * * *" }]
 * }
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────
const BOT_API = 'https://bot.eydost.az/api/public/packages';
const BOT_API_KEY = '0283e222ea829a8300d3f2ce4b42855d';

// Bütün ölkə kodları
const COUNTRIES = [
  'TR', 'AZ', 'RU', 'UA', 'GE', 'DE', 'FR', 'GB', 'IT', 'ES',
  'NL', 'BE', 'CH', 'AT', 'PL', 'PT', 'SE', 'NO', 'DK', 'FI',
  'CZ', 'HU', 'RO', 'BG', 'GR', 'HR', 'SK', 'SI', 'EE', 'LT',
  'LV', 'IE', 'LU', 'MT', 'CY', 'US', 'CA', 'MX', 'BR', 'AR',
  'CL', 'CO', 'PE', 'VE', 'EC', 'CN', 'JP', 'KR', 'HK', 'TW',
  'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'IN', 'PK', 'BD', 'LK',
  'AU', 'NZ', 'AE', 'SA', 'IL', 'JO', 'KW', 'QA', 'BH', 'OM',
  'LB', 'EG', 'ZA', 'NG', 'KE', 'GH', 'TZ', 'ET', 'MA', 'TN',
  'DZ', 'UG', 'MO', 'KH', 'KZ', 'UZ', 'AM', 'IS', 'AL', 'BA',
  'MK', 'RS', 'MD', 'MN', 'MM', 'NP', 'LY', 'IQ', 'IR', 'AF',
  'JM', 'TT', 'PR', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO',
  'CU', 'BO', 'PY', 'UY', 'GY', 'SR', 'BY', 'MZ', 'ZW', 'ZM',
  'AO', 'CM', 'SN', 'CI', 'ML', 'GL', 'XK', 'ME',
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface BotPackage {
  package_code: string;
  slug: string | null;
  name: string;
  volume: number;
  duration: number;
  sell_price_minor: number;
  currency: string;
  speed?: string;
  description?: string;
}

interface PackageRecord {
  country_code: string;
  package_code: string;
  slug: string | null;
  name: string;
  volume_bytes: number;
  duration_days: number;
  sell_price_minor: number;
  currency_code: string;
  is_unlimited: boolean;
  speed: string;
  network_type: null;
  description: string;
  is_active: boolean;
  last_synced_at: string;
}

// ── Fetch from bot API ─────────────────────────────────────────────────────────
async function fetchBotPackages(countryCode: string): Promise<BotPackage[]> {
  const url = `${BOT_API}?country_code=${encodeURIComponent(countryCode)}`;
  
  const res = await fetch(url, {
    headers: {
      'x-api-key': BOT_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Bot API error for ${countryCode}: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success || !Array.isArray(data.data)) {
    return [];
  }

  return data.data as BotPackage[];
}

// ── Upsert single country packages ────────────────────────────────────────────
function toPackageRecord(countryCode: string, pkg: BotPackage): PackageRecord {
  const isUnlimited = Number(pkg.volume) === 0;

  return {
    country_code: countryCode,
    package_code: pkg.package_code,
    slug: pkg.slug || null,
    name: pkg.name,
    volume_bytes: Number(pkg.volume) || 0,
    duration_days: Number(pkg.duration) || 1,
    sell_price_minor: Number(pkg.sell_price_minor) || 0,
    currency_code: pkg.currency || 'USD',
    is_unlimited: isUnlimited,
    speed: pkg.speed || '4G',
    network_type: null,
    description: pkg.description || pkg.name,
    is_active: true,
    last_synced_at: new Date().toISOString(),
  };
}

function formatPostgrestIn(values: string[]): string {
  return `(${values
    .map(value => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',')})`;
}

async function upsertPackagesForCountry(
  supabaseAdmin: any,
  countryCode: string,
  packages: BotPackage[]
): Promise<{ upserted: number; errors: number }> {
  if (packages.length === 0) {
    console.log(`  ${countryCode}: no packages returned; keeping existing active packages`);
    return { upserted: 0, errors: 0 };
  }

  let invalidPackages = 0;
  const recordsByCode = new Map<string, PackageRecord>();
  for (const pkg of packages) {
    const packageCode = pkg.package_code?.trim();
    if (!packageCode) {
      invalidPackages++;
      continue;
    }

    recordsByCode.set(packageCode, toPackageRecord(countryCode, {
      ...pkg,
      package_code: packageCode,
    }));
  }

  const records = Array.from(recordsByCode.values());
  if (records.length === 0) {
    console.error(`  ✗ ${countryCode}: no packages had package_code; keeping existing active packages`);
    return { upserted: 0, errors: packages.length };
  }

  const packageCodes = Array.from(new Set(records.map(record => record.package_code)));

  // Write fresh data before deactivating stale rows. If the upsert fails or times out,
  // existing active packages remain visible instead of wiping the public catalog.
  const { error: upsertError } = await supabaseAdmin
    .from('esim_packages')
    .upsert(records as any, {
      onConflict: 'country_code,package_code',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error(`  ✗ ${countryCode}: upsert failed: ${upsertError.message}`);
    return { upserted: 0, errors: packages.length };
  }

  const { error: deactivateError } = await supabaseAdmin
    .from('esim_packages')
    .update({ is_active: false } as any)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .not('package_code', 'in', formatPostgrestIn(packageCodes));

  if (deactivateError) {
    console.error(`  ✗ ${countryCode}: stale package deactivation failed: ${deactivateError.message}`);
    return { upserted: records.length, errors: invalidPackages + 1 };
  }

  return { upserted: records.length, errors: invalidPackages };
}

// ── Main sync function ─────────────────────────────────────────────────────────
async function syncAllPackages(): Promise<{
  countries: number;
  packages: number;
  errors: number;
  duration: number;
}> {
  const start = Date.now();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  console.log('🚀 Starting eSIM packages sync...');
  console.log(`📡 Fetching from ${BOT_API}`);
  console.log(`🌍 ${COUNTRIES.length} countries to check\n`);

  let totalCountries = 0;
  let totalPackages = 0;
  let totalErrors = 0;

  for (const countryCode of COUNTRIES) {
    try {
      console.log(`Fetching ${countryCode}...`);
      const packages = await fetchBotPackages(countryCode);
      
      const { upserted, errors } = await upsertPackagesForCountry(supabase, countryCode, packages);
      
      totalCountries++;
      totalPackages += upserted;
      totalErrors += errors;
      
      console.log(`  ✓ ${countryCode}: ${upserted} packages synced`);
    } catch (err: any) {
      console.error(`  ✗ ${countryCode}: ${err.message}`);
      totalErrors++;
    }
  }

  const duration = Date.now() - start;

  console.log(`\n✅ Sync complete!`);
  console.log(`   Countries: ${totalCountries}/${COUNTRIES.length}`);
  console.log(`   Packages: ${totalPackages}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);

  return {
    countries: totalCountries,
    packages: totalPackages,
    errors: totalErrors,
    duration,
  };
}

// ── Vercel Cron Handler ───────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // Only allow authenticated cron calls in production. Vercel sends this bearer
  // token automatically when CRON_SECRET is configured for the project.
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(500).json({ error: 'CRON_SECRET is not configured' });
    }

    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(403).json({ error: 'Forbidden — cron only' });
    }
  }

  try {
    const result = await syncAllPackages();

    return res.status(200).json({
      success: true,
      message: 'eSIM packages synced successfully',
      ...result,
      synced_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Sync failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Sync failed',
      synced_at: new Date().toISOString(),
    });
  }
}
