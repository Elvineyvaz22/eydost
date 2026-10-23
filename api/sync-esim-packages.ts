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

// Vercel Serverless Function runtime config — extend timeout up to 60s so the
// parallel sync of 210+ countries can finish within a single invocation.
export const config = {
  maxDuration: 60,
};

// ── Config ────────────────────────────────────────────────────────────────────
const BOT_API = process.env.ESIM_BOT_BASE_URL
  ? `${process.env.ESIM_BOT_BASE_URL.replace(/\/+$/, '')}/api/public/packages`
  : 'https://bot.eydost.az/api/public/packages';
const BOT_API_KEY = process.env.ESIM_BOT_API_KEY;

// Every country code that has a page in src/data/esimPackages.ts (210 entries)
// plus a few legacy codes (LY/IR/CI) that the bot may still serve. Keep this
// list in sync with the data file by running `npm run dump-countries`.
//
// IMPORTANT: this list determines what the daily Vercel cron asks the bot for.
// Anything not in here will never appear on the live site with current prices —
// the build-time inject-static.mjs falls back to hardcoded prices instead.
const COUNTRIES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AS',
  'AT', 'AU', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG',
  'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BR', 'BS', 'BT',
  'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL',
  'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CY', 'CZ', 'DE',
  'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ES', 'ET',
  'FI', 'FJ', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG',
  'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GR', 'GT', 'GU', 'GW',
  'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM',
  'IN', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE',
  'KG', 'KH', 'KI', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB',
  'LC', 'LI', 'LK', 'LR', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC',
  'MD', 'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ',
  'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NZ', 'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PR', 'PS', 'PT',
  'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB',
  'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO',
  'SR', 'SV', 'SZ', 'TC', 'TD', 'TG', 'TH', 'TJ', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VN', 'VU', 'WS', 'XK', 'YE', 'YT',
  'ZA', 'ZM', 'ZW',
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

type BotFetchAttempt =
  | { ok: true; packages: BotPackage[] }
  | { ok: false; errorMessage: string };

// ── Fetch from bot API ─────────────────────────────────────────────────────────
// The bot occasionally returns an empty `data` array (200 OK, no rows) when
// it gets hit with too many concurrent requests for the same country. To stop
// these false zeros from clobbering legitimate countries (TR, DE, FR, US, ...)
// we retry once with a short jittered delay if the first response is empty.
async function fetchBotPackagesOnce(countryCode: string): Promise<BotFetchAttempt> {
  const url = `${BOT_API}?country_code=${encodeURIComponent(countryCode)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'x-api-key': BOT_API_KEY ?? '',
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return { ok: false, errorMessage: `bot returned HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) {
      return { ok: false, errorMessage: 'bot returned an invalid packages payload' };
    }
    return { ok: true, packages: data.data as BotPackage[] };
  } catch (err: any) {
    return { ok: false, errorMessage: err?.message || 'failed to fetch bot packages' };
  }
}

async function fetchBotPackages(countryCode: string): Promise<BotFetchAttempt> {
  const first = await fetchBotPackagesOnce(countryCode);
  // If the first call genuinely returned packages, we're done.
  if (first.ok && first.packages.length > 0) return first;
  // Otherwise back off briefly (jitter to avoid retrying in lockstep) and try
  // again. This lets us tell apart "country has no packages" from "bot just
  // rate-limited us under high concurrency".
  await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 600)));
  const second = await fetchBotPackagesOnce(countryCode);
  if (second.ok && second.packages.length > 0) return second;
  if (first.ok) return first;
  if (second.ok) return second;
  return {
    ok: false,
    errorMessage: `${first.errorMessage}; retry: ${second.errorMessage}`,
  };
}

// ── Upsert single country packages (compound-unique upsert) ──────────────────
// Requires the migration 20260525000000_fix_esim_packages_constraints.sql
// to have been applied so that (country_code, package_code) is UNIQUE.
function postgrestInValue(values: string[]): string {
  const quoted = values.map((value) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `(${quoted.join(',')})`;
}

async function upsertPackagesForCountry(
  supabaseAdmin: any,
  countryCode: string,
  packages: BotPackage[]
): Promise<{ upserted: number; errors: number; errorMessage?: string }> {
  if (packages.length === 0) {
    return { upserted: 0, errors: 0 };
  }

  const now = new Date().toISOString();

  // Dedupe within this country in case the bot returns duplicates.
  const seen = new Set<string>();
  const records: any[] = [];
  for (const pkg of packages) {
    if (!pkg.package_code) continue;
    if (seen.has(pkg.package_code)) continue;
    seen.add(pkg.package_code);
    const isUnlimited = Number(pkg.volume) === 0;
    records.push({
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
      description: pkg.description || pkg.name,
      is_active: true,
      last_synced_at: now,
    });
  }

  if (records.length === 0) {
    return { upserted: 0, errors: 0 };
  }

  // Upsert first so transient bot/Supabase failures cannot wipe a country's
  // existing active catalog. Stale rows are deactivated only after this succeeds.
  const { error: upError } = await supabaseAdmin
    .from('esim_packages')
    .upsert(records as any, {
      onConflict: 'country_code,package_code',
      ignoreDuplicates: false,
    });

  if (upError) {
    console.error(`  ✗ ${countryCode} upsert: ${upError.message}`);
    return { upserted: 0, errors: records.length, errorMessage: upError.message };
  }

  const activePackageCodes = records.map((record) => record.package_code);
  const { error: staleError } = await supabaseAdmin
    .from('esim_packages')
    .update({ is_active: false } as any)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .not('package_code', 'in', postgrestInValue(activePackageCodes));

  if (staleError) {
    console.error(`  ✗ ${countryCode} stale deactivate: ${staleError.message}`);
    return { upserted: records.length, errors: 1, errorMessage: staleError.message };
  }
  return { upserted: records.length, errors: 0 };
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

  console.log(`🚀 Starting eSIM packages sync (parallel batched)`);
  console.log(`📡 Bot API: ${BOT_API}`);
  console.log(`🌍 ${COUNTRIES.length} countries\n`);

  let totalCountries = 0;
  let totalPackages = 0;
  let totalErrors = 0;
  const emptyCountries: string[] = [];
  const sampleErrors: Array<{ country: string; message: string }> = [];
  const perCountry: Record<string, { fetched: number; upserted: number; errors: number; errorMessage?: string }> = {};

  // Run in batches of CONCURRENCY to stay under Vercel function timeout.
  // 20 finishes 213 countries in ~38-45s. The bot occasionally throttles
  // under that load by returning an empty 200 — `fetchBotPackages` retries
  // those once before giving up, so the data still gets through.
  const CONCURRENCY = 20;
  for (let i = 0; i < COUNTRIES.length; i += CONCURRENCY) {
    const batch = COUNTRIES.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (countryCode) => {
        try {
          const fetchResult = await fetchBotPackages(countryCode);
          if (!fetchResult.ok) {
            return {
              countryCode,
              upserted: 0,
              errors: 1,
              ok: false,
              message: fetchResult.errorMessage,
            };
          }
          const packages = fetchResult.packages;
          const r: any = await upsertPackagesForCountry(
            supabase,
            countryCode,
            packages
          );
          return {
            countryCode,
            upserted: r.upserted,
            errors: r.errors,
            errorMessage: r.errorMessage,
            ok: true,
            fetched: packages.length,
          };
        } catch (err: any) {
          return { countryCode, upserted: 0, errors: 1, ok: false, message: err?.message };
        }
      })
    );

    for (const r of results) {
      if (r.ok) {
        totalCountries++;
        totalPackages += r.upserted;
        totalErrors += r.errors;
        if (r.fetched === 0) emptyCountries.push(r.countryCode);
        if (r.errorMessage && sampleErrors.length < 5) {
          sampleErrors.push({ country: r.countryCode, message: r.errorMessage });
        }
        perCountry[r.countryCode] = {
          fetched: (r as any).fetched ?? 0,
          upserted: r.upserted,
          errors: r.errors,
          errorMessage: r.errorMessage,
        };
      } else {
        totalErrors++;
        console.error(`  ✗ ${r.countryCode}: ${r.message}`);
        if (sampleErrors.length < 5) {
          sampleErrors.push({ country: r.countryCode, message: r.message || 'unknown' });
        }
        perCountry[r.countryCode] = {
          fetched: 0,
          upserted: 0,
          errors: 1,
          errorMessage: r.message,
        };
      }
    }
    console.log(
      `  batch ${i / CONCURRENCY + 1}: ${batch.length} countries done (running total: ${totalPackages} packages)`
    );
  }

  if (emptyCountries.length > 0) {
    console.log(`\n📭 ${emptyCountries.length} countries returned 0 packages: ${emptyCountries.join(',')}`);
  }
  // Stash sample errors on the return so the caller can surface them.
  (syncAllPackages as any)._lastSampleErrors = sampleErrors;
  (syncAllPackages as any)._lastPerCountry = perCountry;

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
  if (!BOT_API_KEY) {
    console.error('[sync-esim-packages] ESIM_BOT_API_KEY env var is missing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Allow:
  //   1. The Vercel cron itself (sets `x-vercel-cron: 1`)
  //   2. Manual triggers carrying `Authorization: Bearer <CRON_SECRET>`
  //      so we can run a sync on demand without waiting for 06:00 UTC.
  //   3. Local dev (NODE_ENV !== 'production')
  if (process.env.NODE_ENV === 'production') {
    const isCron = req.headers['x-vercel-cron'] === '1';
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers['authorization'] || '';
    const isAuthorised =
      cronSecret &&
      typeof authHeader === 'string' &&
      authHeader === `Bearer ${cronSecret}`;
    if (!isCron && !isAuthorised) {
      return res.status(403).json({ error: 'Forbidden — cron or bearer token only' });
    }
  }

  // Debug mode: ?country=XX runs the full pipeline for a single country and
  // returns the bot payload + supabase result inline. Useful when a country
  // mysteriously ends up empty in the table.
  const debugCountry = (req.query?.country || '').toString().toUpperCase();
  if (debugCountry && /^[A-Z]{2}$/.test(debugCountry)) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing SUPABASE env' });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    try {
      const fetchResult = await fetchBotPackages(debugCountry);
      if (!fetchResult.ok) {
        return res.status(502).json({
          country: debugCountry,
          error: fetchResult.errorMessage,
        });
      }
      const packages = fetchResult.packages;
      const result = await upsertPackagesForCountry(supabase, debugCountry, packages);
      const { data: rows, error: readErr } = await supabase
        .from('esim_packages')
        .select('country_code,package_code,name,is_active')
        .eq('country_code', debugCountry);
      return res.status(200).json({
        country: debugCountry,
        botFetched: packages.length,
        botSample: packages[0] || null,
        upsertResult: result,
        supabaseRowsAfter: rows?.length ?? 0,
        supabaseSample: rows?.slice(0, 3) || [],
        readError: readErr?.message || null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message, stack: err?.stack });
    }
  }

  try {
    const result = await syncAllPackages();
    const sampleErrors = (syncAllPackages as any)._lastSampleErrors || [];
    const perCountry = (syncAllPackages as any)._lastPerCountry || {};
    const detail = req.query?.detail === '1';

    // Snapshot Supabase right after sync so we can compare upserted vs visible
    // rows per country (catches anything getting silently nuked downstream).
    let supabaseCounts: Record<string, number> = {};
    if (detail) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
          });
          const { data } = await supabase
            .from('esim_packages')
            .select('country_code')
            .eq('is_active', true);
          if (Array.isArray(data)) {
            for (const row of data as any[]) {
              const c = row.country_code;
              supabaseCounts[c] = (supabaseCounts[c] || 0) + 1;
            }
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      message: 'eSIM packages synced successfully',
      ...result,
      sampleErrors,
      ...(detail ? { perCountry, supabaseCounts } : {}),
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
