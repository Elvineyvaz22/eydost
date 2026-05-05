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
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)
router = APIRouter()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8614813655:AAGgk9VS0jg7p3EPcvuIKFOfcW8pppudakg")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "7767493706")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")  # initData validation üçün


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
        
        # Hash-i çıxarırıq
        received_hash = parsed.pop('hash', '')
        
        # Data string-i: sorted key=value formatında
        data_check_string = '\n'.join(
            f"{k}={v}" for k, v in sorted(parsed.items())
        )
        
        # Secret key yaradırıq
        if not BOT_TOKEN:
            logger.warning("BOT_TOKEN yoxdur, initData validation keçilir")
            return parsed.get('user') and json.loads(
                unquote(parsed.get('user', '{}'))
            )
        
        secret_key = hmac.new(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()
        
        # Expected hash
        from urllib.parse import unquote
        expected_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(received_hash, expected_hash):
            logger.warning("initData hash uyğun gəlmir!")
            return None
        
        # User məlumatlarını parse edirik
        if 'user' in parsed:
            import json
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


@router.post("/api/telegram/mini-app")
async def receive_mini_app_data(request: Request):
    """
    Telegram Mini App-dən gələn web_app_data-nı emal edir.
    
    Göndərilən format:
    {"action": "esim_order", "country": "Azerbaijan", "code": "AZ_10GB", "user_id": 123456}
    
    İstifadəçiyə təsdiq mesajı, adminə tam sifariş göndərilir.
    """
    try:
        body = await request.json()
        logger.info(f"Mini app data received: {body}")
        
        action = body.get('action')
        
        if action == 'esim_order':
            country = body.get('country', 'N/A')
            code = body.get('code', 'N/A')
            user_id = body.get('user_id')
            gb = body.get('gb', 'N/A')
            days = body.get('days', 'N/A')
            price = body.get('price', 'N/A')
            
            # Adminə sifariş göndəririk
            admin_text = f"""📦 <b>Yeni eSIM Sifarişi (Mini App)!</b>

🏷 Code: <code>{code}</code>
🌍 Ölkə: {country}
📊 Data: {gb} GB
⏱ Etibarlılıq: {days} gün
💰 Qiymət: {price}
👤 User ID: {user_id}

🔗 Mənbə: Telegram Mini App"""
            
            send_telegram_message(ADMIN_CHAT_ID, admin_text)
            
            # İstifadəçiyə təsdiq göndəririk
            if user_id:
                confirm_text = (
                    f"✅ Siz <b>{country}</b> üçün <code>{code}</code> paketini seçdiniz.\n\n"
                    f"📊 Data: {gb} GB | ⏱ {days} gün | 💰 {price}\n\n"
                    f"Ödənişə başlayaq? /pay"
                )
                send_telegram_message(str(user_id), confirm_text)
            
            return {
                "status": "ok",
                "message": f"Siz {country} üçün {code} paketini seçdiniz. Ödənişə başlayaq?"
            }
        
        else:
            return {"status": "error", "message": "Naməlum əməliyyat"}
            
    except Exception as e:
        logger.error(f"Mini app xətası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
