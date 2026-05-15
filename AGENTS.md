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

- No automated test suite exists (no jest/vitest/pytest configured)
- The `package-lock.json` is present — always use `npm` (not pnpm/yarn)
- Frontend uses React Router with hash-free client-side routing; SPA fallback is handled by Vite in dev
- Admin panel at `/admin` uses Supabase Auth (credentials in `ADMIN_README.md`)
- Google Maps API key (`VITE_GOOGLE_MAPS_API_KEY`) is needed only for the Taxi page; the rest of the site works without it