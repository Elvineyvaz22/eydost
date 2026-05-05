import requests
import time
import os
import json

TOKEN = "8667080152:AAEPvJqAcyEA90A_pE89rJT80Ur2B9WxlmU"
URL = f"https://api.telegram.org/bot{TOKEN}"
ADMIN_CHAT_ID = "7767493706"

def get_updates(offset=None):
    url = f"{URL}/getUpdates"
    params = {"timeout": 100, "offset": offset}
    try:
        response = requests.get(url, params=params)
        return response.json()
    except Exception as e:
        print("Telegram API Error:", e)
        return {"ok": False}

def send_message(chat_id, text, reply_markup=None, parse_mode="HTML"):
    url = f"{URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print("Error sending message:", e)
        return None

def send_photo(chat_id, photo_url, caption=None, reply_markup=None):
    url = f"{URL}/sendPhoto"
    payload = {
        "chat_id": chat_id,
        "photo": photo_url
    }
    if caption:
        payload["caption"] = caption
        payload["parse_mode"] = "HTML"
    if reply_markup:
        payload["reply_markup"] = reply_markup
    
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print("Error sending photo:", e)
        return None

def notify_admin(order: dict, user_id: int, first_name: str):
    """Adminə sifariş haqqında məlumat göndərir"""
    country = order.get('country', 'N/A')
    code = order.get('code', 'N/A')
    gb = order.get('gb', 'N/A')
    days = order.get('days', 'N/A')
    price = order.get('price', 'N/A')
    
    admin_text = f"""📦 <b>Yeni eSIM Sifarişi (Mini App)!</b>

🏷 Code: <code>{code}</code>
🌍 Ölkə: {country}
📊 Data: {gb} GB
⏱ Etibarlılıq: {days} gün
💰 Qiymət: {price}
👤 İstifadəçi: <a href="tg://user?id={user_id}">{first_name}</a> (ID: {user_id})

🔗 Mənbə: Telegram Mini App"""

    send_message(ADMIN_CHAT_ID, admin_text)

def main():
    print("=" * 50)
    print("Bot is running - Mini App orders enabled!")
    print("Waiting for web_app_data...")
    print("=" * 50)
    
    offset = None
    while True:
        updates = get_updates(offset)
        
        if updates.get("ok") and updates.get("result"):
            for update in updates["result"]:
                offset = update["update_id"] + 1
                
                message = update.get("message")
                if not message:
                    continue
                
                chat_id = message["chat"]["id"]
                first_name = message.get("from", {}).get("first_name", "İstifadəçi")
                user_id = message.get("from", {}).get("id", chat_id)
                
                # web_app_data - Mini App-dən gələn sifariş
                if "web_app_data" in message:
                    raw_data = message["web_app_data"].get("data", "")
                    print(f"[ORDER] Data: {raw_data}")

                    try:
                        order = json.loads(raw_data)
                        # Mini App-dakı hazır mətn birbaşa istifadəçiyə göndərilir
                        msg = order.get("message", raw_data)
                        send_message(chat_id, msg)

                    except json.JSONDecodeError:
                        send_message(chat_id, raw_data)
                
                # Text mesajlarını emal et
                elif "text" in message:
                    text = message["text"]
                    
                    # Saytdan gələn "Hi! I want to buy..." tipli mesajlar
                    if "I want to buy" in text or "esim" in text.lower() or "sim" in text.lower():
                        if "code" in text.lower():
                            # Adminə göndəririk
                            admin_text = f"""📦 <b>Saytdan sifariş (Telegram)!</b>

📨 <b>Mesaj:</b>
<code>{text}</code>

👤 İstifadəçi: {first_name} (ID: {chat_id})"""

                            send_message(ADMIN_CHAT_ID, admin_text)
                            send_message(
                                chat_id,
                                "✅ Sifarişiniz alındı! Əməkdaşlarımız tezliklə sizinlə əlaqə saxlayacaq."
                            )
                        else:
                            send_message(
                                chat_id,
                                "👋 Salam! eSIM sifarişi üçün saytımızdan paket seçin."
                            )

def run_webhook():
    """Webhook rejimində işlətmək üçün (FastAPI içində istifadə olunur)"""
    from fastapi import Request
    import hashlib
    import hmac
    
    async def handle_update(request: Request):
        data = await request.json()
        
        # Botfather token ilə webhook verification
        update = data.get("message", {})
        chat_id = update.get("chat", {}).get("id")
        text = update.get("text", "")
        user_id = update.get("from", {}).get("id")
        first_name = update.get("from", {}).get("first_name", "İstifadəçi")
        
        # web_app_data
        web_app_data = update.get("web_app_data", {})
        if web_app_data:
            raw_data = web_app_data.get("data", "")
            try:
                order = json.loads(raw_data)
                country = order.get("country", "N/A")
                code = order.get("code", "N/A")
                gb = order.get("gb", "N/A")
                days = order.get("days", "N/A")
                price = order.get("price", "N/A")
                
                send_message(chat_id, f"✅ {country} üçün {code} - {gb}GB/{days}gün seçildi!")
                notify_admin(order, user_id or chat_id, first_name)
            except:
                send_message(chat_id, "✅ Sifariş alındı!")
        
        return {"ok": True}
    
    return handle_update

if __name__ == "__main__":
    main()
