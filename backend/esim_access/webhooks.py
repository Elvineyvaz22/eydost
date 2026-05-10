"""
eSIM Access - Webhook Handler
================================
Processes incoming webhook notifications from eSIM Access.
Mount this router at: POST /webhooks/esim

Supported webhook types:
  - ORDER_STATUS   : eSIM profiles ready for retrieval
  - LOW_BALANCE    : Balance at 25% or 10%
  - SMDP_EVENT     : SM-DP+ server lifecycle events
"""

import logging
import hmac
import hashlib
import os
from typing import Optional, Any

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("esim_access.webhook")
router = APIRouter()

# Optional: verify webhook signatures if eSIM Access provides a secret
WEBHOOK_SECRET = os.environ.get("ESIM_WEBHOOK_SECRET", "")


class WebhookPayload(BaseModel):
    notifyType: str
    orderNo: Optional[str] = None
    iccid: Optional[str] = None
    esimTranNo: Optional[str] = None
    data: Optional[Any] = None


@router.post("/webhooks/esim", summary="eSIM Access webhook receiver")
async def receive_webhook(request: Request):
    """
    Receives POST callbacks from eSIM Access.
    Dispatches to the appropriate handler based on notifyType.
    """
    raw_body = await request.body()

    # Optional signature verification
    if WEBHOOK_SECRET:
        sig_header = request.headers.get("X-Signature", "")
        expected_sig = hmac.HMAC(
            WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig_header, expected_sig):
            logger.warning("Webhook received with invalid signature!")
            raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        payload = WebhookPayload(**await request.json())
    except Exception as exc:
        logger.error(f"Failed to parse webhook payload: {exc}")
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    logger.info(f"Webhook received | notifyType={payload.notifyType} orderNo={payload.orderNo}")

    if payload.notifyType == "ORDER_STATUS":
        _handle_order_status(payload)
    elif payload.notifyType == "LOW_BALANCE":
        _handle_low_balance(payload)
    elif payload.notifyType == "SMDP_EVENT":
        _handle_smdp_event(payload)
    else:
        logger.warning(f"Unknown webhook type: {payload.notifyType}")

    # Always return 200 OK to acknowledge receipt
    return {"received": True}


def _handle_order_status(payload: WebhookPayload):
    """
    ORDER_STATUS: eSIM profiles are now allocated and ready for retrieval.
    In production, trigger get_esim_by_order() here and deliver QR codes to users.
    """
    logger.info(
        f"[ORDER_STATUS] Profiles ready for orderNo={payload.orderNo} "
        f"iccid={payload.iccid} esimTranNo={payload.esimTranNo}"
    )
    
    # Implementation Step:
    # 1. Fetch profiles using ESIMService
    from .api import get_service
    from .whatsapp import send_whatsapp_message
    
    svc = get_service()
    try:
        esim_list = svc.get_esim_by_order(payload.orderNo)
        if esim_list:
            # For simplicity, we assume we have a way to find the original recipient_id
            # (In a real app, you'd look this up in a database using orderNo)
            
            # TODO: Fetch recipient_id from database
            recipient_id = "USER_WA_ID" # Placeholder
            
            for esim in esim_list:
                qr_url = esim.get("qrCodeUrl")
                iccid = esim.get("iccid")
                msg = (
                    f"🎉 Sifarişiniz hazırdır!\n\n"
                    f"🆔 ICCID: {iccid}\n"
                    f"🔗 QR Kod: {qr_url}\n\n"
                    "QR kodu skan edərək eSIM-i aktivləşdirə bilərsiniz. "
                    "Hər hansı sualınız olarsa, bizə yazın!"
                )
                send_whatsapp_message(recipient_id, msg)
                logger.info(f"Sent eSIM QR to {recipient_id}: {iccid}")
                
    except Exception as e:
        logger.error(f"Failed to process order status for {payload.orderNo}: {e}")


def _handle_low_balance(payload: WebhookPayload):
    """
    LOW_BALANCE: Account balance is at 25% or 10% of threshold.
    In production, send an alert to your ops team.
    """
    logger.warning(f"[LOW_BALANCE] Account balance is low! data={payload.data}")
    # TODO: Send Slack/email alert to operations team


def _handle_smdp_event(payload: WebhookPayload):
    """
    SMDP_EVENT: SM-DP+ server lifecycle event for a profile.
    E.g. profile downloaded, enabled, disabled.
    """
    logger.info(f"[SMDP_EVENT] SM-DP+ event | iccid={payload.iccid} data={payload.data}")
    # TODO: Update eSIM status in your database


# ─── Taxi Booking Webhook ─────────────────────────────────────────────────────

import httpx
from pydantic import BaseModel
from typing import Optional

TAXI_WEBHOOK_URL = os.environ.get(
    "TAXI_WEBHOOK_URL",
    "https://bsqd.me/api/bot/388c046c-c54f-4b56-9107-24f4ffca0600/master/event/recieve_maps",
)
TAXI_WEBHOOK_TOKEN = os.environ.get("TAXI_WEBHOOK_TOKEN", "")


class LocationData(BaseModel):
    display_name: str
    formatted_address: str
    lat: float
    lng: float


class TaxiBookingPayload(BaseModel):
    bookingId: str
    pickup: LocationData
    destination: LocationData
    confirmed_at: str


@router.post("/webhooks/taxi", summary="Forward taxi booking to external API")
async def receive_taxi_webhook(payload: TaxiBookingPayload):
    """
    Receives a taxi booking from the frontend and forwards it
    to the bsqd.me external API.
    """
    logger.info(f"[TAXI_WEBHOOK] bookingId={payload.bookingId} pickup={payload.pickup.display_name} destination={payload.destination.display_name}")

    if not TAXI_WEBHOOK_TOKEN:
        logger.error("[TAXI_WEBHOOK] TAXI_WEBHOOK_TOKEN is not configured")
        raise HTTPException(status_code=500, detail="Taxi webhook is not configured")

    headers = {
        "Authorization": f"Bearer {TAXI_WEBHOOK_TOKEN}",
        "Content-Type": "application/json",
    }

    body = {
        "bookingId": payload.bookingId,
        "pickup": {
            "display_name": payload.pickup.display_name,
            "formatted_address": payload.pickup.formatted_address,
            "lat": payload.pickup.lat,
            "lng": payload.pickup.lng,
        },
        "destination": {
            "display_name": payload.destination.display_name,
            "formatted_address": payload.destination.formatted_address,
            "lat": payload.destination.lat,
            "lng": payload.destination.lng,
        },
        "confirmed_at": payload.confirmed_at,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(TAXI_WEBHOOK_URL, json=body, headers=headers)
            logger.info(f"[TAXI_WEBHOOK] forwarded to bsqd.me | status={response.status_code}")
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"[TAXI_WEBHOOK] HTTP error: {e.response.status_code} body={e.response.text}")
        raise HTTPException(status_code=502, detail="External taxi API error")
    except Exception as e:
        logger.error(f"[TAXI_WEBHOOK] Failed to forward: {e}")
        raise HTTPException(status_code=500, detail="Failed to forward taxi booking")

    return {"received": True, "bookingId": payload.bookingId}
