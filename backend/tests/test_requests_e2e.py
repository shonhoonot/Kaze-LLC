"""End-to-end tests for customer product requests + admin queue."""
import pytest

FAKE_SCRAPE = {
    "source": "amazon_jp",
    "source_url": "https://www.amazon.co.jp/dp/B0TEST",
    "title_ja": "テスト商品",
    "title_mn": "テスト商品",
    "brand": "TestBrand",
    "base_price_jpy": 3200,
    "image_url": "https://img/x.jpg",
    "weight_grams": 500,
    "fetched": True,
    "note": None,
}


@pytest.fixture(autouse=True)
def _no_network(monkeypatch):
    # avoid real HTTP from the scraper inside the request endpoint
    monkeypatch.setattr("app.routers.requests.fetch_product", lambda url: dict(FAKE_SCRAPE))


def test_create_request_snapshots_scrape(client, login):
    h = login("+97695400001")
    r = client.post(
        "/requests", headers=h, json={"url": "https://www.amazon.co.jp/dp/B0TEST", "note": "M размер, хар өнгө"}
    )
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "pending"
    assert body["title"] == "テスト商品"
    assert body["est_price_jpy"] == 3200
    assert body["source"] == "amazon_jp"
    assert body["note"] == "M размер, хар өнгө"


def test_invalid_url_rejected(client, login):
    h = login("+97695400002")
    assert client.post("/requests", headers=h, json={"url": "not-a-url"}).status_code == 400


def test_list_is_per_user(client, login):
    owner = login("+97695400003")
    client.post("/requests", headers=owner, json={"url": "https://x.jp/1"})
    other = login("+97695400004")
    assert client.get("/requests", headers=owner).json()  # non-empty
    assert client.get("/requests", headers=other).json() == []


def test_admin_quote_flow_notifies_customer(client, login, admin_headers):
    h = login("+97695400005")
    req = client.post("/requests", headers=h, json={"url": "https://x.jp/2"}).json()

    # admin sees it under pending
    pending = client.get("/admin/requests?status=pending", headers=admin_headers).json()
    assert any(r["id"] == req["id"] for r in pending)

    # admin quotes
    updated = client.patch(
        f"/admin/requests/{req['id']}",
        headers=admin_headers,
        json={"status": "quoted", "admin_note": "Үнэ 95000₮", "quoted_price_mnt": 95000},
    ).json()
    assert updated["status"] == "quoted"
    assert updated["quoted_price_mnt"] == 95000

    # customer sees the quote on their own list
    mine = client.get("/requests", headers=h).json()
    assert mine[0]["status"] == "quoted"
    assert mine[0]["admin_note"] == "Үнэ 95000₮"

    # and got a notification
    notifs = client.get("/notifications", headers=h).json()
    assert notifs["unread"] >= 1
    assert any("үнийн санал" in n["title"] for n in notifs["items"])


def test_admin_status_filter(client, login, admin_headers):
    h = login("+97695400006")
    req = client.post("/requests", headers=h, json={"url": "https://x.jp/3"}).json()
    client.patch(f"/admin/requests/{req['id']}", headers=admin_headers, json={"status": "rejected"})
    rejected = client.get("/admin/requests?status=rejected", headers=admin_headers).json()
    assert any(r["id"] == req["id"] for r in rejected)
    pending = client.get("/admin/requests?status=pending", headers=admin_headers).json()
    assert all(r["id"] != req["id"] for r in pending)
