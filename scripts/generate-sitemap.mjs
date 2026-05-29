import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SITE_URL = (process.env.SITE_URL || 'https://eydost.com').trim().replace(/\/+$/, '');
const TODAY = new Date().toISOString().split('T')[0];

/** Keep in sync with src/data/blogPublishDates.ts */
const BLOG_PUBLISH_DATES = {
  'what-is-esim-complete-guide': '2026-04-24',
  'how-to-install-esim-iphone': '2026-04-27',
  'how-to-install-esim-android': '2026-04-30',
  'what-is-a-global-esim-data-plan': '2026-05-02',
  'esim-vs-roaming-cost-comparison': '2026-05-05',
  'best-europe-esim-2026': '2026-05-07',
  'stay-connected-europe-without-roaming': '2026-05-10',
  'best-esim-germany-2026': '2026-05-12',
  'how-to-use-esim-france': '2026-05-15',
  'best-esim-turkey-2026': '2026-05-17',
  'best-esim-uae-dubai-2026': '2026-05-20',
  'book-taxi-europe-whatsapp': '2026-05-22',
  'airport-transfer-europe-guide': '2026-05-25',
  'paris-cdg-airport-transfer-guide': '2026-05-27',
  'london-heathrow-airport-taxi-whatsapp': '2026-05-28',
};

function getLastmod(pathname) {
  const postMatch = pathname.match(/^\/(?:en|az|ru|tr|ar|es|zh)\/blog\/([^/]+)$/);
  if (postMatch && BLOG_PUBLISH_DATES[postMatch[1]]) {
    return BLOG_PUBLISH_DATES[postMatch[1]];
  }
  if (/^\/(en|az|ru|tr|ar|es|zh)\/blog$/.test(pathname)) {
    return BLOG_PUBLISH_DATES['london-heathrow-airport-taxi-whatsapp'] ?? TODAY;
  }
  return TODAY;
}

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
  if (/^\/(en|az|ru|tr|ar|es|zh)\/blog$/.test(p)) return { priority: '0.8', changefreq: 'weekly' };
  if (p === '/about') return { priority: '0.7', changefreq: 'monthly' };
  if (/^\/(en|az|ru|tr|ar|es|zh)\/blog\//.test(p)) return { priority: '0.7', changefreq: 'monthly' };
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
    'london-heathrow-airport-taxi-whatsapp',
    'paris-cdg-airport-transfer-guide',
    'best-esim-uae-dubai-2026',
    'best-esim-turkey-2026',
    'what-is-a-global-esim-data-plan',
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

  const blogLocales = ['en', 'az', 'ru', 'tr', 'ar', 'es', 'zh'];
  const localizedBlogPaths = blogLocales.flatMap((loc) => [
    `/${loc}/blog`,
    ...blogSlugs.map((s) => `/${loc}/blog/${s}`),
  ]);

  const staticPaths = [
    '/', '/esim', '/taxi', '/about',
    '/privacy', '/terms', '/refund',
    ...localizedBlogPaths,
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
      `    <lastmod>${getLastmod(p)}</lastmod>`,
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
