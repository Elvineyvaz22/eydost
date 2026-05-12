"""
Updates the hero badge in Supabase site_content table.
Run: python -c "$(cat update_hero_badge.py)" 
Or: python update_hero_badge.py
"""
import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "your-service-key")

def update_hero_badge():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # Get current hero value
    get_url = f"{SUPABASE_URL}/rest/v1/site_content?key=eq.hero&select=value,id"
    r = requests.get(get_url, headers=headers)
    print(f"GET status: {r.status_code}")
    print(f"GET response: {r.text}")
    
    if r.status_code != 200:
        print("Failed to fetch hero content")
        return
    
    data = r.json()
    if not data:
        print("No hero content found")
        return
    
    row_id = data[0]["id"]
    current_value = data[0]["value"]
    
    # Update badge only
    current_value["badge"] = "AI-Powered WhatsApp Assistant"
    
    update_url = f"{SUPABASE_URL}/rest/v1/site_content?id=eq.{row_id}"
    update_payload = {"value": current_value}
    
    r2 = requests.patch(update_url, headers=headers, json=update_payload)
    print(f"PATCH status: {r2.status_code}")
    print(f"PATCH response: {r2.text}")
    
    if r2.status_code in [200, 204]:
        print("SUCCESS: hero badge updated to 'AI-Powered WhatsApp Assistant'")
    else:
        print("FAILED to update hero badge")

if __name__ == "__main__":
    update_hero_badge()
