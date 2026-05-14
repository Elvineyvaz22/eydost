import urllib.request, ssl, json, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Try various endpoints
endpoints = ['/', '/api/packages', '/packages', '/api/esim', '/esim/packages', '/list']

for ep in endpoints:
    req = urllib.request.Request(
        f'https://bot.eydost.az{ep}',
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json, text/html'}
    )
    try:
        r = urllib.request.urlopen(req, context=ctx, timeout=10)
        html = r.read().decode('utf-8', errors='ignore')
        print(f"GET {ep} -> Status {r.status}, Len {len(html)}")
        print(html[:500])
        print('---')
    except Exception as e:
        print(f"GET {ep} -> ERROR: {e}")