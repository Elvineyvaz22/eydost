/* eslint-disable no-console */
/**
 * Build-time static enrichment for eSIM country pages.
 *
 * The site is a Vite SPA — without prerender, every route serves the same
 * empty `<div id="root">` shell. AI crawlers and non-JS bots see nothing
 * about Turkey eSIM packages, prices, etc.
 *
 * This script runs *after* `vite build` and:
 *   1. Fetches the live esim_packages table from Supabase (HTTP only, no
 *      Puppeteer — runs in ~2 seconds for ~100 countries).
 *   2. Reads dist/index.html as a template.
 *   3. For every <country>-esim slug it has data for, writes a copy of
 *      index.html to dist/<slug>/index.html with:
 *        - Country-specific <title>, <meta description>, OG/canonical tags
 *        - A Product/ItemList JSON-LD with each package as a schema.org
 *          Offer (price, GB, validity) — fully visible to GPTBot, Claude,
 *          Perplexity, Google rich results.
 *        - A <noscript> fallback table that lists every package for the
 *          country in plain HTML — visible to non-JS crawlers and to
 *          users who block JavaScript.
 *
 * JS-enabled visitors still get the React app on top of this enriched
 * shell, so the visible UI is unchanged.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://eydost.com').replace(/\/+$/, '');

// Anon ("publishable") key is safe to commit — it's the same one shipped to
// every browser in the Vite bundle. We still prefer the env var on Vercel.
const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL || 'https://ghbyibsmsztcanurozyk.supabase.co'
).replace(/\/+$/, '');
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_fOuAoSKMvfTQeABhSym8kQ_drhFrpeo';

// ── slug ↔ country code (mirrors src/pages/CountryEsim.tsx) ─────────────────

const SLUG_TO_CODE = {
  'turkey-esim': 'TR', 'united-states-esim': 'US', 'germany-esim': 'DE',
  'france-esim': 'FR', 'uk-esim': 'GB', 'italy-esim': 'IT', 'spain-esim': 'ES',
  'netherlands-esim': 'NL', 'belgium-esim': 'BE', 'switzerland-esim': 'CH',
  'austria-esim': 'AT', 'poland-esim': 'PL', 'portugal-esim': 'PT', 'sweden-esim': 'SE',
  'norway-esim': 'NO', 'denmark-esim': 'DK', 'finland-esim': 'FI', 'czech-republic-esim': 'CZ',
  'hungary-esim': 'HU', 'romania-esim': 'RO', 'bulgaria-esim': 'BG', 'greece-esim': 'GR',
  'croatia-esim': 'HR', 'slovakia-esim': 'SK', 'slovenia-esim': 'SI', 'estonia-esim': 'EE',
  'latvia-esim': 'LV', 'lithuania-esim': 'LT', 'ireland-esim': 'IE', 'luxembourg-esim': 'LU',
  'malta-esim': 'MT', 'cyprus-esim': 'CY', 'azerbaijan-esim': 'AZ', 'georgia-esim': 'GE',
  'ukraine-esim': 'UA', 'russia-esim': 'RU', 'canada-esim': 'CA', 'mexico-esim': 'MX',
  'brazil-esim': 'BR', 'argentina-esim': 'AR', 'chile-esim': 'CL', 'colombia-esim': 'CO',
  'peru-esim': 'PE', 'china-esim': 'CN', 'japan-esim': 'JP', 'south-korea-esim': 'KR',
  'hong-kong-esim': 'HK', 'taiwan-esim': 'TW', 'singapore-esim': 'SG', 'malaysia-esim': 'MY',
  'thailand-esim': 'TH', 'indonesia-esim': 'ID', 'philippines-esim': 'PH', 'vietnam-esim': 'VN',
  'india-esim': 'IN', 'pakistan-esim': 'PK', 'bangladesh-esim': 'BD', 'sri-lanka-esim': 'LK',
  'australia-esim': 'AU', 'new-zealand-esim': 'NZ', 'uae-esim': 'AE', 'saudi-arabia-esim': 'SA',
  'israel-esim': 'IL', 'jordan-esim': 'JO', 'kuwait-esim': 'KW', 'qatar-esim': 'QA',
  'bahrain-esim': 'BH', 'oman-esim': 'OM', 'lebanon-esim': 'LB', 'egypt-esim': 'EG',
  'south-africa-esim': 'ZA', 'nigeria-esim': 'NG', 'kenya-esim': 'KE', 'ghana-esim': 'GH',
  'tanzania-esim': 'TZ', 'ethiopia-esim': 'ET', 'morocco-esim': 'MA', 'tunisia-esim': 'TN',
  'algeria-esim': 'DZ', 'uganda-esim': 'UG', 'moldova-esim': 'MD', 'iceland-esim': 'IS',
  'albania-esim': 'AL', 'bosnia-esim': 'BA', 'north-macedonia-esim': 'MK', 'serbia-esim': 'RS',
  'montenegro-esim': 'ME',
};

const COUNTRY_NAMES = {
  AZ: 'Azerbaijan', TR: 'Turkey', RU: 'Russia', UA: 'Ukraine', GE: 'Georgia',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', IT: 'Italy', ES: 'Spain',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria', PL: 'Poland',
  PT: 'Portugal', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece',
  HR: 'Croatia', SK: 'Slovakia', SI: 'Slovenia', EE: 'Estonia', LV: 'Latvia',
  LT: 'Lithuania', IE: 'Ireland', LU: 'Luxembourg', MT: 'Malta', CY: 'Cyprus',
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru',
  CN: 'China', JP: 'Japan', KR: 'South Korea', HK: 'Hong Kong', TW: 'Taiwan',
  SG: 'Singapore', MY: 'Malaysia', TH: 'Thailand', ID: 'Indonesia', PH: 'Philippines',
  VN: 'Vietnam', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka',
  AU: 'Australia', NZ: 'New Zealand',
  AE: 'UAE', SA: 'Saudi Arabia', IL: 'Israel', JO: 'Jordan', KW: 'Kuwait',
  QA: 'Qatar', BH: 'Bahrain', OM: 'Oman', LB: 'Lebanon', EG: 'Egypt',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', TZ: 'Tanzania',
  ET: 'Ethiopia', MA: 'Morocco', TN: 'Tunisia', DZ: 'Algeria', UG: 'Uganda',
  IS: 'Iceland', AL: 'Albania', BA: 'Bosnia', MK: 'North Macedonia', RS: 'Serbia',
  MD: 'Moldova', ME: 'Montenegro',
};

// ── helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJsonForScript(json) {
  // Avoid </script> ending the JSON-LD block.
  return json.replace(/<\/script>/gi, '<\\/script>');
}

function formatPriceUSD(sellMinor) {
  // sell_price_minor is AZN minor units (10000 = 1 AZN). Convert AZN → USD ~ 1.7.
  const azn = (sellMinor || 0) / 10000;
  const usd = azn / 1.7;
  return usd.toFixed(2);
}

function formatVolume(p) {
  if (p.is_unlimited) return 'Unlimited';
  if (!p.volume_bytes || p.volume_bytes <= 0) return '—';
  const gb = p.volume_bytes / (1024 ** 3);
  if (gb < 1) return `${Math.round(p.volume_bytes / (1024 ** 2))} MB`;
  return `${gb.toFixed(gb < 10 ? 1 : 0)} GB`;
}

// ── data fetching ───────────────────────────────────────────────────────────

async function fetchAllPackages() {
  const url =
    `${SUPABASE_URL}/rest/v1/esim_packages` +
    `?is_active=eq.true` +
    `&select=country_code,package_code,slug,name,volume_bytes,duration_days,sell_price_minor,currency_code,is_unlimited` +
    `&order=sell_price_minor.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ── per-country page generation ─────────────────────────────────────────────

function buildCountryPage(template, slug, countryCode, packages) {
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  const cheapest = packages[0]; // sorted asc by price
  const cheapestUsd = cheapest ? formatPriceUSD(cheapest.sell_price_minor) : null;
  const url = `${SITE_URL}/${slug}`;

  const title = cheapestUsd
    ? `${countryName} eSIM from $${cheapestUsd} — Instant Mobile Data via WhatsApp | Ey Dost`
    : `${countryName} eSIM — Instant Mobile Data via WhatsApp | Ey Dost`;

  const description = cheapestUsd
    ? `Buy a prepaid eSIM for ${countryName} from $${cheapestUsd}. ${packages.length} plans available — activate in seconds via WhatsApp QR code, no roaming fees, no app needed. Order on WhatsApp +994 99 201 01 17.`
    : `Buy a prepaid eSIM for ${countryName} via WhatsApp QR — no roaming fees, no app needed. Order on WhatsApp +994 99 201 01 17.`;

  // ── Product / ItemList JSON-LD (cap at 30 items so the JSON stays sane) ──
  const items = packages.slice(0, 30);
  const productListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${countryName} eSIM data plans`,
    description,
    numberOfItems: packages.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name || `${countryName} ${formatVolume(p)} eSIM`,
        description: `${countryName} eSIM — ${formatVolume(p)} for ${p.duration_days} days. Delivered as a QR code on WhatsApp.`,
        category: 'eSIM data plan',
        sku: p.package_code,
        brand: { '@type': 'Brand', name: 'Ey Dost' },
        offers: {
          '@type': 'Offer',
          price: formatPriceUSD(p.sell_price_minor),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url,
          seller: { '@id': `${SITE_URL}/#organization` },
        },
      },
    })),
  };

  // BreadcrumbList helps Google understand the URL hierarchy.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'eSIM', item: `${SITE_URL}/esim` },
      { '@type': 'ListItem', position: 3, name: `${countryName} eSIM`, item: url },
    ],
  };

  // ── <noscript> fallback: full plain-HTML package table ──
  const tableRows = packages
    .map(
      (p) =>
        `              <tr><td style="padding:6px;border-bottom:1px solid #f3f4f6">${escapeHtml(
          p.name || ''
        )}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #f3f4f6">${escapeHtml(
          formatVolume(p)
        )}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #f3f4f6">${
          p.duration_days || '—'
        } days</td><td style="padding:6px;text-align:right;border-bottom:1px solid #f3f4f6"><strong>$${formatPriceUSD(
          p.sell_price_minor
        )}</strong></td></tr>`
    )
    .join('\n');

  const noscriptHtml = `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:780px;margin:48px auto;padding:24px;line-height:1.6;color:#111827;">
          <h1 style="font-size:28px;margin:0 0 16px;">${escapeHtml(countryName)} eSIM — instant mobile data via WhatsApp</h1>
          <p>Buy a prepaid eSIM for <strong>${escapeHtml(countryName)}</strong> on WhatsApp. We send a QR code; scan it with your phone (iPhone or Android) and your data works in seconds. No physical SIM swap, no roaming fees, no app to install.</p>
          <p><strong>Order on WhatsApp:</strong> <a href="https://wa.me/994992010117">+994 99 201 01 17</a> · Or visit <a href="${url}">${url.replace('https://', '')}</a></p>

          <h2 style="font-size:20px;margin:24px 0 8px;">${escapeHtml(countryName)} eSIM packages (${packages.length})</h2>
          <p style="margin:0 0 12px;color:#6b7280;font-size:14px">Live prices — synced daily. Tap any plan and we'll send the QR via WhatsApp.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f9fafb">
                <th style="text-align:left;padding:8px;border-bottom:2px solid #e5e7eb">Plan</th>
                <th style="text-align:right;padding:8px;border-bottom:2px solid #e5e7eb">Data</th>
                <th style="text-align:right;padding:8px;border-bottom:2px solid #e5e7eb">Validity</th>
                <th style="text-align:right;padding:8px;border-bottom:2px solid #e5e7eb">Price (USD)</th>
              </tr>
            </thead>
            <tbody>
${tableRows}
            </tbody>
          </table>
          <p style="margin-top:20px"><a href="https://wa.me/994992010117" style="background:#25D366;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:600">Order ${escapeHtml(countryName)} eSIM on WhatsApp →</a></p>

          <h2 style="font-size:20px;margin:32px 0 8px;">How ${escapeHtml(countryName)} eSIM works</h2>
          <ol>
            <li>Pick a plan on this page (or just tell us your data needs on WhatsApp).</li>
            <li>Pay via WhatsApp — Apple Pay, Google Pay, card or local payment.</li>
            <li>Receive a QR code in the chat. Scan it once on your phone.</li>
            <li>Internet works in seconds — no SIM swap needed.</li>
          </ol>

          <p style="margin-top:24px;color:#6b7280;font-size:13px">Ey Dost — global eSIM &amp; taxi via WhatsApp · <a href="${SITE_URL}">eydost.com</a></p>
        </div>
  `;

  // ── inject into template ─────────────────────────────────────────────────
  let html = template;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

  // <meta name="description">
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // OG title / description / url
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${url}" />`
  );

  // Twitter title / description
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );

  // canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${url}" />`
  );

  // Inject Product + Breadcrumb JSON-LD just before </head>
  const ldScripts =
    `    <!-- Country eSIM JSON-LD (build-time injected) -->\n` +
    `    <script type="application/ld+json">${escapeJsonForScript(JSON.stringify(productListLd))}</script>\n` +
    `    <script type="application/ld+json">${escapeJsonForScript(JSON.stringify(breadcrumbLd))}</script>\n` +
    `  </head>`;
  html = html.replace('</head>', ldScripts);

  // Replace the <noscript>…</noscript> block with country-specific content.
  // (The original generic block lives in the home-page shell.)
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>${noscriptHtml}</noscript>`
  );

  return html;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  let template;
  try {
    template = await readFile(path.join(distDir, 'index.html'), 'utf8');
  } catch (err) {
    console.error('[inject] dist/index.html not found — run `vite build` first.');
    return; // soft-fail: do not break the build
  }

  let allPackages = [];
  try {
    allPackages = await fetchAllPackages();
    console.log(`[inject] fetched ${allPackages.length} active packages from Supabase`);
  } catch (err) {
    console.warn(`[inject] supabase fetch failed (${err.message}) — skipping enrichment`);
    return; // soft-fail: build still ships, just without enrichment
  }

  const byCountry = new Map();
  for (const p of allPackages) {
    if (!p.country_code) continue;
    const cc = p.country_code.toUpperCase();
    if (!byCountry.has(cc)) byCountry.set(cc, []);
    byCountry.get(cc).push(p);
  }

  let written = 0;
  let skipped = 0;
  for (const [slug, code] of Object.entries(SLUG_TO_CODE)) {
    const pkgs = byCountry.get(code);
    if (!pkgs || pkgs.length === 0) {
      skipped++;
      continue;
    }
    try {
      const html = buildCountryPage(template, slug, code, pkgs);
      const outDir = path.join(distDir, slug);
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
      written++;
    } catch (err) {
      console.warn(`[inject] failed for ${slug}: ${err.message}`);
      skipped++;
    }
  }

  console.log(
    `[inject] wrote ${written} country pages (${skipped} skipped) into dist/`
  );
}

main().catch((err) => {
  console.error('[inject] fatal:', err);
  // Never fail the build — the site still ships, just without per-country
  // static enrichment.
  process.exitCode = 0;
});
