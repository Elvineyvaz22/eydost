import os
import ssl
import json
import urllib.request

API_KEY = os.environ.get("ESIM_BOT_API_KEY")
if not API_KEY:
    raise SystemExit("Set ESIM_BOT_API_KEY env var first")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

endpoints = [
    '/api/public/packages?country_code=TR',
    '/api/public/packages',
    '/api/packages',
    '/api/esim/packages',
]

for ep in endpoints:
    req = urllib.request.Request(
        f'https://bot.eydost.az{ep}',
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'x-api-key': API_KEY,
        }
    )
    try:
        r = urllib.request.urlopen(req, context=ctx, timeout=10)
        body = r.read().decode('utf-8', errors='ignore')
        print(f"GET {ep} -> Status {r.status}, Len {len(body)}")
        try:
            data = json.loads(body)
            print(json.dumps(data, indent=2, ensure_ascii=False)[:2000])
        except Exception:
            print(body[:500])
        print('---')
    except Exception as e:
        print(f"GET {ep} -> ERROR: {e}")
