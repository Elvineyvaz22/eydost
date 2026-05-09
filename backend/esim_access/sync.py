"""
eSIM Package Sync — Admin Endpoint
====================================
Fetches all packages from eSIM Access API and saves to Supabase site_content.
Uses httpx REST API directly to support both old JWT and new sb_secret_ key formats.
"""

import os
import json
import logging
import asyncio
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

logger = logging.getLogger("esim_access.sync")
router = APIRouter()

CACHE_KEY = "esim_packages_cache"


def require_admin_key(x_api_key: Optional[str] = Header(None)) -> None:
    expected = os.environ.get("APP_API_KEY", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="APP_API_KEY not configured")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _supabase_headers(key: str) -> dict:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _get_supabase_config():
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    # Use SUPABASE_SYNC_KEY (supports new sb_secret_ format via httpx REST)
    # Falls back to SUPABASE_SERVICE_KEY for backwards compatibility
    key = os.environ.get("SUPABASE_SYNC_KEY") or os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=503, detail="SUPABASE_URL or SUPABASE_SYNC_KEY not configured")
    return url, key


@router.post("/api/esim/admin/sync", summary="Sync all eSIM packages to Supabase")
async def sync_packages(_: None = Depends(require_admin_key)):
    """
    Fetches all BASE packages from eSIM Access API and saves to Supabase.
    Call from admin panel to refresh the public package catalog.
    """
    from .service import ESIMService
    from .client import ESIMAccessError

    supabase_url, supabase_key = _get_supabase_config()

    try:
        loop = asyncio.get_event_loop()
        svc = ESIMService()
        raw_packages = await loop.run_in_executor(
            None, lambda: svc.list_packages(package_type="BASE")
        )
        logger.info(f"Fetched {len(raw_packages)} packages from eSIM Access API")
    except ESIMAccessError as e:
        raise HTTPException(status_code=502, detail=f"eSIM API error: {str(e)}")

    # Keep only essential fields to stay under Supabase 1MB REST limit
    KEEP = {"packageCode", "slug", "name", "price", "sellingPrice", "currencyCode",
            "volume", "duration", "durationUnit", "location", "speed",
            "favorite", "activeType", "supportTopUpType", "smsStatus", "dataType"}

    packages = [{k: v for k, v in p.items() if k in KEEP} for p in raw_packages]

    synced_at = datetime.now(timezone.utc).isoformat()
    cache_value = {"packages": packages, "synced_at": synced_at, "count": len(packages)}

    upsert_headers = {
        **_supabase_headers(supabase_key),
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    rest_url = f"{supabase_url}/rest/v1/site_content"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{rest_url}?on_conflict=key",
                headers=upsert_headers,
                json={"key": CACHE_KEY, "value": cache_value},
            )
            if r.status_code not in (200, 201, 204):
                raise HTTPException(status_code=500, detail=f"Supabase upsert failed: {r.text[:300]}")
            logger.info(f"Upserted esim_packages_cache into Supabase ({len(packages)} packages)")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Supabase save error: {e}")
        raise HTTPException(status_code=500, detail=f"Supabase save failed: {str(e)}")

    return {
        "success": True,
        "count": len(packages),
        "synced_at": synced_at,
        "message": f"{len(packages)} packages saved to Supabase",
    }


@router.get("/api/esim/admin/sync-status", summary="Get last sync status")
async def sync_status(_: None = Depends(require_admin_key)):
    """Returns when packages were last synced to Supabase."""
    try:
        supabase_url, supabase_key = _get_supabase_config()
    except HTTPException:
        return {"synced": False, "message": "Supabase not configured"}

    headers = _supabase_headers(supabase_key)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{supabase_url}/rest/v1/site_content?key=eq.{CACHE_KEY}&select=value",
                headers=headers,
            )
            data = r.json()
            if isinstance(data, list) and data:
                val = data[0].get("value", {})
                return {"synced": True, "count": val.get("count", 0), "synced_at": val.get("synced_at")}
            return {"synced": False, "message": "Never synced"}
    except Exception as e:
        return {"synced": False, "message": str(e)}
