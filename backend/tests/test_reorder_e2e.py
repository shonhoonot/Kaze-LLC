"""End-to-end tests for reordering a past order into the cart."""


def _order_with_items(client, headers, qtys):
    items = client.get("/products?page=1&page_size=10").json()["items"]
    for product, qty in zip(items, qtys):
        client.post("/cart/items", headers=headers, json={"product_id": product["id"], "qty": qty})
    order = client.post(
        "/orders", headers=headers, json={"delivery_address": "УБ", "delivery_phone": "99"}
    ).json()
    return order, items


def test_reorder_readds_items(client, login):
    h = login("+97695500001")
    order, _ = _order_with_items(client, h, [2, 1])
    # cart is empty after ordering
    assert client.get("/cart", headers=h).json()["lines"] == []

    res = client.post(f"/cart/reorder/{order['id']}", headers=h).json()
    assert res["added"] == 2
    assert res["skipped"] == 0
    lines = res["cart"]["lines"]
    assert len(lines) == 2
    assert {l["qty"] for l in lines} == {2, 1}


def test_reorder_merges_into_existing_cart(client, login):
    h = login("+97695500002")
    order, items = _order_with_items(client, h, [1])
    # put the same product in the cart again before reordering
    client.post("/cart/items", headers=h, json={"product_id": items[0]["id"], "qty": 3})
    res = client.post(f"/cart/reorder/{order['id']}", headers=h).json()
    line = next(l for l in res["cart"]["lines"] if l["product_id"] == items[0]["id"])
    assert line["qty"] == 4  # 3 in cart + 1 from the order


def test_reorder_skips_inactive_products(client, login, admin_headers):
    h = login("+97695500003")
    order, items = _order_with_items(client, h, [1, 1])
    # admin deactivates the first product
    client.delete(f"/admin/products/{items[0]['id']}", headers=admin_headers)
    res = client.post(f"/cart/reorder/{order['id']}", headers=h).json()
    assert res["added"] == 1
    assert res["skipped"] == 1


def test_cannot_reorder_another_users_order(client, login):
    owner = login("+97695500004")
    order, _ = _order_with_items(client, owner, [1])
    intruder = login("+97695500005")
    assert client.post(f"/cart/reorder/{order['id']}", headers=intruder).status_code == 404
