#!/usr/bin/env python3
"""
bot.eydost.az paketlerini oxuyur ve pricing_rules_update.json formatinda
yeni pricing rules yaradır Supabase-e upload üçün.
"""

import json
import re

with open('bot_packages.json', 'r', encoding='utf-8') as f:
    bot_data = json.load(f)

COUNTRY_NAMES = {
    'TR': 'Turkey', 'AZ': 'Azerbaijan', 'RU': 'Russia', 'UA': 'Ukraine', 'GE': 'Georgia',
    'DE': 'Germany', 'FR': 'France', 'GB': 'United Kingdom', 'IT': 'Italy', 'ES': 'Spain',
    'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'PL': 'Poland',
    'PT': 'Portugal', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
    'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria', 'GR': 'Greece',
    'HR': 'Croatia', 'SK': 'Slovakia', 'SI': 'Slovenia', 'EE': 'Estonia', 'LT': 'Lithuania',
    'LV': 'Latvia', 'IE': 'Ireland', 'LU': 'Luxembourg', 'MT': 'Malta', 'CY': 'Cyprus',
    'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico', 'BR': 'Brazil', 'AR': 'Argentina',
    'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador',
    'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea', 'HK': 'Hong Kong', 'TW': 'Taiwan',
    'SG': 'Singapore', 'MY': 'Malaysia', 'TH': 'Thailand', 'ID': 'Indonesia', 'PH': 'Philippines',
    'VN': 'Vietnam', 'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka',
    'AU': 'Australia', 'NZ': 'New Zealand', 'AE': 'UAE', 'SA': 'Saudi Arabia', 'IL': 'Israel',
    'JO': 'Jordan', 'KW': 'Kuwait', 'QA': 'Qatar', 'BH': 'Bahrain', 'OM': 'Oman',
    'EG': 'Egypt', 'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya',
    'GH': 'Ghana', 'TZ': 'Tanzania', 'MA': 'Morocco', 'TN': 'Tunisia',
    'DZ': 'Algeria', 'UG': 'Uganda', 'MO': 'Macau', 'KH': 'Cambodia', 'KZ': 'Kazakhstan',
    'UZ': 'Uzbekistan', 'AM': 'Armenia', 'IS': 'Iceland', 'AL': 'Albania', 'BA': 'Bosnia',
    'MK': 'North Macedonia', 'RS': 'Serbia', 'MD': 'Moldova', 'MN': 'Mongolia',
    'NP': 'Nepal', 'LY': 'Libya', 'IQ': 'Iraq', 'AF': 'Afghanistan', 'JM': 'Jamaica',
    'TT': 'Trinidad & Tobago', 'PR': 'Puerto Rico',
    'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala', 'HN': 'Honduras',
    'SV': 'El Salvador', 'NI': 'Nicaragua', 'DO': 'Dominican Republic', 'BO': 'Bolivia',
    'PY': 'Paraguay', 'UY': 'Uruguay', 'GY': 'Guyana', 'SR': 'Suriname', 'BY': 'Belarus',
    'MZ': 'Mozambique', 'ZM': 'Zambia', 'AO': 'Angola', 'CM': 'Cameroon',
    'SN': 'Senegal', 'CI': 'Ivory Coast', 'ML': 'Mali', 'GL': 'Greenland',
    'XK': 'Kosovo', 'ME': 'Montenegro',
}

MARGIN = 1.75

pricing_rules = []

for country_code, packages in bot_data.items():
    country_name = COUNTRY_NAMES.get(country_code, country_code)
    
    for pkg in packages:
        volume = int(pkg.get('volume', 0))
        if volume >= 1024 * 1024 * 1024:
            gb = f"{int(volume / (1024 * 1024 * 1024))}GB"
        else:
            gb = f"{int(volume / (1024 * 1024))}MB"
        
        days = pkg.get('duration', 30)
        sell_price = float(pkg.get('sell_price', 0))
        api_price = round(sell_price / MARGIN, 4)
        slug = pkg.get('slug', '')
        
        # Determine plan_type
        if 'FUP' in slug or '1Mbps' in slug:
            plan_type = 'Unlimited FUP'
        else:
            plan_type = 'Full Speed'
        
        # Build name
        if 'Daily' in slug:
            name = f"{country_name} {gb}/Day"
        else:
            name = f"{country_name} {gb} {days}Days"
        
        # Determine target_type (regional if slug contains -)
        is_regional = '-' in slug
        target_type = 'regional' if is_regional else 'country'
        target_id = country_code
        
        pricing_rules.append({
            'target_type': target_type,
            'target_id': target_id,
            'slug': slug,
            'name': name,
            'api_price': api_price,
            'sell_price': sell_price,
            'margin': MARGIN,
            'margin_pct': 75,
            'gb': gb,
            'days': days,
            'plan_type': plan_type,
            'is_active': True,
        })

output = {
    'updated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
    'source': 'bot.eydost.az',
    'margin': MARGIN,
    'margin_pct': 75,
    'total_plans': len(pricing_rules),
    'total_countries': len(bot_data),
    'pricing_rules': pricing_rules,
}

with open('pricing_rules_update.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Generated {len(pricing_rules)} pricing rules for {len(bot_data)} countries")
print("Saved to pricing_rules_update.json")
print("\nSample rules:")
for r in pricing_rules[:5]:
    print(f"  {r['name']}: ${r['sell_price']} (api: ${r['api_price']})")