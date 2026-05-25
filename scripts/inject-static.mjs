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

// ── Load slug ↔ country (+ hardcoded fallback plans) from esimPackages.ts ─
//
// The data file is the single source of truth. Every country object has
//   { countryCode: 'tr', country: 'Turkey', slug: 'turkey-esim',
//     ..., plans: [{ gb: 1, days: 7, price: '$0.81' }, ...] },
// or `plans: gZ` where gZ is a shared `Plan[]` defined at the top of the
// file. We parse both so that countries Supabase has not synced yet still
// produce enriched static HTML using the file's hardcoded prices.

async function loadDataFile() {
  const dataPath = path.join(projectRoot, 'src', 'data', 'esimPackages.ts');
  const src = await readFile(dataPath, 'utf8');

  // 1. Extract every shared plan-array constant: `const gZ: Plan[] = [...];`
  //    The closing `];` is on its own line, so we capture lazily across lines.
  const sharedPlans = new Map(); // 'gZ' -> [{gb, days, price}]
  const constRe = /const\s+(_?[a-zA-Z][a-zA-Z0-9]*)\s*:\s*Plan\[\]\s*=\s*\[([\s\S]*?)\];/g;
  let cm;
  while ((cm = constRe.exec(src)) !== null) {
    sharedPlans.set(cm[1], parsePlansLiteral(cm[2]));
  }

  // 2. Extract every country object. We anchor on `countryCode: 'xx'` and
  //    walk forward to capture the matching closing `}` of that object.
  const countries = new Map(); // slug -> { code, name, plans }
  const countryHeadRe = /countryCode:\s*'([a-z]{2})'\s*,\s*country:\s*'([^']+)'\s*,\s*slug:\s*'([^']+)'/g;
  let hm;
  while ((hm = countryHeadRe.exec(src)) !== null) {
    const [, code, name, slug] = hm;
    // Find this object's `plans:` payload starting at the head match.
    // 12 KB window is enough for countries with ~50 inline plans.
    const tail = src.slice(hm.index, hm.index + 12000);
    let plans = [];
    const plansRefMatch = /plans:\s*(_?[a-zA-Z][a-zA-Z0-9]*)\s*[},]/.exec(tail);
    const plansLitMatch = /plans:\s*\[([\s\S]*?)\]\s*[},]/.exec(tail);
    if (plansRefMatch && (!plansLitMatch || plansRefMatch.index < plansLitMatch.index)) {
      plans = sharedPlans.get(plansRefMatch[1]) || [];
    } else if (plansLitMatch) {
      plans = parsePlansLiteral(plansLitMatch[1]);
    }
    if (!countries.has(slug)) {
      countries.set(slug, { code: code.toUpperCase(), name, plans });
    }
  }
  return countries;
}

/** Parse the inside of a `Plan[]` literal — a sequence of `{ gb, days, price }`
 *  objects where `price` is either a string `'$1.23'` or a `m(N)` call (which
 *  evaluates to `'$' + (N * 1.75).toFixed(2)`). Plans may have additional
 *  optional fields after `price`, e.g. `code: 'TR'`, `id: 'CKH265'`. */
function parsePlansLiteral(body) {
  const plans = [];
  // Each plan looks like:
  //   `{ gb: 1, days: 7, price: m(0.46) },`
  //   `{ gb: 3, days: 30, price: '$1.42' },`
  //   `{ gb: 1, days: 7, price: m(1.05), code: 'JE', id: 'PLQZ...' },`
  // We allow anything up to the next `}` after `price`.
  const planRe =
    /\{\s*gb:\s*([\d.]+)\s*,\s*days:\s*(\d+)\s*,\s*price:\s*(?:m\(\s*([\d.]+)\s*\)|'([^']+)')[^}]*\}/g;
  let pm;
  while ((pm = planRe.exec(body)) !== null) {
    const gb = parseFloat(pm[1]);
    const days = parseInt(pm[2], 10);
    let price;
    if (pm[3] !== undefined) {
      // m(cost) => '$' + (cost * 1.75).toFixed(2)
      price = '$' + (parseFloat(pm[3]) * 1.75).toFixed(2);
    } else {
      price = pm[4];
    }
    plans.push({ gb, days, price });
  }
  return plans;
}

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
  // PostgREST defaults to a max-rows cap of 1000; we now have 2000+ active
  // packages, so we have to paginate explicitly.
  const PAGE_SIZE = 1000;
  const all = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url =
      `${SUPABASE_URL}/rest/v1/esim_packages` +
      `?is_active=eq.true` +
      `&select=country_code,package_code,slug,name,volume_bytes,duration_days,sell_price_minor,currency_code,is_unlimited` +
      `&order=sell_price_minor.asc` +
      `&limit=${PAGE_SIZE}` +
      `&offset=${offset}`;

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
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return all;
}

// ── per-country page generation ─────────────────────────────────────────────

/** Normalise either Supabase rows or hardcoded esimPackages.ts plans into
 *  one shape: { name, sku, gb, days, priceUSD, isUnlimited } */
function normalisePackages(supabaseRows, hardcodedPlans, countryName) {
  if (supabaseRows && supabaseRows.length) {
    return supabaseRows.map((p) => ({
      name: p.name || `${countryName} eSIM`,
      sku: p.package_code,
      isUnlimited: !!p.is_unlimited,
      volumeLabel: formatVolume(p),
      days: p.duration_days || 0,
      priceUSD: formatPriceUSD(p.sell_price_minor),
    }));
  }
  // Fallback: hardcoded plans from src/data/esimPackages.ts. price is like '$1.23'.
  return (hardcodedPlans || []).map((p, i) => ({
    name: `${countryName} ${p.gb}GB ${p.days}Days`,
    sku: `${countryName.replace(/\s+/g, '').toUpperCase()}_${p.gb}_${p.days}_${i}`,
    isUnlimited: false,
    volumeLabel: p.gb < 1 ? `${Math.round(p.gb * 1024)} MB` : `${p.gb} GB`,
    days: p.days,
    priceUSD: (p.price || '').replace(/[^0-9.]/g, '') || '0.00',
  }));
}

function buildCountryPage(template, slug, countryCode, countryName, packages) {
  // packages: array of { name, sku, isUnlimited, volumeLabel, days, priceUSD }
  // already sorted by ascending price.
  const cheapest = packages[0];
  const cheapestUsd = cheapest ? cheapest.priceUSD : null;
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
        name: p.name,
        description: `${countryName} eSIM — ${p.volumeLabel} for ${p.days} days. Delivered as a QR code on WhatsApp.`,
        category: 'eSIM data plan',
        sku: p.sku,
        brand: { '@type': 'Brand', name: 'Ey Dost' },
        offers: {
          '@type': 'Offer',
          price: p.priceUSD,
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
          p.name
        )}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #f3f4f6">${escapeHtml(
          p.volumeLabel
        )}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #f3f4f6">${
          p.days || '—'
        } days</td><td style="padding:6px;text-align:right;border-bottom:1px solid #f3f4f6"><strong>$${
          p.priceUSD
        }</strong></td></tr>`
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

  let slugMap;
  try {
    slugMap = await loadDataFile();
    console.log(`[inject] loaded ${slugMap.size} country slugs from esimPackages.ts`);
  } catch (err) {
    console.error(`[inject] could not parse esimPackages.ts: ${err.message}`);
    return;
  }

  let supabasePackages = [];
  try {
    supabasePackages = await fetchAllPackages();
    console.log(`[inject] fetched ${supabasePackages.length} active packages from Supabase`);
  } catch (err) {
    console.warn(`[inject] supabase fetch failed (${err.message}) — using hardcoded fallback only`);
  }

  const byCountry = new Map();
  for (const p of supabasePackages) {
    if (!p.country_code) continue;
    const cc = p.country_code.toUpperCase();
    if (!byCountry.has(cc)) byCountry.set(cc, []);
    byCountry.get(cc).push(p);
  }

  let writtenLive = 0;
  let writtenFallback = 0;
  const noPackages = [];
  const failed = [];
  for (const [slug, info] of slugMap) {
    const supaRows = byCountry.get(info.code) || null;
    const hardcoded = info.plans || [];
    const packages = normalisePackages(supaRows, hardcoded, info.name);

    if (packages.length === 0) {
      noPackages.push(slug);
      continue;
    }

    try {
      const html = buildCountryPage(template, slug, info.code, info.name, packages);
      const outDir = path.join(distDir, slug);
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
      if (supaRows && supaRows.length) writtenLive++;
      else writtenFallback++;
    } catch (err) {
      failed.push(`${slug} (${err.message})`);
    }
  }

  const total = writtenLive + writtenFallback;
  console.log(
    `[inject] wrote ${total}/${slugMap.size} country pages into dist/ ` +
      `(${writtenLive} with live Supabase prices, ${writtenFallback} from hardcoded fallback)`
  );
  if (noPackages.length) {
    console.log(
      `[inject] ${noPackages.length} slugs had neither Supabase nor hardcoded plans: ${noPackages.slice(0, 8).join(', ')}${noPackages.length > 8 ? '…' : ''}`
    );
  }
  if (failed.length) {
    console.warn(`[inject] failed: ${failed.join('; ')}`);
  }
}

main().catch((err) => {
  console.error('[inject] fatal:', err);
  // Never fail the build — the site still ships, just without per-country
  // static enrichment.
  process.exitCode = 0;
});
