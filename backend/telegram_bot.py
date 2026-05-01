import requests
import time

TOKEN = "8667080152:AAEPvJqAcyEA90A_pE89rJT80Ur2B9WxlmU"
URL = f"https://api.telegram.org/bot{TOKEN}"

def get_updates(offset=None):
    url = f"{URL}/getUpdates"
    params = {"timeout": 100, "offset": offset}
    try:
        response = requests.get(url, params=params)
        return response.json()
    except Exception as e:
        print("Telegram API Error:", e)
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
    print("Bot is running and waiting for web_app_data...")
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
                
                if "web_app_data" in message:
                    data = message["web_app_data"]["data"]
                    print(f"New Order Received from Web App!")
                    
                    reply_text = f"<b>Yeni Sifarişiniz qeydə alındı:</b>\n\n<code>{data}</code>\n\nZəhmət olmasa ödənişi gözləyin və ya operatorun cavabını gözləyin."
                    send_message(chat_id, reply_text)
                    
                elif "text" in message:
                    text = message["text"]
                    if text == "/start":
                        send_message(chat_id, "Salam! Sifariş vermək üçün zəhmət olmasa Mini App-ə (sayta) daxil olun.")
        
        time.sleep(1)

if __name__ == "__main__":
    main()
