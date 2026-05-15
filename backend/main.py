"""
EyDost Backend - Main FastAPI Application Entry Point
=========================================================
Run with:  uvicorn main:app --reload --port 8000
"""

import os
import logging
import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load .env file at startup
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="Eydost API",
    description="Backend API for eSIM purchasing, management, and webhook handling.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Bot API proxy ──────────────────────────────────────────────────────────────
@app.get("/api/packages", tags=["Packages"])
async def get_packages(country_code: str | None = Query(None)):
    """
    Proxy to bot.eydost.az — bypasses CORS.
    GET /api/packages              → all packages
    GET /api/packages?country_code=TR → packages for Turkey
    """
    api_key = os.environ.get("BOT_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="BOT_API_KEY not configured")

    params = {}
    if country_code:
        params["country_code"] = country_code.upper()

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            os.environ.get("BOT_API_URL", "https://bot.eydost.az/api/public/packages"),
            params=params,
            headers={"x-api-key": api_key},
        )

    if not resp.ok:
        raise HTTPException(status_code=resp.status_code, detail="Bot API error")

    return resp.json()


# ── Supabase package sync ─────────────────────────────────────────────────────
@app.post("/api/sync/packages", tags=["Sync"])
async def sync_packages():
    """
    Sync all packages from bot.eydost.az to Supabase.
    Run this daily (e.g. via cron or Vercel cron).
    """
    import subprocess, sys

    result = subprocess.run(
        [sys.executable, os.path.join(os.path.dirname(__file__), "sync_packages.py")],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(__file__),
        env={**os.environ},
    )

    if result.returncode != 0:
        logger.error(f"Sync failed: {result.stderr}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {result.stderr}")

    logger.info(f"Sync output: {result.stdout}")
    return {"status": "synced", "output": result.stdout}


@app.get("/api/sync/status", tags=["Sync"])
async def sync_status():
    """
    Check last sync status from Supabase.
    """
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    from supabase import create_client
    client = create_client(supabase_url, supabase_key)

    result = client.table("esim_packages").select(
        "last_synced_at, country_code"
    ).order("last_synced_at", desc=True).limit(10).execute()

    return {"packages": result.data or []}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "eydost-backend"}
