"""Live JPY→MNT exchange rate lookup.

Uses a public rates API (default open.er-api.com with base JPY, whose
`rates.MNT` is already the JPY→MNT rate). Never used silently in pricing —
an admin explicitly refreshes the stored rate. Degrades gracefully when the
network is blocked or the response is malformed.
"""
from __future__ import annotations

import httpx

from app.config import settings

DEFAULT_URL = "https://open.er-api.com/v6/latest/JPY"


class FxError(ValueError):
    """Raised when a live rate cannot be fetched."""


def fetch_live_rate() -> float:
    """Return the current JPY→MNT rate. Raises FxError on any failure."""
    url = settings.fx_live_api_url or DEFAULT_URL
    headers = {}
    if settings.fx_live_api_key:
        headers["Authorization"] = f"Bearer {settings.fx_live_api_key}"
    try:
        resp = httpx.get(url, headers=headers, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:  # network blocked, non-2xx, bad JSON
        raise FxError(f"Ханш татаж чадсангүй ({type(exc).__name__})") from exc

    rate = _extract_rate(data)
    if rate is None or rate <= 0:
        raise FxError("Хариунаас JPY→MNT ханш олдсонгүй")
    return round(float(rate), 4)


def _extract_rate(data: dict) -> float | None:
    """Pull the JPY→MNT rate from a few common response shapes."""
    if not isinstance(data, dict):
        return None
    rates = data.get("rates") or data.get("conversion_rates")
    if isinstance(rates, dict) and rates.get("MNT") is not None:
        return rates["MNT"]
    # direct field fallbacks
    for key in ("jpy_mnt", "JPY_MNT", "rate"):
        if data.get(key) is not None:
            return data[key]
    return None
