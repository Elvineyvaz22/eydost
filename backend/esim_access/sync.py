"""
eSIM Package Sync — Admin Endpoint
====================================
Fetches all packages from eSIM Access API and saves to Supabase site_content.
Public site reads from Supabase — no live API calls needed in production.

Supabase key used: 'esim_packages_cache'
Value format: { packages: [...], synced_at: "ISO timestamp", count: N }
"""

import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

logger = logging.getLogger("esim_access.sync")
router = APIRouter()


def require_admin_key(x_api_key: Optional[str] = Header(None)) -> None:
    expected = os.environ.get("APP_API_KEY", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="APP_API_KEY not configured")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/api/esim/admin/sync", summary="Sync all eSIM packages to Supabase")
async def sync_packages(_: None = Depends(require_admin_key)):
    """
    Fetches all BASE packages from eSIM Access API and saves to Supabase.
    Call this from the admin panel to refresh the public package catalog.
    """
    from .service import ESIMService
    from .client import ESIMAccessError

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=503, detail="Supabase credentials not configured")

    try:
        svc = ESIMService()
        packages = svc.list_packages(package_type="BASE")
        logger.info(f"Fetched {len(packages)} packages from eSIM Access API")
    except ESIMAccessError as e:
        raise HTTPException(status_code=502, detail=f"eSIM API error: {str(e)}")

    synced_at = datetime.now(timezone.utc).isoformat()
    cache_value = {
        "packages": packages,
        "synced_at": synced_at,
        "count": len(packages),
    }

    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)

        # Upsert into site_content
        existing = client.table("site_content").select("id").eq("key", "esim_packages_cache").execute()

        if existing.data:
            client.table("site_content").update({"value": cache_value}).eq("key", "esim_packages_cache").execute()
            logger.info("Updated existing esim_packages_cache in Supabase")
        else:
            client.table("site_content").insert({"key": "esim_packages_cache", "value": cache_value}).execute()
            logger.info("Inserted new esim_packages_cache in Supabase")

    except Exception as e:
        logger.error(f"Supabase save error: {e}")
        raise HTTPException(status_code=500, detail=f"Supabase save failed: {str(e)}")

    return {
        "success": True,
        "count": len(packages),
        "synced_at": synced_at,
        "message": f"{len(packages)} packages saved to Supabase"
    }


@router.get("/api/esim/admin/sync-status", summary="Get last sync status")
async def sync_status(_: None = Depends(require_admin_key)):
    """Returns when packages were last synced to Supabase."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        return {"synced": False, "message": "Supabase not configured"}

    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        result = client.table("site_content").select("value").eq("key", "esim_packages_cache").execute()

        if result.data:
            val = result.data[0]["value"]
            return {
                "synced": True,
                "count": val.get("count", 0),
                "synced_at": val.get("synced_at"),
            }
        return {"synced": False, "message": "Never synced"}
    except Exception as e:
        return {"synced": False, "message": str(e)}
