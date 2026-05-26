import os
import urllib.request, ssl, json

API_KEY = os.environ.get("ESIM_BOT_API_KEY")
if not API_KEY:
    raise SystemExit("Set ESIM_BOT_API_KEY env var first")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# All countries to check
countries = [
    'TR', 'AZ', 'RU', 'UA', 'GE', 'DE', 'FR', 'GB', 'IT', 'ES',
    'NL', 'BE', 'CH', 'AT', 'PL', 'PT', 'SE', 'NO', 'DK', 'FI',
    'CZ', 'HU', 'RO', 'BG', 'GR', 'HR', 'SK', 'SI', 'EE', 'LT',
    'LV', 'IE', 'LU', 'MT', 'CY', 'US', 'CA', 'MX', 'BR', 'AR',
    'CL', 'CO', 'PE', 'VE', 'EC', 'CN', 'JP', 'KR', 'HK', 'TW',
    'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'IN', 'PK', 'BD', 'LK',
    'AU', 'NZ', 'AE', 'SA', 'IL', 'JO', 'KW', 'QA', 'BH', 'OM',
    'LB', 'EG', 'ZA', 'NG', 'KE', 'GH', 'TZ', 'ET', 'MA', 'TN',
    'DZ', 'UG', 'MO', 'KH', 'KZ', 'UZ', 'AM', 'IS', 'AL', 'BA',
    'MK', 'RS', 'MD', 'MN', 'MM', 'NP', 'LY', 'IQ', 'IR', 'AF',
    'JM', 'TT', 'PR', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO',
    'CU', 'BO', 'PY', 'UY', 'GY', 'SR', 'BY', 'MZ', 'ZW', 'ZM',
    'AO', 'CM', 'SN', 'CI', 'ML', 'GL', 'AL', 'XK', 'ME', 'BA'
]

all_packages = {}
errors = []

for cc in countries:
    req = urllib.request.Request(
        f'https://bot.eydost.az/api/public/packages?country_code={cc}',
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'x-api-key': API_KEY,
        }
    )
    try:
        r = urllib.request.urlopen(req, context=ctx, timeout=15)
        body = r.read().decode('utf-8', errors='ignore')
        data = json.loads(body)
        if data.get('success') and data.get('data'):
            all_packages[cc] = data['data']
            print(f"✓ {cc}: {len(data['data'])} packages")
        else:
            print(f"- {cc}: no data")
    except Exception as e:
        errors.append((cc, str(e)))
        print(f"✗ {cc}: {e}")

print(f"\n=== SUMMARY ===")
print(f"Countries with packages: {len(all_packages)}")
total = sum(len(v) for v in all_packages.values())
print(f"Total packages: {total}")
print(f"Errors: {len(errors)}")

# Save to file
with open('bot_packages.json', 'w', encoding='utf-8') as f:
    json.dump(all_packages, f, ensure_ascii=False, indent=2)
print("\nSaved to bot_packages.json")

# Print sample for TR
if 'TR' in all_packages:
    print("\n=== TR Sample ===")
    print(json.dumps(all_packages['TR'], indent=2, ensure_ascii=False))