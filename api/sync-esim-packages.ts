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

async function deactivateStalePackagesForCountry(
  supabaseAdmin: any,
  countryCode: string,
  currentPackageCodes: Set<string>
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('esim_packages')
    .select('package_code')
    .eq('country_code', countryCode)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Could not load active packages for ${countryCode}: ${error.message}`);
  }

  const staleCodes = (data || [])
    .map((row: { package_code?: string }) => row.package_code)
    .filter((code: string | undefined): code is string => Boolean(code) && !currentPackageCodes.has(code));

  for (const packageCode of staleCodes) {
    const { error: updateError } = await supabaseAdmin
      .from('esim_packages')
      .update({ is_active: false } as any)
      .eq('country_code', countryCode)
      .eq('package_code', packageCode);

    if (updateError) {
      throw new Error(`Could not deactivate stale package ${countryCode}/${packageCode}: ${updateError.message}`);
    }
  }

  return staleCodes.length;
}

// ── Upsert single country packages ────────────────────────────────────────────
async function upsertPackagesForCountry(
  supabaseAdmin: any,
  countryCode: string,
  packages: BotPackage[]
): Promise<{ upserted: number; errors: number }> {
  let upserted = 0;
  let errors = 0;

  if (packages.length === 0) {
    console.log(`  ${countryCode}: no packages returned, keeping existing active packages`);
    return { upserted: 0, errors: 0 };
  }

  // Upsert each package
  for (const pkg of packages) {
    const isUnlimited = Number(pkg.volume) === 0;
    
    const record = {
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

    const { error } = await supabaseAdmin
      .from('esim_packages')
      .upsert(record as any, {
        onConflict: 'country_code,package_code',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`  ✗ ${countryCode}/${pkg.package_code}: ${error.message}`);
      errors++;
    } else {
      upserted++;
    }
  }

  if (errors > 0) {
    console.warn(`  ${countryCode}: skipped stale-package deactivation because ${errors} upsert(s) failed`);
    return { upserted, errors };
  }

  const currentPackageCodes = new Set(packages.map(pkg => pkg.package_code).filter(Boolean));
  const deactivated = await deactivateStalePackagesForCountry(supabaseAdmin, countryCode, currentPackageCodes);
  if (deactivated > 0) {
    console.log(`  ${countryCode}: deactivated ${deactivated} stale packages`);
  }

  return { upserted, errors };
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
  // Only allow cron (or local dev)
  if (process.env.NODE_ENV === 'production' && req.headers['x-vercel-cron'] !== '1') {
    return res.status(403).json({ error: 'Forbidden — cron only' });
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
