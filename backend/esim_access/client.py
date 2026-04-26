"""
eSIM Access API - Core HTTP Client
=====================================
Handles all low-level HTTP communication with the eSIM Access API.
Rate Limit: 8 requests/second (enforced by RateLimiter).
Base URL: https://api.esimaccess.com
Auth: RT-AccessCode header
"""

import os
import time
import logging
import threading
import requests
from typing import Any, Optional
from dataclasses import dataclass

# ── Logging Setup ─────────────────────────────────────────────────────────────
logger = logging.getLogger("esim_access.client")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


# ── Exceptions ────────────────────────────────────────────────────────────────
class ESIMAccessError(Exception):
    """Base exception for all eSIM Access API errors."""
    def __init__(self, message: str, error_code: Optional[int] = None, raw: Optional[dict] = None):
        super().__init__(message)
        self.error_code = error_code
        self.raw = raw


class ESIMAuthError(ESIMAccessError):
    """Raised when authentication fails."""


class ESIMRateLimitError(ESIMAccessError):
    """Raised when rate limit is exceeded."""


class ESIMNotFoundError(ESIMAccessError):
    """Raised when a resource is not found."""


class ESIMOrderPendingError(ESIMAccessError):
    """Raised when SM-DP+ is still allocating profiles (error code 200010)."""


class ESIMTimeoutError(ESIMAccessError):
    """Raised when a request times out."""


# ── Rate Limiter (Token Bucket) ───────────────────────────────────────────────
class RateLimiter:
    """
    Thread-safe token bucket rate limiter.
    Allows at most `rate` requests per `period` seconds.
    eSIM Access allows 8 req/second.
    """
    def __init__(self, rate: int = 8, period: float = 1.0):
        self.rate = rate
        self.period = period
        self._tokens = float(rate)
        self._last_check = time.monotonic()
        self._lock = threading.Lock()

    def acquire(self) -> None:
        with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_check
            self._tokens = min(self.rate, self._tokens + elapsed * (self.rate / self.period))
            self._last_check = now
            if self._tokens < 1:
                sleep_time = (1 - self._tokens) / (self.rate / self.period)
                logger.debug(f"Rate limit: sleeping {sleep_time:.3f}s")
                time.sleep(sleep_time)
                self._tokens = 0
            else:
                self._tokens -= 1


# ── API Response Dataclass ────────────────────────────────────────────────────
@dataclass
class APIResponse:
    success: bool
    error_code: Optional[int]
    error_message: Optional[str]
    obj: Optional[Any]
    raw: dict


# ── Main Client ───────────────────────────────────────────────────────────────
class ESIMAccessClient:
    """
    Thread-safe HTTP client for the eSIM Access API.

    Usage:
        client = ESIMAccessClient()
        response = client.post("/api/v1/open/balance/query")

    Config via environment variables:
        ESIM_ACCESS_CODE  - Your RT-AccessCode from the eSIM Access dashboard
        ESIM_BASE_URL     - API base URL (default: https://api.esimaccess.com)
        ESIM_TIMEOUT      - Request timeout in seconds (default: 30)
    """

    BASE_URL: str = "https://api.esimaccess.com"

    def __init__(self):
        self.access_code: str = os.environ.get("ESIM_ACCESS_CODE", "")
        if not self.access_code:
            raise ESIMAuthError(
                "ESIM_ACCESS_CODE environment variable is not set. "
                "Please set it before instantiating ESIMAccessClient."
            )

        self.base_url: str = os.environ.get("ESIM_BASE_URL", self.BASE_URL).rstrip("/")
        self.timeout: int = int(os.environ.get("ESIM_TIMEOUT", "30"))

        self._session = requests.Session()
        self._session.headers.update({
            "RT-AccessCode": self.access_code,
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

        self._rate_limiter = RateLimiter(rate=8, period=1.0)
        logger.info(f"ESIMAccessClient initialized. Base URL: {self.base_url}")

    def _url(self, path: str) -> str:
        return f"{self.base_url}/{path.lstrip('/')}"

    def _parse_response(self, raw: dict) -> APIResponse:
        """Parse the standard eSIM Access API response envelope."""
        success = raw.get("success", False)
        error_code = raw.get("errorCode")
        error_message = raw.get("errorMessage")
        obj = raw.get("obj")
        return APIResponse(
            success=success,
            error_code=error_code,
            error_message=error_message,
            obj=obj,
            raw=raw,
        )

    def post(self, path: str, payload: Optional[dict] = None) -> APIResponse:
        """
        Execute a POST request to the given API path.
        All eSIM Access endpoints use POST.

        Args:
            path: API endpoint path (e.g. "/api/v1/open/balance/query")
            payload: Optional JSON body dict

        Returns:
            APIResponse dataclass

        Raises:
            ESIMAuthError, ESIMRateLimitError, ESIMOrderPendingError,
            ESIMTimeoutError, ESIMAccessError
        """
        url = self._url(path)
        payload = payload or {}

        # Enforce rate limit
        self._rate_limiter.acquire()

        logger.info(f"POST {url} | payload keys: {list(payload.keys())}")

        try:
            response = self._session.post(url, json=payload, timeout=self.timeout)
        except requests.Timeout:
            logger.error(f"Timeout reaching {url}")
            raise ESIMTimeoutError(f"Request to {url} timed out after {self.timeout}s")
        except requests.ConnectionError as exc:
            logger.error(f"Connection error reaching {url}: {exc}")
            raise ESIMAccessError(f"Connection error: {exc}")
        except requests.RequestException as exc:
            logger.error(f"Unexpected request error: {exc}")
            raise ESIMAccessError(f"Request failed: {exc}")

        # Handle HTTP-level errors
        if response.status_code == 401:
            raise ESIMAuthError("Invalid or missing RT-AccessCode.", raw=response.text)
        if response.status_code == 429:
            raise ESIMRateLimitError("API rate limit exceeded (429).")
        if response.status_code >= 500:
            logger.error(f"Server error {response.status_code}: {response.text[:300]}")
            raise ESIMAccessError(f"Server error {response.status_code}: {response.text[:300]}")

        try:
            raw = response.json()
        except ValueError:
            raise ESIMAccessError(f"Non-JSON response from {url}: {response.text[:300]}")

        parsed = self._parse_response(raw)

        # Check application-level errors
        if not parsed.success:
            ec = parsed.error_code
            em = parsed.error_message or "Unknown error"

            if ec == 200010:
                # SM-DP+ still allocating – caller should retry/poll
                raise ESIMOrderPendingError(
                    f"SM-DP+ is still allocating profiles for this order. Retry shortly.",
                    error_code=ec, raw=raw
                )

            logger.warning(f"API error {ec}: {em} | path={path}")
            raise ESIMAccessError(f"API error [{ec}]: {em}", error_code=ec, raw=raw)

        logger.info(f"POST {url} -> success")
        return parsed
