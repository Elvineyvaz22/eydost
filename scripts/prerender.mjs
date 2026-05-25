/**
 * Build-time prerender — converts the SPA into static HTML for every public route
 * so that non-JS crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot, …) can read full
 * page content. Real users still hydrate into the regular React SPA.
 *
 * Flow:
 *   1. Read public routes from `public/sitemap.xml` (single source of truth).
 *   2. Spin up a tiny static server over `dist/`.
 *   3. Launch headless Chromium, visit each route, wait for the React tree to
 *      dispatch the `render-event`, then grab the rendered HTML.
 *   4. Write `dist/<route>/index.html` with the prerendered content.
 *
 * Safe-by-default: any route that fails to render is logged but does NOT fail the
 * build — Vercel still serves the SPA fallback (`/index.html`) for that path, so
 * users never see a broken page. Only the SEO benefit is lost for that route.
 *
 * Skip: `/admin/*`, `/taxi-order` (auth/dynamic), anything with `?` query string.
 */

import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Dynamic import so that a missing/broken puppeteer install doesn't crash the
// build at module-load time — we degrade gracefully to "skip prerender".
let puppeteer;
try {
  ({ default: puppeteer } = await import('puppeteer'));
} catch (err) {
  console.warn(
    '[prerender] puppeteer is not installed in this environment — skipping prerender. ' +
      'Reason:', err?.message || err
  );
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');

const SITE_ORIGIN = 'https://eydost.com';
const PRERENDER_TIMEOUT_MS = 20000;
const RENDER_EVENT = 'render-event';
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 4);

const SKIP_PREFIXES = ['/admin', '/api'];
const SKIP_EXACT = new Set(['/taxi-order']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function logInfo(...args) { console.log('[prerender]', ...args); }
function logWarn(...args) { console.warn('[prerender][warn]', ...args); }
function logErr(...args) { console.error('[prerender][error]', ...args); }

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readSitemapRoutes() {
  const xml = await fs.readFile(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const routes = new Set();
  for (const loc of locs) {
    try {
      const u = new URL(loc);
      if (u.origin !== SITE_ORIGIN && !u.hostname.endsWith('eydost.com')) continue;
      let pathname = u.pathname || '/';
      if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
      routes.add(pathname);
    } catch {
      /* ignore malformed url */
    }
  }
  return [...routes];
}

function shouldSkip(route) {
  if (SKIP_EXACT.has(route)) return true;
  return SKIP_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`));
}

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlObj = new URL(req.url || '/', 'http://localhost');
        let pathname = decodeURIComponent(urlObj.pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';

        const filePath = path.normalize(path.join(rootDir, pathname));
        if (!filePath.startsWith(rootDir)) {
          res.statusCode = 403; res.end('forbidden'); return;
        }
        if (await fileExists(filePath) && (await fs.stat(filePath)).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
          res.end(await fs.readFile(filePath));
          return;
        }
        const fallback = path.join(rootDir, 'index.html');
        res.setHeader('Content-Type', MIME['.html']);
        res.end(await fs.readFile(fallback));
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err?.message || err));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr) {
        resolve({ server, port: addr.port });
      } else {
        reject(new Error('Failed to determine local port'));
      }
    });
  });
}

async function renderRoute(browser, baseUrl, route) {
  const page = await browser.newPage();
  let html = null;
  let status = null;
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; EyDostPrerender/1.0; +https://eydost.com)'
    );
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

    page.on('pageerror', (err) => logWarn(`page error on ${route}:`, err?.message || err));
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
        logWarn(`request failed on ${route}: ${url}`);
      }
    });

    const target = `${baseUrl}${route === '/' ? '/' : route}`;
    const response = await page.goto(target, {
      waitUntil: 'networkidle0',
      timeout: PRERENDER_TIMEOUT_MS,
    });
    status = response?.status() ?? null;

    await page.evaluate(
      (eventName, timeoutMs) =>
        new Promise((resolve) => {
          if (window.__APP_RENDERED__) return resolve();
          const t = setTimeout(resolve, timeoutMs);
          document.addEventListener(
            eventName,
            () => { clearTimeout(t); resolve(); },
            { once: true }
          );
        }),
      RENDER_EVENT,
      PRERENDER_TIMEOUT_MS
    );

    await new Promise((r) => setTimeout(r, 150));

    html = await page.content();
  } finally {
    await page.close().catch(() => {});
  }
  return { html, status };
}

function routeToOutFile(route) {
  if (route === '/' || route === '') return path.join(distDir, 'index.html');
  const safe = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return path.join(distDir, safe, 'index.html');
}

async function writeRouteHtml(route, html) {
  const out = routeToOutFile(route);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, html, 'utf8');
}

function looksRendered(html) {
  if (!html) return false;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return false;
  const body = bodyMatch[1];
  const text = body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 200;
}

async function runWithConcurrency(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = await worker(items[i], i);
      } catch (err) {
        results[i] = { ok: false, error: err };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  if (!(await fileExists(distDir))) {
    throw new Error(`dist/ not found at ${distDir} — run vite build first.`);
  }
  if (!(await fileExists(sitemapPath))) {
    throw new Error(`sitemap.xml not found at ${sitemapPath} — run npm run sitemap.`);
  }

  const allRoutes = await readSitemapRoutes();
  const routes = allRoutes.filter((r) => !shouldSkip(r));
  if (routes.length === 0) {
    logWarn('No routes to prerender — exiting.');
    return;
  }

  logInfo(`Routes to prerender: ${routes.length} (${allRoutes.length - routes.length} skipped).`);

  const { server, port } = await startStaticServer(distDir);
  const baseUrl = `http://127.0.0.1:${port}`;
  logInfo(`Static server listening on ${baseUrl}`);

  let browser;
  let okCount = 0;
  let failCount = 0;
  let warnCount = 0;
  const failures = [];

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const start = Date.now();
    await runWithConcurrency(routes, CONCURRENCY, async (route) => {
      const t0 = Date.now();
      try {
        const { html, status } = await renderRoute(browser, baseUrl, route);
        if (!html) {
          failCount++;
          failures.push({ route, reason: 'empty html' });
          logErr(`✗ ${route} — empty html (status ${status})`);
          return { ok: false };
        }
        if (!looksRendered(html)) {
          warnCount++;
          logWarn(`⚠ ${route} — body looks empty (status ${status}); skipping write so SPA fallback is used.`);
          return { ok: false };
        }
        await writeRouteHtml(route, html);
        okCount++;
        const ms = Date.now() - t0;
        logInfo(`✓ ${route} (${ms}ms, status ${status})`);
        return { ok: true };
      } catch (err) {
        failCount++;
        failures.push({ route, reason: err?.message || String(err) });
        logErr(`✗ ${route} — ${err?.message || err}`);
        return { ok: false };
      }
    });

    const totalMs = Date.now() - start;
    logInfo('—'.repeat(50));
    logInfo(`Done in ${(totalMs / 1000).toFixed(1)}s — ok: ${okCount}, warn: ${warnCount}, fail: ${failCount}`);
    if (failures.length) {
      logInfo(`Failures (build still succeeds — SPA fallback covers them):`);
      for (const f of failures) logInfo(`  - ${f.route}: ${f.reason}`);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
  }
}

main().catch((err) => {
  logErr('Fatal:', err);
  // Important: do NOT fail the whole Vercel build if prerender hits a snag.
  // The SPA fallback is still served; only SEO is degraded for that build.
  process.exitCode = 0;
});
