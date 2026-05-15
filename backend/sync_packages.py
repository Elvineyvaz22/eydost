"""
Sync eSIM packages from bot.eydost.az to Supabase.
Run daily: python sync_packages.py

Supports:
  python sync_packages.py          → sync all known countries
  python sync_packages.py TR US DE → sync specific countries
"""

import os
import sys
import logging
import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

ALL_COUNTRY_CODES = [
    'TR', 'US', 'DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'CH',
    'AT', 'PL', 'PT', 'SE', 'NO', 'DK', 'FI', 'CZ', 'HU', 'RO',
    'BG', 'GR', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'IE', 'LU',
    'MT', 'CY', 'AZ', 'GE', 'UA', 'RU', 'CA', 'MX', 'BR', 'AR',
    'CL', 'CO', 'PE', 'CN', 'JP', 'KR', 'HK', 'TW', 'SG', 'MY',
    'TH', 'ID', 'PH', 'VN', 'IN', 'PK', 'BD', 'LK', 'AU', 'NZ',
    'AE', 'SA', 'IL', 'JO', 'KW', 'QA', 'BH', 'OM', 'LB', 'EG',
    'ZA', 'NG', 'KE', 'GH', 'TZ', 'ET', 'MA', 'TN', 'DZ', 'UG',
    'IS', 'AL', 'BA', 'MK', 'RS', 'MD',
]


def get_packages_for_country(country_code: str) -> list[dict]:
    api_key = os.environ.get("BOT_API_KEY")
    api_url = os.environ.get("BOT_API_URL", "https://bot.eydost.az/api/public/packages")

    resp = httpx.get(
        api_url,
        params={"country_code": country_code.upper()},
        headers={"x-api-key": api_key},
        timeout=30.0,
    )

    if not resp.is_success:
        logger.warning(f"[{country_code}] HTTP {resp.status_code}: {resp.text[:100]}")
        return []

    json_data = resp.json()
    raw = json_data.get("data") or []

    logger.info(f"[{country_code}] → {len(raw)} packages")

    return [
        {
            "country_code": p.get("country_code") or country_code.upper(),
            "package_code": p.get("package_code") or "",
            "slug": p.get("slug") or p.get("package_code") or "",
            "name": p.get("name") or "",
            "volume_bytes": int(p.get("volume") or 0),
            "duration_days": int(p.get("duration") or 1),
            "sell_price_minor": int(p.get("sell_price_minor") or 0),
            "currency_code": p.get("currency") or "AZN",
            "is_unlimited": int(p.get("volume") or 0) == 0,
            "speed": p.get("speed") or "4G",
            "description": p.get("description") or "",
            "is_active": True,
        }
        for p in raw
    ]


def sync_country(supabase, country_code: str) -> int:
    records = get_packages_for_country(country_code)
    if not records:
        return 0

    for record in records:
        result = supabase.table("esim_packages").upsert(
            record,
            on_conflict="package_code",
        ).execute()

    return len(records)


def main():
    api_key = os.environ.get("BOT_API_KEY")
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not api_key:
        logger.error("BOT_API_KEY not set")
        sys.exit(1)
    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
        sys.exit(1)

    client = create_client(supabase_url, supabase_key)

    # Country codes to sync: CLI args or all known
    if len(sys.argv) > 1:
        codes = [arg.upper() for arg in sys.argv[1:]]
        logger.info(f"Syncing specific countries: {codes}")
    else:
        codes = ALL_COUNTRY_CODES
        logger.info(f"Syncing all {len(codes)} countries...")

    total = 0
    for cc in codes:
        try:
            n = sync_country(client, cc)
            total += n
        except Exception as e:
            logger.error(f"[{cc}] Error: {e}")

    logger.info(f"Sync complete: {total} packages synced across {len(codes)} countries")


if __name__ == "__main__":
    main()