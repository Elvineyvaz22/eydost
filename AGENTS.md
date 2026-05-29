# Ey Dost - Development Guide

Azerbaijani travel companion platform (eydost.az) with two main services:
- **eSIM Sales** — Global eSIM data packages for 150+ countries (via bot.eydost.az)
- **Taxi Booking** — 50+ ölkədə, 500+ şəhərdə aktiv taksi sifarişi (Google Maps əsaslı)

Architecture: React/Vite frontend (root) + Python FastAPI backend (`/backend`).

## Cursor Cloud specific instructions

### Services

| Service | Command | Port |
|---------|---------|------|
| Frontend (Vite) | `npm run dev` (from repo root) | 5173 |
| Backend (FastAPI) | `uvicorn main:app --reload --port 8000` (from `backend/`) | 8000 |

### Running lint/typecheck/build

- **Lint:** `npm run lint` — pre-existing warnings/errors
- **Typecheck:** `npm run typecheck` — has pre-existing TS errors; do NOT treat these as regressions unless your changes introduced them
- **Build:** `npm run build` — runs sitemap generation then Vite production build

### Backend setup

- Copy `backend/.env.example` to `backend/.env` for local dev
- Supabase URL/key are hardcoded as fallbacks in the frontend code; no local Supabase setup needed

### Key gotchas

- **Vercel / taxi webhook:** `vercel.json` must keep `builds` + `routes` so `api/taxi-webhook.ts` deploys. Never add `experimentalServices` (breaks `/api/*` → 405 on POST). After any `vercel.json` change, smoke-test: `POST https://eydost.com/api/taxi-webhook` should return **200** (not `index.html` / 405). Vercel dashboard Framework Preset: **Vite** or **Other**, not **Services**.
- No automated test suite exists (no jest/vitest/pytest configured)
- The `package-lock.json` is present — always use `npm` (not pnpm/yarn)
- Frontend uses React Router with hash-free client-side routing; SPA fallback is handled by Vite in dev
- Admin panel at `/admin` uses Supabase Auth (credentials in `ADMIN_README.md`)
- Google Maps API key (`VITE_GOOGLE_MAPS_API_KEY`) is required for `/taxi` and `/taxi-order` (set in Vercel env + local `.env` for build)
- **Vercel Web Analytics:** `@vercel/analytics` via `VercelAnalytics.tsx` (loads only when cookie consent is `all`). Enable in Vercel dashboard → Project → **Analytics** → Web Analytics → Enable, then deploy.
- **Vercel Speed Insights:** `index.html` loads `/_vercel/speed-insights/script.js`; `VercelSpeedInsights.tsx` sets `data-route` on SPA navigation. Vitals POST on tab blur/pagehide — browse 2+ pages then leave the site. **Vercel dashboard → Project → Speed Insights → Enable**, then **redeploy**. Requires Pro or Speed Insights add-on (~$10/mo). Not cookie-gated.
- **Blog content:** Strategy in `docs/blog-content-strategy-az.md`; template `docs/blog-post-template.md`. Posts: 2–3 images (featured + optional `section.image`), 7 languages via `blogPosts.ts` + `blogLocales/`.