"""
eSIM Access Backend - Main FastAPI Application Entry Point
============================================================
Run with:  uvicorn main:app --reload --port 8000
"""

import os
import logging
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env file at startup
load_dotenv()

from esim_access.api import router as esim_router
from esim_access.webhooks import router as webhook_router
from esim_access.whatsapp import router as whatsapp_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="Eydost eSIM API",
    description="Backend API for eSIM purchasing, management, and webhook handling via eSIM Access.",
    version="1.0.0",
)

@app.get("/api/test-whatsapp")
async def test_whatsapp_connection(x_api_key: str | None = Header(None)):
    """
    Diagnostic endpoint to test WhatsApp API credentials.
    """
    from esim_access.whatsapp import send_whatsapp_message, get_whatsapp_config
    expected_key = os.environ.get("APP_API_KEY", "").strip()
    if not expected_key or x_api_key != expected_key:
        raise HTTPException(status_code=404, detail="Not found")

    config = get_whatsapp_config()
    test_recipient = os.environ.get("WHATSAPP_TEST_RECIPIENT", "").strip()
    if not test_recipient:
        raise HTTPException(status_code=400, detail="WHATSAPP_TEST_RECIPIENT is not configured")

    success = send_whatsapp_message(test_recipient, "EyDost Bot Diagnostic: WhatsApp API baglantisi ugurludur! ✅")
    return {
        "success": success,
        "phone_number_id_used": config["phone_number_id"],
        "note": "If success is false, check WHATSAPP_ACCESS_TOKEN in .env"
    }


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
app.include_router(whatsapp_router, prefix="", tags=["WhatsApp"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "eydost-esim-backend"}
