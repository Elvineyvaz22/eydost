# Ey Dost — Global Travel Companion

Azerbaijani travel companion platform offering **eSIM data packages** (150+ countries) and **worldwide taxi booking** — all via WhatsApp.

**Live:** [eydost.az](https://eydost.az)

## Architecture

| Layer | Stack | Directory |
|-------|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, TailwindCSS | `/` (root) |
| Backend | Python, FastAPI, Uvicorn | `/backend` |
| Database | Supabase (hosted PostgreSQL + Auth) | — |
| Deployment | Vercel (SPA + serverless) | `vercel.json` |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm

### Frontend

```bash
cp .env.example .env   # Fill in your Supabase credentials
npm install
npm run dev            # → http://localhost:5173
```

### Backend

```bash
cd backend
cp .env.example .env   # Fill in API keys
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (generates sitemap) |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm run preview` | Preview production build locally |

## Environment Variables

See [`.env.example`](.env.example) for frontend and [`backend/.env.example`](backend/.env.example) for backend.

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages (Taxi, AllPackages, CountryEsim, etc.)
│   ├── contexts/       # React contexts (Language, Admin, Packages)
│   ├── services/       # API service layer
│   ├── translations/   # i18n (EN, AZ, RU)
│   ├── data/           # Static eSIM package data
│   └── utils/          # Analytics, helpers
├── backend/
│   └── main.py         # FastAPI entry point
├── public/
│   └── telegram-mini-app/  # Telegram Mini App (static HTML)
└── api/
    └── taxi-webhook.ts # Vercel serverless function
```

## Admin Panel

Access at `/admin` — uses Supabase Auth. See [ADMIN_README.md](ADMIN_README.md) for details.