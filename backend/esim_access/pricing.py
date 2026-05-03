import os
import logging
import time
from typing import Dict, Optional, Any, Set
from supabase import create_client, Client

logger = logging.getLogger("esim_access.pricing")

REGION_CODES = {
    "EUROPE": {
        "AL", "AD", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK",
        "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "LI",
        "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT",
        "RO", "RS", "SE", "SI", "SK", "SM", "TR", "UA", "VA",
    },
    "ASIA": {
        "AM", "AZ", "BD", "BN", "BT", "CN", "GE", "HK", "ID", "IN", "JP", "KH",
        "KR", "KZ", "LA", "LK", "MM", "MN", "MO", "MY", "NP", "PH", "PK", "SG",
        "TH", "TW", "UZ", "VN",
    },
    "MIDDLE EAST & AFRICA": {
        "AE", "AO", "BH", "BW", "CI", "CM", "DZ", "EG", "ET", "GH", "IL", "IQ",
        "JO", "KE", "KW", "LB", "MA", "ML", "MZ", "NG", "OM", "QA", "SA", "SN",
        "TN", "TZ", "UG", "ZA", "ZM", "ZW",
    },
    "AMERICAS": {
        "AR", "BO", "BR", "CA", "CL", "CO", "CR", "DO", "EC", "GT", "HN", "JM",
        "MX", "NI", "PA", "PE", "PR", "PY", "SV", "TT", "US", "UY", "VE",
    },
}


def _normalize_region(value: str) -> str:
    return value.strip().upper().replace("-", " ").replace("_", " ")


def _regions_for_locations(region_or_locations: str, country_code: str) -> Set[str]:
    values = {
        _normalize_region(part)
        for part in (region_or_locations or "").split(",")
        if part.strip() and not part.strip().startswith("!")
    }
    if country_code:
        values.add(country_code.upper())

    if "GLOBAL" in values or "GL" in values:
        return {"GLOBAL"}

    matched = {
        region_name
        for region_name, codes in REGION_CODES.items()
        if values and values.issubset(codes)
    }
    return matched or values

class PricingManager:
    """
    Manages eSIM pricing rules from Supabase.
    Caches rules for 1 hour to minimize DB calls.
    """
    _instance = None
    _rules = []
    _last_fetch = 0
    _cache_ttl = 3600  # 1 hour

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PricingManager, cls).__new__(cls)
            cls._instance.supabase_url = os.getenv("SUPABASE_URL")
            cls._instance.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
            if cls._instance.supabase_url and cls._instance.supabase_key:
                cls._instance.client: Optional[Client] = create_client(
                    cls._instance.supabase_url, cls._instance.supabase_key
                )
            else:
                cls._instance.client = None
                logger.warning("Supabase credentials missing in backend/.env. Pricing overrides will not work.")
        return cls._instance

    def _fetch_rules(self, force: bool = False):
        now = time.time()
        if not force and self._rules and (now - self._last_fetch < self._cache_ttl):
            return

        if not self.client:
            return

        try:
            response = self.client.table("esim_pricing").select("*").eq("is_active", True).execute()
            self._rules = response.data
            self._last_fetch = now
            logger.info(f"Fetched {len(self._rules)} pricing rules from Supabase.")
        except Exception as e:
            logger.error(f"Failed to fetch pricing rules: {e}")

    def get_selling_price(self, package_code: str, country_code: str, region: str, api_price: int) -> int:
        """
        Calculates the selling price based on the most specific rule.
        Priority: Package > Country > Region > Global
        """
        self._fetch_rules()
        
        # 1. Check Package rule
        pkg_rule = next((r for r in self._rules if r["target_type"] == "package" and r["target_id"] == package_code), None)
        if pkg_rule:
            return self._apply_rule(pkg_rule, api_price)

        # 2. Check Country rule
        country_rule = next((r for r in self._rules if r["target_type"] == "country" and r["target_id"].upper() == country_code.upper()), None)
        if country_rule:
            return self._apply_rule(country_rule, api_price)

        # 3. Check Region rule. Regional packages usually arrive as comma-separated
        # country codes, so map those codes to the admin-facing region names.
        package_regions = _regions_for_locations(region, country_code)
        region_rule = next((
            r for r in self._rules
            if r["target_type"] == "region"
            and _normalize_region(r.get("target_id") or "") in package_regions
        ), None)
        if region_rule:
            return self._apply_rule(region_rule, api_price)

        # 4. Check Global rule
        global_rule = next((r for r in self._rules if r["target_type"] == "global"), None)
        if global_rule:
            return self._apply_rule(global_rule, api_price)

        # Fallback to default 1.75 margin if no rules found
        return int(api_price * 1.75)

    def _apply_rule(self, rule: Dict[str, Any], api_price: int) -> int:
        if rule.get("fixed_price") is not None:
            return rule["fixed_price"]
        
        margin = rule.get("margin", 1.75)
        return int(api_price * margin)

# Singleton instance
pricing_manager = PricingManager()
