import os
import logging
import requests
from typing import Dict, Any

from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import PlainTextResponse

logger = logging.getLogger("esim_access.whatsapp")
router = APIRouter()

# Meta App settings
WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "eydost_test_token_123")
WHATSAPP_ACCESS_TOKEN = os.environ.get(
    "WHATSAPP_ACCESS_TOKEN",
    "EAALumLFPZAF0BRWO3bVYB7qwpLvxawHIeyLQBZBDrCJetIjZCP5XqDZCOQ1zV8NE08jVCAWZCsvw23kjLsSZAL6yasvRPlo4tnlMZAaTPtB8ihLsX4dsnSMZCzAxPqYsbHWa041bvZBdZBDdEvpy7O7edyMbCzdsyZCu3ALqPUgMI5n9dR6cRwREpVMZCjBPF6Oi9O642Nq9DlB4ZAew8DGNLewMAx2N544g71ior9TGCrUuE7sJuHgmndaJVBIokljdZB9RAfWZACMl9uaCUnivQgnIoZAYp3xB"
)
PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "1114045218452108")
API_VERSION = "v17.0"

@router.get("/webhooks/whatsapp", summary="Verify WhatsApp Webhook")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """
    Required by Meta to verify the webhook URL.
    Returns the hub.challenge string if the verify_token matches.
    """
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully.")
        return PlainTextResponse(content=hub_challenge)
    
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhooks/whatsapp", summary="Receive WhatsApp Messages")
async def receive_whatsapp_message(request: Request):
    """
    Receives incoming messages from WhatsApp users.
    Checks for the [TEST_ORDER] prefix and replies with a payment link.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Acknowledge receipt to avoid retries from Meta
    response_data = {"status": "ok"}

    if "object" in body and body["object"] == "whatsapp_business_account":
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Check if it's a message
                if "messages" in value:
                    for message in value["messages"]:
                        sender_wa_id = message.get("from")
                        msg_type = message.get("type")
                        
                        if msg_type == "text":
                            msg_body = message.get("text", {}).get("body", "")
                            logger.info(f"Received WA Message from {sender_wa_id}: {msg_body}")
                            
                            if "[TEST_ORDER]" in msg_body:
                                _handle_test_order(sender_wa_id, msg_body)
                                
    return response_data

def _handle_test_order(recipient_id: str, message_text: str):
    """
    Sends the payment link response back to the user via Graph API.
    """
    logger.info(f"Processing [TEST_ORDER] for {recipient_id}")
    
    url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Construct the payment link response
    reply_text = (
        "✅ Sifarişiniz test mühitində qəbul edildi!\n\n"
        "Ödənişi tamamlamaq üçün zəhmət olmasa aşağıdakı linkə keçid edin:\n"
        "🔗 https://eydost.az/payment/test\n\n"
        "Təşəkkür edirik!"
    )
    
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_id,
        "type": "text",
        "text": {
            "body": reply_text
        }
    }
    
    try:
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()
        logger.info(f"Successfully sent payment link to {recipient_id}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send WA message: {e}")
        if e.response is not None:
            logger.error(f"Response: {e.response.text}")
