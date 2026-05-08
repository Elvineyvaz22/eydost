"""
Telegram Order API - Bot üçün sifariş emalı
saytdan gələn sifarişləri birbaşa adminə göndərir
"""

import requests
import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class TelegramOrderRequest(BaseModel):
    code: str = 'N/A'
    id: str = 'N/A'
    country: str = 'N/A'
    gb: str = 'N/A'
    days: str = 'N/A'
    price: str = 'N/A'
    message: str = ''

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "")

def send_telegram_message(chat_id: str, text: str):
    """Bot API ilə mesaj göndərir"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        logger.info(f"Telegram API response: {result}")
        return result
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return None


@router.post("/api/telegram/order")
async def receive_telegram_order(data: TelegramOrderRequest):
    """
    Saytdan Telegram sifarişi alır və adminə göndərir.
    """
    if not TELEGRAM_BOT_TOKEN or not ADMIN_CHAT_ID:
        raise HTTPException(status_code=503, detail="Telegram not configured")

    logger.info(f"Telegram order received: country={data.country} code={data.code}")
    
    admin_text = f"""📦 <b>Yeni eSIM Sifarişi!</b>

🏷 Code: <code>{data.code}</code>
🆔 ID: <code>{data.id}</code>
🌍 Ölkə: {data.country}
📊 Data: {data.gb} GB
⏱ Etibarlılıq: {data.days} gün
💰 Qiymət: {data.price}

📨 Mesaj: {data.message or 'N/A'}"""

    admin_result = send_telegram_message(ADMIN_CHAT_ID, admin_text)
    
    if admin_result and admin_result.get("ok"):
        logger.info(f"Order sent to admin successfully. Message ID: {admin_result.get('result', {}).get('message_id')}")
        return {
            "status": "ok",
            "message": f"✅ Sifariş alındı! Code: {data.code}, Ölkə: {data.country}, {data.gb}GB/{data.days}gün - {data.price}"
        }
    else:
        logger.error(f"Failed to send to admin: {admin_result}")
        raise HTTPException(status_code=502, detail="Telegram API ilə əlaqə uğursuz oldu")
