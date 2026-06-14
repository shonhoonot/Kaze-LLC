"""End-to-end tests for customer-initiated order cancellation."""


def _place_order(client, headers):
    items = client.get("/products?page=1&page_size=5").json()["items"]
    client.post("/cart/items", headers=headers, json={"product_id": items[0]["id"], "qty": 1})
    return client.post(
        "/orders", headers=headers, json={"delivery_address": "УБ", "delivery_phone": "99"}
    ).json()


def test_cancel_placed_order(client, login):
    h = login("+97695300001")
    order = _place_order(client, h)
    res = client.post(f"/orders/{order['id']}/cancel", headers=h, json={"reason": "Санаа өөрчлөгдсөн"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "CANCELLED"
    # cancellation reason captured in the timeline
    assert any("Санаа өөрчлөгдсөн" in (e["note"] or "") for e in body["events"])


def test_cancel_paid_order_marks_refund(client, login, admin_headers):
    h = login("+97695300002")
    order = _place_order(client, h)
    # admin marks it paid
    client.patch(f"/admin/orders/{order['id']}/status", headers=admin_headers, json={"status": "PAID"})
    res = client.post(f"/orders/{order['id']}/cancel", headers=h, json={}).json()
    assert res["status"] == "CANCELLED"
    assert res["payment_status"] == "refunded"


def test_cannot_cancel_after_purchasing(client, login, admin_headers):
    h = login("+97695300003")
    order = _place_order(client, h)
    client.patch(
        f"/admin/orders/{order['id']}/status", headers=admin_headers, json={"status": "PURCHASING_IN_JP"}
    )
    res = client.post(f"/orders/{order['id']}/cancel", headers=h, json={})
    assert res.status_code == 400


def test_cannot_cancel_another_users_order(client, login):
    owner = login("+97695300004")
    order = _place_order(client, owner)
    intruder = login("+97695300005")
    assert client.post(f"/orders/{order['id']}/cancel", headers=intruder, json={}).status_code == 404
