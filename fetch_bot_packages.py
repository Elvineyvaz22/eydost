import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://bot.eydost.az/api/packages',
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
    }
)

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=20)
    content = response.read().decode('utf-8', errors='ignore')
    data = json.loads(content)
    print(f"Got {len(data) if isinstance(data, list) else 'non-list response'} items")
    print(json.dumps(data[:3] if isinstance(data, list) else data, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"ERROR: {e}")