"""
eSIM Package Sync — Admin Endpoint
====================================
Fetches all packages from eSIM Access API and saves to Supabase site_content.
Uses httpx REST API directly to support both old JWT and new sb_secret_ key formats.
"""

import os
import json
import logging
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
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=503, detail="SUPABASE_URL or SUPABASE_SERVICE_KEY not configured")
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
        svc = ESIMService()
        packages = svc.list_packages(package_type="BASE")
        logger.info(f"Fetched {len(packages)} packages from eSIM Access API")
    except ESIMAccessError as e:
        raise HTTPException(status_code=502, detail=f"eSIM API error: {str(e)}")

    synced_at = datetime.now(timezone.utc).isoformat()
    cache_value = {"packages": packages, "synced_at": synced_at, "count": len(packages)}

    headers = _supabase_headers(supabase_key)
    rest_url = f"{supabase_url}/rest/v1/site_content"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Check if row exists
            r = await client.get(f"{rest_url}?key=eq.{CACHE_KEY}&select=id", headers=headers)
            existing = r.json()

            if existing and isinstance(existing, list) and len(existing) > 0:
                row_id = existing[0]["id"]
                up = await client.patch(
                    f"{rest_url}?id=eq.{row_id}",
                    headers=headers,
                    json={"value": cache_value},
                )
                if up.status_code not in (200, 204):
                    raise HTTPException(status_code=500, detail=f"Supabase update failed: {up.text[:300]}")
                logger.info(f"Updated esim_packages_cache in Supabase (id={row_id})")
            else:
                ins = await client.post(
                    rest_url,
                    headers=headers,
                    json={"key": CACHE_KEY, "value": cache_value},
                )
                if ins.status_code not in (200, 201):
                    raise HTTPException(status_code=500, detail=f"Supabase insert failed: {ins.text[:300]}")
                logger.info("Inserted esim_packages_cache into Supabase")

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
