/**
 * Remove stale prerender output under dist/en/blog (wrong asset hashes → white screen).
 * Run after vite build, before prerender.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '..', 'dist', 'en', 'blog');

try {
  await fs.rm(blogDir, { recursive: true, force: true });
  console.log('[clean-locale-blog] removed dist/en/blog if present');
} catch (err) {
  console.warn('[clean-locale-blog] skip:', err?.message || err);
}
