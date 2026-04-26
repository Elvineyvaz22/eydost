"""
eSIM Access Backend - Main FastAPI Application Entry Point
============================================================
Run with:  uvicorn main:app --reload --port 8000
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env file at startup
load_dotenv()

from esim_access.api import router as esim_router
from esim_access.webhooks import router as webhook_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="Eydost eSIM API",
    description="Backend API for eSIM purchasing, management, and webhook handling via eSIM Access.",
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

# ── Mount Routers ─────────────────────────────────────────────────────────────
app.include_router(esim_router, prefix="/api/esim", tags=["eSIM"])
app.include_router(webhook_router, prefix="", tags=["Webhooks"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "eydost-esim-backend"}
