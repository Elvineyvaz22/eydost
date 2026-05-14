import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Try the public packages endpoint from esimApi.ts
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
            'x-api-key': '0283e222ea829a8300d3f2ce4b42855d',
        }
    )
    try:
        r = urllib.request.urlopen(req, context=ctx, timeout=10)
        body = r.read().decode('utf-8', errors='ignore')
        print(f"GET {ep} -> Status {r.status}, Len {len(body)}")
        try:
            data = json.loads(body)
            print(json.dumps(data, indent=2, ensure_ascii=False)[:2000])
        except:
            print(body[:500])
        print('---')
    except Exception as e:
        print(f"GET {ep} -> ERROR: {e}")