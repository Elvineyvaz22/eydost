"""
eSIM Access - FastAPI Router
=============================
Exposes the eSIMService as REST endpoints for your web application.
Mount this router in your main FastAPI app:

    from esim_access.api import router as esim_router
    app.include_router(esim_router, prefix="/api/esim", tags=["eSIM"])

Sensitive endpoints require the application-level API key (X-API-Key header)
when APP_API_KEY is configured. This is separate from the eSIM Access provider key.
"""

import os
import time
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .service import ESIMService
from .client import (
    ESIMAccessError,
    ESIMAuthError,
    ESIMOrderPendingError,
    ESIMTimeoutError,
)

logger = logging.getLogger("esim_access.api")
router = APIRouter()


def require_api_key(x_api_key: Optional[str] = Header(None)) -> None:
    expected_key = os.environ.get("APP_API_KEY", "").strip()
    if not expected_key:
        logger.error("APP_API_KEY is not set; refusing sensitive eSIM request.")
        raise HTTPException(status_code=503, detail="API key protection is not configured.")
    if x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")

# ── Dependency: shared service instance ──────────────────────────────────────
_service_instance: Optional[ESIMService] = None

def get_service() -> ESIMService:
    """Returns a shared ESIMService singleton."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ESIMService()
    return _service_instance


# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class OrderRequest(BaseModel):
    package_code: Optional[str] = Field(None, description="Package code (e.g. JC016)")
    slug: Optional[str] = Field(None, description="Package slug (e.g. AU_1_7)")
    count: int = Field(1, ge=1, le=30, description="Number of eSIM profiles to order")
    price: Optional[int] = Field(None, description="Price per unit in smallest currency unit")
    period_num: Optional[int] = Field(None, description="Days for day-pass plans")
    transaction_id: Optional[str] = Field(None, description="Unique idempotency key")


class TopUpRequest(BaseModel):
    iccid: str = Field(..., description="ICCID of the eSIM to top up")
    package_code: Optional[str] = Field(None)
    slug: Optional[str] = Field(None)
    transaction_id: Optional[str] = Field(None)


class ESIMActionRequest(BaseModel):
    esim_tran_no: str = Field(..., description="eSIM transaction number")


# ── Error Handler Helper ──────────────────────────────────────────────────────
def _handle_esim_error(exc: ESIMAccessError) -> HTTPException:
    if isinstance(exc, ESIMAuthError):
        return HTTPException(status_code=401, detail="eSIM Access authentication failed.")
    if isinstance(exc, ESIMOrderPendingError):
        return HTTPException(status_code=202, detail={
            "message": "eSIM profiles are being allocated. Please retry in a few seconds.",
            "error_code": exc.error_code,
        })
    if isinstance(exc, ESIMTimeoutError):
        return HTTPException(status_code=504, detail="Upstream eSIM Access API timed out.")
    return HTTPException(
        status_code=502,
        detail={
            "message": str(exc),
            "error_code": exc.error_code,
        }
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/packages", summary="List available eSIM packages")
async def list_packages(
    location_code: Optional[str] = Query(None, description="ISO Alpha-2 country code, e.g. TR"),
    package_type: str = Query("BASE", description="BASE or TOPUP"),
    svc: ESIMService = Depends(get_service),
):
    """
    Returns all available eSIM data packages.
    Filter by country code to show packages for a specific destination.
    """
    try:
        packages = svc.list_packages(location_code=location_code, package_type=package_type)
        return {"success": True, "count": len(packages), "packages": packages}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.get("/countries", summary="Get optimized country list with cheapest prices")
async def get_countries(
    refresh: bool = Query(False, description="Force refresh cache"),
    svc: ESIMService = Depends(get_service),
):
    """
    Returns a summarized list of countries and regional packages.
    Extremely fast because it's cached on the backend.
    """
    try:
        result = svc.get_country_groups(force_refresh=refresh)
        return {"success": True, **result}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.get("/packages/topup", summary="List available top-up packages for an eSIM")
async def list_topup_packages(
    package_code: Optional[str] = Query(None),
    slug: Optional[str] = Query(None),
    iccid: Optional[str] = Query(None),
    svc: ESIMService = Depends(get_service),
):
    """Returns top-up plans available for an existing eSIM."""
    try:
        packages = svc.list_topup_packages(package_code=package_code, slug=slug, iccid=iccid)
        return {"success": True, "count": len(packages), "packages": packages}
    except (ESIMAccessError, ValueError) as exc:
        if isinstance(exc, ValueError):
            raise HTTPException(status_code=400, detail=str(exc))
        raise _handle_esim_error(exc)


@router.post("/order", summary="Place a new eSIM order")
async def order_esim(
    body: OrderRequest,
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """
    Order one or more eSIM profiles.

    Returns an orderNo which you must use to retrieve the eSIM QR codes.
    Profiles are allocated asynchronously — use GET /esim/{order_no} to retrieve them.
    """
    try:
        result = svc.order_esim(
            package_code=body.package_code,
            slug=body.slug,
            count=body.count,
            price=body.price,
            period_num=body.period_num,
            transaction_id=body.transaction_id,
        )
        return {"success": True, **result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.get("/esim/{order_no}", summary="Get eSIM profiles by order number")
async def get_esim(
    order_no: str,
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """
    Retrieve eSIM profiles (including QR code URLs) for a given order number.
    Returns 202 if SM-DP+ is still allocating profiles (retry after a few seconds).
    """
    try:
        esim_list = svc.get_esim_by_order(order_no)
        return {"success": True, "count": len(esim_list), "esims": esim_list}
    except ESIMOrderPendingError as exc:
        return JSONResponse(status_code=202, content={
            "success": False,
            "message": "eSIM profiles are still being prepared. Please retry in a few seconds.",
            "error_code": exc.error_code,
        })
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.get("/esim/status", summary="Query detailed status of an eSIM")
async def get_esim_status(
    esim_tran_no: Optional[str] = Query(None, description="Recommended: unique eSIM transaction number"),
    order_no: Optional[str] = Query(None),
    iccid: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None, description="ISO 8601 UTC e.g. 2024-01-01T00:00+00:00"),
    end_time: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    page_num: int = Query(1, ge=1),
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """
    Query the status of existing eSIM profiles including usage data.
    Data usage is updated within 2-3 hours of actual use.
    """
    try:
        result = svc.get_esim_status(
            esim_tran_no=esim_tran_no,
            order_no=order_no,
            iccid=iccid,
            start_time=start_time,
            end_time=end_time,
            page_size=page_size,
            page_num=page_num,
        )
        return {"success": True, **result}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.get("/balance", summary="Query account balance")
async def get_balance(
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """Returns your current eSIM Access reseller account balance."""
    try:
        result = svc.get_balance()
        return {"success": True, **result}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.post("/esim/topup", summary="Top up an existing eSIM")
async def topup_esim(
    body: TopUpRequest,
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """Add more data to an existing active eSIM profile."""
    try:
        result = svc.topup_esim(
            iccid=body.iccid,
            package_code=body.package_code,
            slug=body.slug,
            transaction_id=body.transaction_id,
        )
        return {"success": True, **result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.post("/esim/cancel", summary="Cancel an eSIM profile")
async def cancel_esim(
    body: ESIMActionRequest,
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """Cancel an eSIM and request a refund to your balance."""
    try:
        result = svc.cancel_esim(esim_tran_no=body.esim_tran_no)
        return {"success": True, **result}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.post("/esim/suspend", summary="Suspend an eSIM profile")
async def suspend_esim(
    body: ESIMActionRequest,
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """Suspend an active eSIM profile."""
    try:
        result = svc.suspend_esim(esim_tran_no=body.esim_tran_no)
        return {"success": True, **result}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)


@router.post("/esim/unsuspend", summary="Unsuspend an eSIM profile")
async def unsuspend_esim(
    body: ESIMActionRequest,
    _: None = Depends(require_api_key),
    svc: ESIMService = Depends(get_service),
):
    """Reactivate a suspended eSIM profile."""
    try:
        result = svc.unsuspend_esim(esim_tran_no=body.esim_tran_no)
        return {"success": True, **result}
    except ESIMAccessError as exc:
        raise _handle_esim_error(exc)
