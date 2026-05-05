"""
Telegram Order API - Bot üçün sifariş emalı
saytdan gələn sifarişləri birbaşa adminə göndərir
"""

import requests
import os
import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8614813655:AAGgk9VS0jg7p3EPcvuIKFOfcW8pppudakg")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "7767493706")

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
async def receive_telegram_order(data: dict):
    """
    Saytdan Telegram sifarişi alır və adminə göndərir.
    WhatsApp-dakı kimi avtomatik emal.
    
    data = {
        code: "TR",
        id: "turkey-5gb", 
        country: "Turkey",
        gb: "5",
        days: "15",
        price: "$9.99",
        message: "Hi! I want to buy an eSIM..."
    }
    """
    logger.info(f"Telegram order received: {data}")
    
    code = data.get('code', 'N/A')
    esim_id = data.get('id', 'N/A')
    country = data.get('country', 'N/A')
    gb = data.get('gb', 'N/A')
    days = data.get('days', 'N/A')
    price = data.get('price', 'N/A')
    
    # Adminə sifariş məlumatı göndər - WhatsApp-dakı kimi
    admin_text = f"""📦 <b>Yeni eSIM Sifarişi!</b>

🏷 Code: <code>{code}</code>
🆔 ID: <code>{esim_id}</code>
🌍 Ölkə: {country}
📊 Data: {gb} GB
⏱ Etibarlılıq: {days} gün
💰 Qiymət: {price}

📨 Mesaj: {data.get('message', 'N/A')}"""

    admin_result = send_telegram_message(ADMIN_CHAT_ID, admin_text)
    
    if admin_result and admin_result.get("ok"):
        logger.info(f"Order sent to admin successfully. Message ID: {admin_result.get('result', {}).get('message_id')}")
        return {
            "status": "ok",
            "message": f"✅ Sifariş alındı! Code: {code}, Ölkə: {country}, {gb}GB/{days}gün - {price}"
        }
    else:
        logger.error(f"Failed to send to admin: {admin_result}")
        return {"status": "ok", "message": "Sifariş emal olunur..."}
