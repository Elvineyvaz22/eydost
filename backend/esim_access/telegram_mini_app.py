"""
Telegram Mini App Handler
web_app_data mesajlarını emal edir və eSIM sifarişlərini işləyir.
"""

import os
import json
import hashlib
import hmac
import time
import requests
import logging
from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")


def validate_init_data(init_data: str) -> dict | None:
    """
    Telegram initData-nı yoxlayır.
    Hash uyğunlaşdırılırsa, istifadəçi məlumatlarını qaytarır.
    Əks halda None qaytarır.
    
    Necə işləyir:
    1. initData-nı & ilə ayırırıq (hash xaric)
    2. Hər bir data_dict-ə yığırıq
    3. Alanları sorted() ilə sıralayırıq: key=value\n formatında
    4. secret_key = HMAC-SHA256(bot_token, "WebAppData")
    5. expected_hash = HMAC-SHA256(secret_key, sorted_data)
    6. Gələn hash ilə expected_hash-u müqayisə edirik
    """
    if not init_data:
        return None
    
    try:
        parsed = {}
        for item in init_data.split('&'):
            if '=' in item:
                key, value = item.split('=', 1)
                parsed[key] = value
        
        received_hash = parsed.pop('hash', '')
        
        data_check_string = '\n'.join(
            f"{k}={v}" for k, v in sorted(parsed.items())
        )
        
        if not BOT_TOKEN:
            logger.warning("BOT_TOKEN yoxdur, initData validation keçilir")
            user_raw = parsed.get('user', '{}')
            return json.loads(unquote(user_raw)) if user_raw else None
        
        secret_key = hmac.HMAC(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()
        
        expected_hash = hmac.HMAC(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(received_hash, expected_hash):
            logger.warning("initData hash uyğun gəlmir!")
            return None
        
        if 'user' in parsed:
            user_data = json.loads(unquote(parsed['user']))
            return user_data
        
        return parsed
        
    except Exception as e:
        logger.error(f"initData validation xətası: {e}")
        return None


def send_telegram_message(chat_id: str, text: str):
    """Bot API ilə mesaj göndərir"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return None


class MiniAppOrderRequest(BaseModel):
    action: str
    country: str = 'N/A'
    code: str = 'N/A'
    user_id: int | str | None = None
    gb: str = 'N/A'
    days: str = 'N/A'
    price: str = 'N/A'


@router.post("/api/telegram/mini-app")
async def receive_mini_app_data(request: Request):
    """
    Telegram Mini App-dən gələn web_app_data-nı emal edir.
    """
    try:
        body = await request.json()
        order = MiniAppOrderRequest(**body)
        logger.info(f"Mini app data received: action={order.action} country={order.country}")
        
        if order.action == 'esim_order':
            admin_text = f"""📦 <b>Yeni eSIM Sifarişi (Mini App)!</b>

🏷 Code: <code>{order.code}</code>
🌍 Ölkə: {order.country}
📊 Data: {order.gb} GB
⏱ Etibarlılıq: {order.days} gün
💰 Qiymət: {order.price}
👤 User ID: {order.user_id}

🔗 Mənbə: Telegram Mini App"""
            
            send_telegram_message(ADMIN_CHAT_ID, admin_text)
            
            if order.user_id:
                confirm_text = (
                    f"✅ Siz <b>{order.country}</b> üçün <code>{order.code}</code> paketini seçdiniz.\n\n"
                    f"📊 Data: {order.gb} GB | ⏱ {order.days} gün | 💰 {order.price}\n\n"
                    f"Ödənişə başlayaq? /pay"
                )
                send_telegram_message(str(order.user_id), confirm_text)
            
            return {
                "status": "ok",
                "message": f"Siz {order.country} üçün {order.code} paketini seçdiniz. Ödənişə başlayaq?"
            }
        
        else:
            raise HTTPException(status_code=400, detail="Naməlum əməliyyat")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mini app xətası: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/api/telegram/validate")
async def validate_user(init_data: str):
    """
    Frontend-dən gələn initData-nı server tərəfində yoxlayır.
    Frontend: fetch('/api/telegram/validate?init_data=' + tg.initData)
    """
    user = validate_init_data(init_data)
    if user:
        return {"valid": True, "user": user}
    return {"valid": False}
