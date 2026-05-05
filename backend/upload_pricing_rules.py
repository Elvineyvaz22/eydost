"""
Upload pricing_rules_update.json to Supabase site_content table.
Uses requests library (no supabase pip package needed).
"""

import json
import os
import requests

SUPABASE_URL = 'https://grudfrtojmllelbhefms.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydWRmcnRvam1sbGVsYmhlZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDIwMTAsImV4cCI6MjA4MDYxODAxMH0.X-JHCmKcBWp7Y3drAxBKUErR2RilBewdMuR_GeGtlL0'

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
}

def main():
    # Load pricing_rules_update.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(os.path.dirname(script_dir), 'pricing_rules_update.json')

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pricing_rules = data.get('pricing_rules', [])

    if not pricing_rules:
        print("Xeta: pricing_rules array tapilmadi!")
        return

    print(f"{len(pricing_rules)} qiymet qaydasi yuklenir...")

    # Check if row exists
    select_url = f"{SUPABASE_URL}/rest/v1/site_content?key=eq.esim_pricing_rules&select=id"
    r = requests.get(select_url, headers=HEADERS)
    existing = r.json()

    if existing and len(existing) > 0:
        row_id = existing[0]['id']
        # Delete old and insert new (more reliable for large JSON)
        delete_url = f"{SUPABASE_URL}/rest/v1/site_content?id=eq.{row_id}"
        r = requests.delete(delete_url, headers=HEADERS)
        print(f"Delete response: {r.status_code} - {r.text[:200] if r.text else 'OK'}")
        
        insert_url = f"{SUPABASE_URL}/rest/v1/site_content"
        payload = {'id': row_id, 'key': 'esim_pricing_rules', 'value': pricing_rules}
        r = requests.post(insert_url, headers=HEADERS, json=payload)
        if r.status_code in (200, 201, 206):
            print(f"Udas! ID {row_id} yenilandi ({len(pricing_rules)} qayda).")
        else:
            print(f"Xeta: {r.status_code} - {r.text}")
            return
    else:
        # Insert new row
        insert_url = f"{SUPABASE_URL}/rest/v1/site_content"
        payload = {'key': 'esim_pricing_rules', 'value': pricing_rules}
        r = requests.post(insert_url, headers=HEADERS, json=payload)
        if r.status_code in (200, 201, 206):
            print("Udas! Yeni setir yaradildi.")
        else:
            print(f"Xeta elave etmede: {r.status_code} - {r.text}")
            return

    # Verify - use service role key if available
    service_key = os.environ.get('SUPABASE_SERVICE_KEY', '')
    verify_headers = HEADERS.copy()
    if service_key:
        verify_headers['apikey'] = service_key
        verify_headers['Authorization'] = f'Bearer {service_key}'
    
    verify_url = f"{SUPABASE_URL}/rest/v1/site_content?key=eq.esim_pricing_rules&select=value"
    v = requests.get(verify_url, headers=verify_headers)
    result = v.json()
    print(f"Verify response: {result}")
    if result and isinstance(result, list):
        val = result[0].get('value', [])
        if isinstance(val, list):
            print(f"Teyit: {len(val)} qayda Supabase-de saxlanilb.")
        else:
            print(f"Teyit: value tipi {type(val)}, deyer: {str(val)[:200]}")

if __name__ == '__main__':
    main()
