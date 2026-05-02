import os
import requests
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

def get_templates():
    # First, get the WABA ID
    url_phone = f"https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    
    print(f"Fetching info for Phone Number ID: {PHONE_NUMBER_ID}...")
    res = requests.get(url_phone, headers=headers)
    if res.status_code != 200:
        print(f"Error fetching phone info: {res.text}")
        return
    
    data = res.json()
    waba_id = data.get("whatsapp_business_account_id")
    if not waba_id:
        print("Could not find WhatsApp Business Account ID.")
        return
    
    print(f"Found WABA ID: {waba_id}")
    
    # Now list templates
    url_templates = f"https://graph.facebook.com/v20.0/{waba_id}/message_templates"
    res = requests.get(url_templates, headers=headers)
    if res.status_code != 200:
        print(f"Error fetching templates: {res.text}")
        return
    
    templates = res.json().get("data", [])
    print(f"\nFound {len(templates)} templates:")
    for t in templates:
        print(f"- {t['name']} ({t['language']}) | Status: {t['status']}")

if __name__ == "__main__":
    get_templates()
