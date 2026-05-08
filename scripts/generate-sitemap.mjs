import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SITE_URL = (process.env.SITE_URL || 'https://eydost.com').trim().replace(/\/+$/, '');
const TODAY = new Date().toISOString().split('T')[0];

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

// Priority and changefreq per path type
function getMeta(p) {
  if (p === '/') return { priority: '1.0', changefreq: 'weekly' };
  if (p === '/esim') return { priority: '0.9', changefreq: 'daily' };
  if (p === '/taxi') return { priority: '0.9', changefreq: 'weekly' };
  if (p === '/blog') return { priority: '0.8', changefreq: 'weekly' };
  if (p === '/about') return { priority: '0.7', changefreq: 'monthly' };
  if (p.startsWith('/blog/')) return { priority: '0.7', changefreq: 'monthly' };
  if (p === '/privacy' || p === '/terms' || p === '/refund') return { priority: '0.4', changefreq: 'yearly' };
  // eSIM country/regional slugs
  return { priority: '0.8', changefreq: 'weekly' };
}

async function loadSlugs() {
  const fs = await import('node:fs/promises');
  const srcPath = path.join(projectRoot, 'src', 'data', 'esimPackages.ts');
  const content = await fs.readFile(srcPath, 'utf8');
  const slugMatches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
  return Array.from(new Set(slugMatches));
}

async function main() {
  const slugs = await loadSlugs();

  // Blog post slugs — keep in sync with src/data/blogPosts.ts
  const blogSlugs = [
    'what-is-esim-complete-guide',
    'how-to-install-esim-iphone',
    'how-to-install-esim-android',
    'best-europe-esim-2026',
    'stay-connected-europe-without-roaming',
    'esim-vs-roaming-cost-comparison',
    'best-esim-germany-2026',
    'how-to-use-esim-france',
    'book-taxi-europe-whatsapp',
    'airport-transfer-europe-guide',
  ];

  const staticPaths = [
    '/', '/esim', '/taxi', '/about', '/blog',
    '/privacy', '/terms', '/refund',
    ...blogSlugs.map(s => `/blog/${s}`),
  ];
  const allPaths = new Set([...staticPaths, ...slugs.map(s => `/${s}`)]);

  const urls = Array.from(allPaths).sort((a, b) => {
    // Sort: home first, then main pages, then slugs
    const order = ['/', '/esim', '/taxi', '/about'];
    const ai = order.indexOf(a), bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const body = urls.map(p => {
    const { priority, changefreq } = getMeta(p);
    return [
      '  <url>',
      `    <loc>${xmlEscape(toAbsUrl(p))}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

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
