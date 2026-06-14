"""Tests for the URL product scraper's HTML parsing (no network)."""
from app.models import ProductSource
from app.services.scraper import guess_source, parse_product

JSONLD = """
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"テスト商品",
 "brand":{"@type":"Brand","name":"UNIQLO"},
 "image":["https://img.example.jp/a.jpg","https://img.example.jp/b.jpg"],
 "offers":{"@type":"Offer","price":"4990","priceCurrency":"JPY"}}
</script></head><body>x</body></html>
"""

OG = """
<html><head>
<meta property="og:title" content="OG Product Name"/>
<meta property="og:image" content="https://img/og.jpg"/>
<meta property="og:site_name" content="Rakuten"/>
<meta property="product:price:amount" content="29.99"/>
<meta property="product:price:currency" content="USD"/>
<title>fallback</title></head><body></body></html>
"""


def test_jsonld_extraction():
    r = parse_product(JSONLD, "https://www.uniqlo.com/jp/ja/products/E123")
    assert r["brand"] == "UNIQLO"
    assert r["base_price_jpy"] == 4990
    assert r["image_url"] == "https://img.example.jp/a.jpg"
    assert r["source"] == ProductSource.uniqlo
    assert r["note"] is None


def test_opengraph_fallback_and_currency_note():
    r = parse_product(OG, "https://item.rakuten.co.jp/shop/xyz")
    assert r["title_ja"] == "OG Product Name"
    assert r["base_price_jpy"] == 30  # rounded from 29.99
    assert "USD" in (r["note"] or "")
    assert r["source"] == ProductSource.other


def test_title_tag_fallback_only():
    html = "<html><head><title>Amazon | XYZ</title></head><body></body></html>"
    r = parse_product(html, "https://www.amazon.co.jp/dp/B0XXXX")
    assert "XYZ" in r["title_ja"]
    assert r["base_price_jpy"] is None
    assert r["source"] == ProductSource.amazon_jp


def test_guess_source_subdomain():
    assert guess_source("https://www.gu-global.com/jp/x") == ProductSource.gu
    assert guess_source("https://example.com/x") == ProductSource.other
