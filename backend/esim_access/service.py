"""
eSIM Access API - Service Layer
==================================
High-level, domain-driven service methods built on top of ESIMAccessClient.
Each public method corresponds to a specific business operation.

Endpoints covered:
  1. Query Data Packages  -> /api/v1/open/package/list
  2. Order eSIM Profiles  -> /api/v1/open/esim/order
  3. Query eSIM Status    -> /api/v1/open/esim/query
  4. Query Balance        -> /api/v1/open/balance/query
  5. Top Up eSIM          -> /api/v1/open/esim/topup
  6. Cancel eSIM          -> /api/v1/open/esim/cancel
  7. Suspend eSIM         -> /api/v1/open/esim/suspend
  8. Unsuspend eSIM       -> /api/v1/open/esim/unsuspend
"""

import uuid
import logging
from typing import Optional

from .client import (
    ESIMAccessClient,
    APIResponse,
    ESIMOrderPendingError,
    ESIMAccessError,
)
from .pricing import pricing_manager

import time
import threading

logger = logging.getLogger("esim_access.service")


class ESIMService:
    """
    Business-level service for eSIM Access API operations.

    All methods return the parsed `obj` payload from the API response,
    or raise a descriptive exception on failure.

    Example:
        svc = ESIMService()
        packages = svc.list_packages(location_code="TR")
        order = svc.order_esim(package_code="JC016", count=1)
        esim_info = svc.get_esim_by_order(order["orderNo"])
        balance = svc.get_balance()
    """

    def __init__(self, client: Optional[ESIMAccessClient] = None):
        self._client = client or ESIMAccessClient()

    # ── 1. LIST PACKAGES ──────────────────────────────────────────────────────
    def list_packages(
        self,
        location_code: Optional[str] = None,
        package_type: str = "BASE",
    ) -> list:
        """
        Fetch all available eSIM data packages, optionally filtered by country.

        Args:
            location_code: ISO Alpha-2 country code (e.g. "TR", "DE", "JP").
                           Use None to get all packages.
                           Prefix with "!" to exclude  (e.g. "!GL" = exclude global).
            package_type: "BASE" for standard plans, "TOPUP" for top-up plans.

        Returns:
            List of package dicts from the API.
        """
        payload: dict = {"type": package_type}
        if location_code:
            payload["locationCode"] = location_code

        logger.info(f"Listing packages | location={location_code} type={package_type}")
        response: APIResponse = self._client.post(
            "/api/v1/open/package/list", payload
        )
        packages = (response.obj or {}).get("packageList", [])
        
        # Apply pricing rules
        for p in packages:
            # Extract basic info for pricing
            pkg_code = p.get("packageCode", "")
            package_location = p.get("location") or ""
            locs = [l.strip().upper() for l in package_location.split(",") if l.strip()]
            country_code = locs[0] if len(locs) == 1 else ""
            
            api_price = p.get("price", 0)
            p["sellingPrice"] = pricing_manager.get_selling_price(pkg_code, country_code, package_location, api_price)

        logger.info(f"Fetched {len(packages)} packages")
        return packages

    def list_topup_packages(
        self,
        package_code: Optional[str] = None,
        slug: Optional[str] = None,
        iccid: Optional[str] = None,
    ) -> list:
        """
        Fetch available top-up plans for an existing eSIM.

        Provide one of: package_code, slug, or iccid.
        """
        if not any([package_code, slug, iccid]):
            raise ValueError("Provide at least one of: package_code, slug, or iccid")

        payload: dict = {"type": "TOPUP"}
        if package_code:
            payload["packageCode"] = package_code
        if slug:
            payload["slug"] = slug
        if iccid:
            payload["iccid"] = iccid

        logger.info(f"Listing top-up packages | package_code={package_code} slug={slug} iccid={iccid}")
        response = self._client.post("/api/v1/open/package/list", payload)
        return (response.obj or {}).get("packageList", [])

    # ── 2. ORDER eSIM ─────────────────────────────────────────────────────────
    def order_esim(
        self,
        package_code: Optional[str] = None,
        slug: Optional[str] = None,
        count: int = 1,
        price: Optional[int] = None,
        period_num: Optional[int] = None,
        transaction_id: Optional[str] = None,
    ) -> dict:
        """
        Place a new eSIM order (single or batch).

        Args:
            package_code: The package code (e.g. "JC016"). Use either this OR slug.
            slug: Alternative package identifier (e.g. "AU_1_7").
            count: Number of eSIM profiles to order. Max 30 per batch.
            price: Optional price verification in smallest currency unit (e.g. 10000 = $1.00 USD).
            period_num: For day-pass plans, the number of days.
            transaction_id: Unique ID for idempotency. Auto-generated if not provided.

        Returns:
            dict with "orderNo" key.

        Raises:
            ValueError if neither package_code nor slug is provided.
            ESIMAccessError on API failure.
        """
        if not package_code and not slug:
            raise ValueError("Provide either package_code or slug to place an order.")

        txn_id = transaction_id or str(uuid.uuid4())

        package_info: dict = {"count": count}
        if package_code:
            package_info["packageCode"] = package_code
        if slug:
            package_info["slug"] = slug
        if price is not None:
            package_info["price"] = price
        if period_num is not None:
            package_info["periodNum"] = period_num

        payload: dict = {
            "transactionId": txn_id,
            "packageInfoList": [package_info],
        }
        if price is not None:
            payload["amount"] = price * count

        logger.info(
            f"Ordering eSIM | txn={txn_id} package_code={package_code} "
            f"slug={slug} count={count} period_num={period_num}"
        )

        response = self._client.post("/api/v1/open/esim/order", payload)
        order_no = (response.obj or {}).get("orderNo")
        logger.info(f"Order placed successfully | orderNo={order_no} txn={txn_id}")
        return {"orderNo": order_no, "transactionId": txn_id}

    # ── 3. GET eSIM BY ORDER NUMBER ───────────────────────────────────────────
    def get_esim_by_order(self, order_no: str) -> list:
        """
        Retrieve allocated eSIM profiles for a given order number.

        IMPORTANT: SM-DP+ allocates profiles asynchronously. If profiles are
        not yet ready, this raises ESIMOrderPendingError (error code 200010).
        You should implement a polling loop or use the ORDER_STATUS webhook.

        Args:
            order_no: The order number returned by order_esim().

        Returns:
            List of eSIM profile dicts (each with qrCodeUrl, iccid, ac, etc.)

        Raises:
            ESIMOrderPendingError: Profiles not yet allocated, retry shortly.
        """
        logger.info(f"Fetching eSIM profiles | orderNo={order_no}")
        payload = {"orderNo": order_no}
        response = self._client.post("/api/v1/open/esim/query", payload)
        esim_list = (response.obj or {}).get("esimList", [])
        logger.info(f"Fetched {len(esim_list)} profile(s) for orderNo={order_no}")
        return esim_list

    # ── 4. GET eSIM STATUS ────────────────────────────────────────────────────
    def get_esim_status(
        self,
        esim_tran_no: Optional[str] = None,
        order_no: Optional[str] = None,
        iccid: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        page_size: int = 10,
        page_num: int = 1,
    ) -> dict:
        """
        Query status of one or more eSIM profiles (for existing/in-use eSIMs).

        Args:
            esim_tran_no: Unique eSIM transaction number (most reliable).
            order_no: Batch order number.
            iccid: ICCID of the eSIM (note: ICCIDs can be reused; prefer esim_tran_no).
            start_time: ISO 8601 UTC time (e.g. "2024-01-01T00:00+00:00")
            end_time: ISO 8601 UTC time
            page_size: Results per page (default 10)
            page_num: Page number (default 1)

        Returns:
            dict with "esimList", "pager" keys.
        """
        payload: dict = {
            "pager": {"pageSize": page_size, "pageNum": page_num}
        }
        if esim_tran_no:
            payload["esimTranNo"] = esim_tran_no
        if order_no:
            payload["orderNo"] = order_no
        if iccid:
            payload["iccid"] = iccid
        if start_time:
            payload["startTime"] = start_time
        if end_time:
            payload["endTime"] = end_time

        logger.info(f"Querying eSIM status | esim_tran_no={esim_tran_no} orderNo={order_no} iccid={iccid}")
        response = self._client.post("/api/v1/open/esim/query", payload)
        return response.obj or {}

    # ── 5. QUERY BALANCE ─────────────────────────────────────────────────────
    def get_balance(self) -> dict:
        """
        Query the current account balance.

        Returns:
            dict with "balance", "currencyCode", and "lastUpdated" (if available).
        """
        logger.info("Querying account balance")
        response = self._client.post("/api/v1/open/balance/query")
        return response.obj or {}

    # ── 6. TOP UP eSIM ───────────────────────────────────────────────────────
    def topup_esim(
        self,
        iccid: str,
        package_code: Optional[str] = None,
        slug: Optional[str] = None,
        transaction_id: Optional[str] = None,
    ) -> dict:
        """
        Add more data to an existing eSIM profile.

        Args:
            iccid: ICCID of the eSIM to top up.
            package_code: Top-up package code.
            slug: Alternative top-up package slug.
            transaction_id: Unique ID for idempotency.

        Returns:
            dict with order confirmation.
        """
        if not package_code and not slug:
            raise ValueError("Provide either package_code or slug for top-up.")

        txn_id = transaction_id or str(uuid.uuid4())
        payload: dict = {"iccid": iccid, "transactionId": txn_id}
        if package_code:
            payload["packageCode"] = package_code
        if slug:
            payload["slug"] = slug

        logger.info(f"Topping up eSIM | iccid={iccid} package_code={package_code} txn={txn_id}")
        response = self._client.post("/api/v1/open/esim/topup", payload)
        return response.obj or {}

    # ── 7. CANCEL eSIM ───────────────────────────────────────────────────────
    def cancel_esim(self, esim_tran_no: str) -> dict:
        """
        Cancel an eSIM profile and initiate a refund.

        Args:
            esim_tran_no: The eSIM transaction number to cancel.
        """
        logger.info(f"Cancelling eSIM | esimTranNo={esim_tran_no}")
        response = self._client.post(
            "/api/v1/open/esim/cancel", {"esimTranNo": esim_tran_no}
        )
        return response.obj or {}

    # ── 8. SUSPEND eSIM ──────────────────────────────────────────────────────
    def suspend_esim(self, esim_tran_no: str) -> dict:
        """Suspend an active eSIM profile."""
        logger.info(f"Suspending eSIM | esimTranNo={esim_tran_no}")
        response = self._client.post(
            "/api/v1/open/esim/suspend", {"esimTranNo": esim_tran_no}
        )
        return response.obj or {}

    # ── 9. UNSUSPEND eSIM ────────────────────────────────────────────────────
    def unsuspend_esim(self, esim_tran_no: str) -> dict:
        """Reactivate a suspended eSIM profile."""
        logger.info(f"Unsuspending eSIM | esimTranNo={esim_tran_no}")
        response = self._client.post(
            "/api/v1/open/esim/unsuspend", {"esimTranNo": esim_tran_no}
        )
        return response.obj or {}

    # ── OPTIMIZATION: CACHED COUNTRY GROUPS ──────────────────────────────────
    _cache_groups = None
    _cache_time = 0
    _cache_lock = threading.Lock()

    def get_country_groups(self, force_refresh: bool = False) -> dict:
        """
        Returns a summarized view of countries and regional packages.
        Optimized for the main AllPackages list.
        Caches for 1 hour to keep it extremely fast.
        """
        now = time.time()
        with self._cache_lock:
            if not force_refresh and self._cache_groups and (now - self._cache_time < 86400):
                return self._cache_groups

            logger.info("Refreshing country groups cache...")
            packages = self.list_packages(package_type="BASE")
            
            country_map = {}
            regional = []

            for p in packages:
                locs = [l.strip() for l in (p.get("location") or "").split(",") if l.strip()]
                if len(locs) == 1 and not locs[0].startswith("!"):
                    code = locs[0].upper()
                    if code not in country_map:
                        country_map[code] = {
                            "countryCode": code,
                            "packageCount": 0,
                            "cheapestPrice": p.get("price", 9999999),
                            "name": p.get("name", ""),
                            "speed": p.get("speed", "")
                        }
                    
                    c = country_map[code]
                    c["packageCount"] += 1
                    if p.get("price", 9999999) < c["cheapestPrice"]:
                        c["cheapestPrice"] = p["price"]
                        c["speed"] = p.get("speed", "")
                else:
                    # Simplify regional package for the list
                    regional.append({
                        "packageCode": p.get("packageCode"),
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "location": p.get("location"),
                        "volume": p.get("volume"),
                        "duration": p.get("duration"),
                        "durationUnit": p.get("durationUnit"),
                        "speed": p.get("speed"),
                        "sellingPrice": p.get("sellingPrice")
                    })

            result = {
                "countries": sorted(list(country_map.values()), key=lambda x: x["countryCode"]),
                "regional": regional,
                "count": len(packages)
            }
            
            self._cache_groups = result
            self._cache_time = now
            return result
