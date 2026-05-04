import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Build-time sitemap generator (static data source).
// Usage:
//   node scripts/generate-sitemap.mjs
//
// Config:
//   SITE_URL=https://eydost.az node scripts/generate-sitemap.mjs

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SITE_URL = (process.env.SITE_URL || 'https://eydost.az').trim().replace(/\/+$/, '');

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toAbsUrl(p) {
  const pathname = p.startsWith('/') ? p : `/${p}`;
  return `${SITE_URL}${pathname}`;
}

async function loadSlugs() {
  // Import TS module via Vite/TS? Not available in plain Node.
  // Instead, we rely on ESM + TS transpilation not being present at build-time,
  // so we keep this file as .mjs and import the compiled JS? Not available either.
  //
  // Solution: dynamic import of TS works in Node only with a loader; we avoid that.
  // We parse slugs from source by importing through Vite's TS transpilation is not possible here.
  //
  // Therefore, we keep the generator independent: it reads the source file as text and extracts `slug: '...'`.
  // This is robust for your current dataset layout.
  const fs = await import('node:fs/promises');
  const srcPath = path.join(projectRoot, 'src', 'data', 'esimPackages.ts');
  const content = await fs.readFile(srcPath, 'utf8');

  const slugMatches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
  return Array.from(new Set(slugMatches));
}

async function main() {
  const slugs = await loadSlugs();

  const paths = new Set([
    '/',
    '/esim',
    '/taxi',
    '/privacy',
  ]);

  for (const slug of slugs) paths.add(`/${slug}`);

  const urls = Array.from(paths)
    .map(p => ({ loc: toAbsUrl(p) }))
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const body = urls
    .map(u => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n  </url>`)
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`;

  const publicDir = path.join(projectRoot, 'public');
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`[sitemap] wrote ${urls.length} urls to public/sitemap.xml (SITE_URL=${SITE_URL})`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[sitemap] failed:', err);
  process.exitCode = 1;
});

