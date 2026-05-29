/**
 * Remove stale prerender output under dist/{locale}/blog (wrong asset hashes → white screen).
 * Run after vite build, before prerender.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES = ['en', 'az', 'ru', 'tr', 'ar', 'es', 'zh'];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

for (const loc of LOCALES) {
  const blogDir = path.join(distDir, loc, 'blog');
  try {
    await fs.rm(blogDir, { recursive: true, force: true });
    console.log(`[clean-locale-blog] removed dist/${loc}/blog if present`);
  } catch (err) {
    console.warn(`[clean-locale-blog] skip ${loc}:`, err?.message || err);
  }
}
