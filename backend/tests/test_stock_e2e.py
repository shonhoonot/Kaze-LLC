"""End-to-end tests for out-of-stock enforcement."""


def _a_product(client):
    return client.get("/products?page=1&page_size=1").json()["items"][0]


def _set_stock(client, admin_headers, product_id, in_stock):
    client.patch(f"/admin/products/{product_id}", headers=admin_headers, json={"in_stock": in_stock})


def test_cannot_add_out_of_stock_to_cart(client, login, admin_headers):
    pid = _a_product(client)["id"]
    _set_stock(client, admin_headers, pid, False)
    h = login("+97695800001")
    r = client.post("/cart/items", headers=h, json={"product_id": pid, "qty": 1})
    assert r.status_code == 400
    assert "дууссан" in r.json()["detail"]


def test_checkout_blocked_when_item_goes_out_of_stock(client, login, admin_headers):
    pid = _a_product(client)["id"]
    h = login("+97695800002")
    # add while in stock
    assert client.post("/cart/items", headers=h, json={"product_id": pid, "qty": 1}).status_code == 200
    # it sells out before checkout
    _set_stock(client, admin_headers, pid, False)
    r = client.post("/orders", headers=h, json={"delivery_address": "УБ", "delivery_phone": "99"})
    assert r.status_code == 400
    assert "дууссан" in r.json()["detail"]
    # back in stock -> checkout succeeds
    _set_stock(client, admin_headers, pid, True)
    assert client.post("/orders", headers=h, json={"delivery_address": "УБ", "delivery_phone": "99"}).status_code == 201


def test_reorder_skips_out_of_stock(client, login, admin_headers):
    items = client.get("/products?page=1&page_size=3").json()["items"]
    h = login("+97695800003")
    for p in items[:2]:
        client.post("/cart/items", headers=h, json={"product_id": p["id"], "qty": 1})
    order = client.post("/orders", headers=h, json={"delivery_address": "УБ", "delivery_phone": "9"}).json()
    _set_stock(client, admin_headers, items[0]["id"], False)
    res = client.post(f"/cart/reorder/{order['id']}", headers=h).json()
    assert res["added"] == 1
    assert res["skipped"] == 1
