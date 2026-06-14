"""End-to-end coupon flow through the HTTP API."""


def _add_pricey_item(client, headers):
    """Add an item with a high-enough subtotal to clear coupon minimums."""
    items = client.get("/products?page=1&page_size=20").json()["items"]
    product = max(items, key=lambda p: p["base_price_jpy"])
    client.post("/cart/items", headers=headers, json={"product_id": product["id"], "qty": 3})
    return client.get("/cart", headers=headers).json()


def test_admin_create_and_validation_rules(client, admin_headers):
    # duplicate code rejected (WELCOME10 is seeded)
    dup = client.post("/admin/coupons", headers=admin_headers, json={"code": "welcome10", "value": 5})
    assert dup.status_code == 409
    # percent > 100 rejected
    bad = client.post("/admin/coupons", headers=admin_headers, json={"code": "BAD", "value": 150})
    assert bad.status_code == 400
    # valid creation, code is upper-cased
    ok = client.post(
        "/admin/coupons",
        headers=admin_headers,
        json={"code": "save5", "discount_type": "fixed_jpy", "value": 500},
    )
    assert ok.status_code == 201
    assert ok.json()["code"] == "SAVE5"


def test_validate_and_apply_percent_coupon(client, admin_headers, login):
    headers = login("+97695000001", "Болд")
    cart = _add_pricey_item(client, headers)
    subtotal = cart["subtotal_jpy"]

    preview = client.post("/coupons/validate", headers=headers, json={"code": "welcome10"}).json()
    assert preview["valid"] is True
    expected = min(round(subtotal * 0.10), 1000)  # seeded: 10%, cap ¥1000
    assert preview["discount_jpy"] == expected

    order = client.post(
        "/orders",
        headers=headers,
        json={"delivery_address": "УБ", "delivery_phone": "99", "coupon_code": "welcome10"},
    ).json()
    assert order["discount_jpy"] == expected
    assert order["coupon_code"] == "WELCOME10"
    assert order["total_jpy"] == order["subtotal_jpy"] + order["markup_jpy"] + order["service_fee_jpy"] + order["shipping_fee_jpy"] - expected

    # used_count incremented
    listed = client.get("/admin/coupons", headers=admin_headers).json()
    welcome = next(c for c in listed if c["code"] == "WELCOME10")
    assert welcome["used_count"] == 1


def test_invalid_code_is_rejected(client, login):
    headers = login("+97695000002")
    _add_pricey_item(client, headers)
    res = client.post("/coupons/validate", headers=headers, json={"code": "NOPE"}).json()
    assert res["valid"] is False
    assert "олдсонгүй" in res["message"]


def test_min_subtotal_enforced_at_validate_and_order(client, admin_headers, login):
    client.post(
        "/admin/coupons",
        headers=admin_headers,
        json={"code": "BIG", "value": 10, "min_subtotal_jpy": 99_999_999},
    )
    headers = login("+97695000003")
    items = client.get("/products?page=1&page_size=20").json()["items"]
    cheapest = min(items, key=lambda p: p["base_price_jpy"])
    client.post("/cart/items", headers=headers, json={"product_id": cheapest["id"], "qty": 1})

    preview = client.post("/coupons/validate", headers=headers, json={"code": "BIG"}).json()
    assert preview["valid"] is False
    assert "дээш" in preview["message"]

    order = client.post(
        "/orders",
        headers=headers,
        json={"delivery_address": "x", "delivery_phone": "9", "coupon_code": "BIG"},
    )
    assert order.status_code == 400


def test_inactive_coupon_rejected(client, admin_headers, login):
    created = client.post(
        "/admin/coupons", headers=admin_headers, json={"code": "OFFNOW", "value": 5}
    ).json()
    client.patch(f"/admin/coupons/{created['id']}", headers=admin_headers, json={"is_active": False})

    headers = login("+97695000004")
    _add_pricey_item(client, headers)
    res = client.post("/coupons/validate", headers=headers, json={"code": "OFFNOW"}).json()
    assert res["valid"] is False
    assert "идэвхгүй" in res["message"]


def test_usage_limit_blocks_second_use(client, admin_headers, login):
    client.post(
        "/admin/coupons",
        headers=admin_headers,
        json={"code": "ONCE", "discount_type": "fixed_jpy", "value": 300, "usage_limit": 1},
    )

    h1 = login("+97695000005")
    _add_pricey_item(client, h1)
    o1 = client.post(
        "/orders",
        headers=h1,
        json={"delivery_address": "a", "delivery_phone": "1", "coupon_code": "ONCE"},
    )
    assert o1.status_code == 201
    assert o1.json()["discount_jpy"] == 300

    h2 = login("+97695000006")
    _add_pricey_item(client, h2)
    res = client.post("/coupons/validate", headers=h2, json={"code": "ONCE"}).json()
    assert res["valid"] is False
    assert "дууссан" in res["message"]
