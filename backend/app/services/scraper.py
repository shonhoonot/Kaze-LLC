"""Best-effort product sourcing from a Japanese shop URL.

Dependency-free: fetches the page with httpx and extracts title / price /
image / brand from JSON-LD and OpenGraph/meta tags. Designed to degrade
gracefully — if the network is blocked or parsing finds nothing, it still
returns the source (guessed from the domain) and the URL so an admin can fill
the rest in by hand.
"""
from __future__ import annotations

import json
import re
from urllib.parse import urlparse

import httpx

from app.models import ProductSource

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

_SOURCE_DOMAINS: list[tuple[str, ProductSource]] = [
    ("amazon.co.jp", ProductSource.amazon_jp),
    ("amazon.jp", ProductSource.amazon_jp),
    ("uniqlo.com", ProductSource.uniqlo),
    ("gu-global.com", ProductSource.gu),
    ("gu.com", ProductSource.gu),
]

_JPY_CURRENCIES = {"", "JPY", "¥", "円", "JP¥"}


def guess_source(url: str) -> ProductSource:
    host = (urlparse(url).hostname or "").lower()
    for domain, source in _SOURCE_DOMAINS:
        if host == domain or host.endswith("." + domain):
            return source
    return ProductSource.other


def _meta(html: str, key: str) -> str | None:
    """Read a <meta property|name="key" content="..."> tag (either attr order)."""
    esc = re.escape(key)
    for pattern in (
        rf'<meta[^>]+(?:property|name)=["\']{esc}["\'][^>]+content=["\']([^"\']*)["\']',
        rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']{esc}["\']',
    ):
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            return m.group(1).strip() or None
    return None


def _iter_jsonld(html: str):
    for m in re.finditer(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        try:
            data = json.loads(m.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            continue
        nodes = data if isinstance(data, list) else [data]
        for node in nodes:
            if isinstance(node, dict) and "@graph" in node and isinstance(node["@graph"], list):
                yield from (n for n in node["@graph"] if isinstance(n, dict))
            elif isinstance(node, dict):
                yield node


def _is_product(node: dict) -> bool:
    t = node.get("@type")
    if isinstance(t, list):
        return any(str(x).lower() == "product" for x in t)
    return str(t).lower() == "product"


def _first(value):
    return value[0] if isinstance(value, list) and value else value


def _flatten_name(value) -> str | None:
    value = _first(value)
    if isinstance(value, dict):
        value = value.get("name")
    return str(value).strip() if value else None


def parse_product(html: str, url: str) -> dict:
    """Pull whatever we can out of the HTML. All fields are best-effort."""
    title: str | None = None
    brand: str | None = None
    image: str | None = None
    price: float | None = None
    currency: str = ""

    for node in _iter_jsonld(html):
        if not _is_product(node):
            continue
        title = title or _flatten_name(node.get("name"))
        brand = brand or _flatten_name(node.get("brand"))
        image = image or _first(node.get("image"))
        offers = _first(node.get("offers"))
        if isinstance(offers, dict):
            raw_price = offers.get("price") or offers.get("lowPrice")
            if raw_price is not None and price is None:
                try:
                    price = float(str(raw_price).replace(",", ""))
                    currency = str(offers.get("priceCurrency") or "").strip()
                except ValueError:
                    pass
        if title and image and price is not None:
            break

    # OpenGraph / meta fallbacks
    title = title or _meta(html, "og:title")
    if not title:
        m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        if m:
            title = re.sub(r"\s+", " ", m.group(1)).strip()
    image = image or _meta(html, "og:image")
    brand = brand or _meta(html, "og:site_name")

    if price is None:
        raw = _meta(html, "product:price:amount") or _meta(html, "og:price:amount")
        if raw:
            try:
                price = float(raw.replace(",", ""))
                currency = (
                    _meta(html, "product:price:currency")
                    or _meta(html, "og:price:currency")
                    or ""
                ).strip()
            except ValueError:
                pass

    base_price_jpy: int | None = None
    note: str | None = None
    if price is not None:
        if currency.upper() in {c.upper() for c in _JPY_CURRENCIES}:
            base_price_jpy = int(round(price))
        else:
            base_price_jpy = int(round(price))
            note = f"Үнэ {currency} валютаар олдсон — JPY эсэхийг шалгана уу"

    return {
        "source": guess_source(url),
        "source_url": url,
        "title_ja": title,
        "title_mn": title,  # admin translates/edits before saving
        "brand": brand,
        "base_price_jpy": base_price_jpy,
        "image_url": image,
        "weight_grams": 500,
        "note": note,
    }


def fetch_product(url: str) -> dict:
    """Fetch + parse. Never raises — returns a partial dict on any failure."""
    try:
        resp = httpx.get(
            url,
            headers={"User-Agent": _UA, "Accept-Language": "ja,en;q=0.8"},
            timeout=10.0,
            follow_redirects=True,
        )
        resp.raise_for_status()
        result = parse_product(resp.text, url)
        result["fetched"] = True
        return result
    except Exception as exc:  # network blocked, 4xx/5xx, bot-wall, etc.
        return {
            "source": guess_source(url),
            "source_url": url,
            "title_ja": None,
            "title_mn": None,
            "brand": None,
            "base_price_jpy": None,
            "image_url": None,
            "weight_grams": 500,
            "fetched": False,
            "note": f"Хуудсыг автоматаар уншиж чадсангүй ({type(exc).__name__}). Гараар бөглөнө үү.",
        }
