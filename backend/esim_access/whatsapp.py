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
API_VERSION = "v25.0"

def get_whatsapp_config():
    """
    Helper to get the latest WhatsApp config from environment.
    """
    return {
        "access_token": os.environ.get("WHATSAPP_ACCESS_TOKEN", "").strip(),
        "phone_number_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "").strip(),
        "verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", "eydost_test_token_123").strip()
    }

def send_whatsapp_message(recipient_id: str, message_text: str):
    """
    Generic function to send a text message via WhatsApp Graph API.
    """
    config = get_whatsapp_config()
    access_token = config["access_token"]
    phone_number_id = config["phone_number_id"]

    if not access_token or not phone_number_id:
        logger.error(f"WhatsApp credentials missing: TOKEN={'Set' if access_token else 'MISSING'}, ID={'Set' if phone_number_id else 'MISSING'}")
        return False

    url = f"https://graph.facebook.com/{API_VERSION}/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_id,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text
        }
    }


    logger.info(f"Sending WA message to {recipient_id}...")
    
    try:
        res = requests.post(url, headers=headers, json=payload)
        if res.status_code != 200:
            logger.error(f"WhatsApp API Error ({res.status_code}): {res.text}")
            return False
            
        logger.info(f"Successfully sent message to {recipient_id}")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send WA message to {recipient_id}: {e}")
        return False

def send_whatsapp_template(recipient_id: str, template_name: str, language_code: str = "az", components: list = None):
    """
    Sends a WhatsApp template message.
    Defaults to Azerbaijani ('az') language.
    'components' can be used to pass parameters.
    """
    config = get_whatsapp_config()
    access_token = config["access_token"]
    phone_number_id = config["phone_number_id"]

    if not access_token or not phone_number_id:
        logger.error(f"WhatsApp credentials missing: TOKEN={'Set' if access_token else 'MISSING'}, ID={'Set' if phone_number_id else 'MISSING'}")
        return False

    url = f"https://graph.facebook.com/{API_VERSION}/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_id,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }
    }

    if components:
        payload["template"]["components"] = components

    logger.info(f"Sending WA template '{template_name}' to {recipient_id} with {len(components) if components else 0} components...")
    
    try:
        res = requests.post(url, headers=headers, json=payload)
        if res.status_code != 200:
            logger.error(f"WhatsApp API Error ({res.status_code}): {res.text}")
            return False
            
        logger.info(f"Successfully sent template to {recipient_id}")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send WA template to {recipient_id}: {e}")
        return False

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
    config = get_whatsapp_config()
    verify_token = config["verify_token"]
    logger.info(f"Verify Webhook - Mode: {hub_mode}, Token: {hub_verify_token}, Expected: {verify_token}")
    
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        logger.info("WhatsApp webhook verified successfully.")
        return PlainTextResponse(content=hub_challenge)
    
    logger.warning(f"Verification failed. Mode: {hub_mode}, Received Token: {hub_verify_token}")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhooks/whatsapp", summary="Receive WhatsApp Messages")
async def receive_whatsapp_message(request: Request):
    """
    Receives incoming messages from WhatsApp users.
    Checks for order patterns and replies accordingly.
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
                            
                            if "[TEST_ORDER]" in msg_body or "Code:" in msg_body:
                                await _handle_order_message(sender_wa_id, msg_body)
                            else:
                                _send_welcome_message(sender_wa_id)
                        else:
                            # For images, stickers, etc., just send the welcome message
                            logger.info(f"Received non-text WA Message ({msg_type}) from {sender_wa_id}")
                            _send_welcome_message(sender_wa_id)
                                
    return response_data

async def _handle_order_message(recipient_id: str, message_text: str):
    """
    Parses the order details and sends a confirmation link.
    """
    import re
    
    # Try to extract Code and ID
    code_match = re.search(r"Code:\s*([A-Z0-9_-]+)", message_text)
    id_match = re.search(r"ID:\s*([A-Z0-9_-]+)", message_text)
    
    code = code_match.group(1) if code_match else None
    plan_id = id_match.group(1) if id_match else None
    
    if code and plan_id:
        # User selected a specific plan
        reply_text = (
            f"✅ Sifarişiniz qəbul edildi!\n\n"
            f"📦 Paket Kodu: {code}\n"
            f"🆔 Plan ID: {plan_id}\n\n"
            "Ödənişi tamamlamaq üçün zəhmət olmasa aşağıdakı linkə keçid edin:\n"
            f"🔗 https://eydost.az/payment/test?code={code}&id={plan_id}\n\n"
            "Ödəniş təsdiqləndikdən sonra QR kodunuz dərhal buraya göndəriləcək. Təşəkkür edirik!"
        )
    elif "Taxi" in message_text or "📍 Pickup" in message_text:
        # Taxi order
        reply_text = (
            "🚖 Taksi sifarişiniz qəbul edildi!\n\n"
            "Operatorumuz yaxın dəqiqələrdə sizinlə əlaqə saxlayacaq və sürücü məlumatlarını göndərəcək.\n\n"
            "Bizi seçdiyiniz üçün təşəkkür edirik!"
        )
    else:
        # Generic order or partial match
        reply_text = (
            "✅ Sifarişiniz test mühitində qəbul edildi!\n\n"
            "Ödənişi tamamlamaq üçün zəhmət olmasa aşağıdakı linkə keçid edin:\n"
            "🔗 https://eydost.az/payment/test\n\n"
            "Təşəkkür edirik!"
        )
        
    send_whatsapp_message(recipient_id, reply_text)

def _send_welcome_message(recipient_id: str):
    """
    Sends the welcome message with the website link, including the recipient's WA ID.
    """
    base_url = os.environ.get("WEBAPP_URL", "https://eydost.az")
    reply_text = (
        "👋 Salam! EyDost-a xoş gəlmisiniz!\n\n"
        "Siz birbaşa buradan yazaraq sifariş verə bilərsiniz, və ya daha sürətli seçim etmək üçün aşağıdakı kataloqa daxil olub bir kliklə sifarişinizi tamamlaya bilərsiniz:\n\n"
        f"🔗 {base_url}/?wa_id={recipient_id}"
    )
    send_whatsapp_message(recipient_id, reply_text)

@router.post("/api/whatsapp/order")
async def create_order_from_webapp(request: Request):
    """
    Endpoint called by the frontend to trigger a WhatsApp confirmation.
    Expects JSON: { "wa_id": "...", "code": "...", "id": "...", "type": "esim" | "taxi", "details": "..." }
    """
    data = await request.json()
    wa_id = data.get("wa_id")
    order_type = data.get("type", "esim")
    
    if not wa_id:
        raise HTTPException(status_code=400, detail="wa_id is required")
    
    if order_type == "esim":
        code = data.get("code")
        plan_id = data.get("id")
        msg = f"Code: {code}\nID: {plan_id}"
        await _handle_order_message(wa_id, msg)
    elif order_type == "taxi":
        details = data.get("details", "")
        await _handle_order_message(wa_id, details)
        
    return {"status": "ok", "message": "Confirmation sent to WhatsApp"}
