import requests
import time

TOKEN = "8667080152:AAEPvJqAcyEA90A_pE89rJT80Ur2B9WxlmU"
URL = f"https://api.telegram.org/bot{TOKEN}"

def get_updates(offset=None):
    url = f"{URL}/getUpdates"
    # timeout=100 long-polling üçün istifadə olunur
    params = {"timeout": 100, "offset": offset}
    try:
        response = requests.get(url, params=params)
        return response.json()
    except Exception as e:
        print("Telegram API ilə əlaqə xətası:", e)
        return {"ok": False}

def send_message(chat_id, text):
    url = f"{URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    requests.post(url, json=payload)

def main():
    print("Bot işə düşdü və Telegram-dan sifarişləri (web_app_data) gözləyir...")
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
                
                # Saytdan (Mini App-dən) gələn datanı tuturuq:
                if "web_app_data" in message:
                    data = message["web_app_data"]["data"]
                    print(f"Yeni Sifariş! Web App-dan gələn məlumat:\n{data}")
                    
                    # İstifadəçiyə mesajı olduğu kimi qaytarırıq (və ya təsdiq mesajı əlavə edirik)
                    reply_text = f"<b>Yeni Sifarişiniz qeydə alındı:</b>\n\n<code>{data}</code>\n\nZəhmət olmasa ödənişi gözləyin və ya operatorun cavabını gözləyin."
                    send_message(chat_id, reply_text)
                    
                    # QEYD: Əgər adminlərə də bildiriş getməsini istəyirsinizsə:
                    # send_message("SİZİN_TELEGRAM_ID", f"YENİ SİFARİŞ GƏLDİ:\n\n{data}")
                
                # Əgər istifadəçi bota adi söz yazarsa (məs: /start)
                elif "text" in message:
                    text = message["text"]
                    if text == "/start":
                        send_message(chat_id, "Salam! Sifariş vermək üçün zəhmət olmasa Mini App-ə (sayta) daxil olun.")
        
        time.sleep(1)

if __name__ == "__main__":
    main()
