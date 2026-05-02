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

def send_message(chat_id, text, reply_markup=None):
    url = f"{URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print("Error sending message:", e)
        return None

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
                        # URL-i .env-dən və ya birbaşa təyin edə bilərsiniz
                        webapp_url = "https://grimacing-deacon-uninstall.ngrok-free.dev/"
                        
                        reply_markup = {
                            "keyboard": [
                                [
                                    {
                                        "text": "🚀 Sifariş Ver (Mini App)",
                                        "web_app": {"url": webapp_url}
                                    }
                                ]
                            ],
                            "resize_keyboard": True
                        }
                        
                        send_message(chat_id, "Salam! EyDost-a xoş gəlmisiniz. Sifariş vermək üçün aşağıdakı düyməyə klikləyin:", reply_markup=reply_markup)
        
        time.sleep(1)

if __name__ == "__main__":
    main()
