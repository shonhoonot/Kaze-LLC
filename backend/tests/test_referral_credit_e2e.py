"""Logic tests for referral-credit redemption and payment guards."""
from sqlalchemy import select

from app.database import SessionLocal
from app.models import User


def _set_credit(phone, amount):
    db = SessionLocal()
    try:
        u = db.scalar(select(User).where(User.phone == phone))
        u.referral_credit_jpy = amount
        db.commit()
    finally:
        db.close()


def _buy(client, headers, qty=1):
    p = client.get("/products?page=1&page_size=1").json()["items"][0]
    client.post("/cart/items", headers=headers, json={"product_id": p["id"], "qty": qty})
    return client.post(
        "/orders", headers=headers, json={"delivery_address": "УБ", "delivery_phone": "9"}
    ).json()


def test_referral_credit_is_redeemed_and_decremented(client, login):
    phone = "+97696400001"
    h = login(phone)
    # baseline order total (no credit)
    base = _buy(client, h)
    base_total = base["total_jpy"]

    # grant credit and place a second order
    _set_credit(phone, 300)
    o = _buy(client, h)
    assert o["discount_jpy"] >= 300
    assert o["total_jpy"] == base_total - 300

    # credit balance is now zero
    me = client.get("/auth/me", headers=h).json()
    assert me["referral_credit_jpy"] == 0


def test_credit_capped_at_order_total(client, login):
    phone = "+97696400002"
    h = login(phone)
    _set_credit(phone, 99_999_999)  # absurdly large
    o = _buy(client, h)
    assert o["total_jpy"] == 0  # fully covered, never negative
    me = client.get("/auth/me", headers=h).json()
    # only the used portion is deducted, remainder kept
    assert me["referral_credit_jpy"] == 99_999_999 - (o["discount_jpy"])


def test_cannot_invoice_a_cancelled_order(client, login):
    h = login("+97696400003")
    order = _buy(client, h)
    client.post(f"/orders/{order['id']}/cancel", headers=h, json={})
    res = client.post("/payments/qpay/create-invoice", headers=h, json={"order_id": order["id"]})
    assert res.status_code == 400
    assert "Цуцлагдсан" in res.json()["detail"]
