/**
 * Cross-platform fail-safe runner for prerender.mjs.
 *
 * Why: on Vercel the build environment may fail to launch Chromium (sandbox,
 * missing libs, network-blocked download, etc.). If so, we still want the
 * `vite build` artifacts to deploy — only the SEO HTML snapshots are missing,
 * and the SPA fallback covers the rest.
 *
 * This wrapper runs prerender as a child process and ALWAYS exits 0, so the
 * `&&` chain in `npm run build` never breaks the deploy.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, 'prerender.mjs');

const proc = spawn(process.execPath, [target], {
  stdio: 'inherit',
  env: process.env,
});

proc.on('exit', (code, signal) => {
  if (code === 0) {
    console.log('[prerender-runner] prerender completed successfully.');
  } else {
    console.warn(
      `[prerender-runner] prerender exited with code=${code} signal=${signal} — ` +
        `build will continue without prerendered HTML snapshots. ` +
        `SPA fallback covers all routes; only the SEO benefit is lost for this deploy.`
    );
  }
  process.exit(0);
});

proc.on('error', (err) => {
  console.warn('[prerender-runner] failed to spawn prerender:', err?.message || err);
  process.exit(0);
});
