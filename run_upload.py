#!/usr/bin/env python3
import os, json

# Load .env manually
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(env_path):
    for line in open(env_path):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()

# Override with real Supabase service key AFTER loading .env
os.environ['SUPABASE_SERVICE_KEY'] = '3/fu48SEvfxOZMnRvJuapn53x1kf7cWeDAkJkmI3nPoa35DQkHeNAfRI/tJb8KkzecpRo3KzswO6+wrwfneMWw=='

script_dir = os.path.dirname(__file__)
json_path = os.path.join(script_dir, 'pricing_rules_update.json')

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

pricing_rules = data.get('pricing_rules', [])
print(f"{len(pricing_rules)} qiymet qaydasi yuklenir...")

import requests

SUPABASE_URL = os.environ['SUPABASE_URL']
SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']
print(f"Supabase URL: {SUPABASE_URL}")
print(f"Service key prefix: {SERVICE_KEY[:20]}...")

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f"Bearer {SERVICE_KEY}",
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

# Check if row exists
select_url = f"{SUPABASE_URL}/rest/v1/site_content?key=eq.esim_pricing_rules&select=id"
r = requests.get(select_url, headers=HEADERS)
existing = r.json()
print(f"SELECT response: {r.status_code}, data: {str(existing)[:200]}")

if existing and isinstance(existing, list) and len(existing) > 0:
    row_id = existing[0]['id']
    delete_url = f"{SUPABASE_URL}/rest/v1/site_content?id=eq.{row_id}"
    r = requests.delete(delete_url, headers=HEADERS)
    print(f"Delete response: {r.status_code}")

    insert_url = f"{SUPABASE_URL}/rest/v1/site_content"
    payload = {'id': row_id, 'key': 'esim_pricing_rules', 'value': pricing_rules}
    r = requests.post(insert_url, headers=HEADERS, json=payload)
    if r.status_code in (200, 201, 204):
        print(f"Udas! ID {row_id} yenilandi ({len(pricing_rules)} qayda).")
    else:
        print(f"Xeta: {r.status_code} - {r.text[:500]}")
else:
    insert_url = f"{SUPABASE_URL}/rest/v1/site_content"
    payload = {'key': 'esim_pricing_rules', 'value': pricing_rules}
    r = requests.post(insert_url, headers=HEADERS, json=payload)
    if r.status_code in (200, 201, 204):
        print("Udas! Yeni setir yaradildi.")
    else:
        print(f"Xeta: {r.status_code} - {r.text[:500]}")

# Verify
verify_url = f"{SUPABASE_URL}/rest/v1/site_content?key=eq.esim_pricing_rules&select=value"
v = requests.get(verify_url, headers=HEADERS)
result = v.json()
print(f"Verify: {str(result)[:300]}")
if result and isinstance(result, list) and len(result) > 0:
    val = result[0].get('value', [])
    if isinstance(val, list):
        print(f"Teyit: {len(val)} qayda Supabase-de saxlanilb.")
    else:
        print(f"Teyit xeta: {str(val)[:200]}")
