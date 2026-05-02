import os
import requests
from dotenv import load_dotenv

load_dotenv()

tk = os.getenv("WHATSAPP_ACCESS_TOKEN")
phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

def find_waba():
    # Try different fields to get WABA ID
    url = f"https://graph.facebook.com/v20.0/{phone_id}?fields=whatsapp_business_account,whatsapp_business_account_id"
    headers = {"Authorization": f"Bearer {tk}"}
    r = requests.get(url, headers=headers)
    print(f"Phone ID lookup: {r.text}")
    
    # Try 'me'
    url = "https://graph.facebook.com/v20.0/me?fields=id,name,accounts"
    r = requests.get(url, headers=headers)
    print(f"Me lookup: {r.text}")

if __name__ == "__main__":
    find_waba()
