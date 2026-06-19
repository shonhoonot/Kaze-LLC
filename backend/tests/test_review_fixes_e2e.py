"""Regression tests for review fixes (CSV import, refund sync, JPY unit price)."""
import io


def _buy_one(client, headers):
    p = client.get("/products?page=1&page_size=1").json()["items"][0]
    client.post("/cart/items", headers=headers, json={"product_id": p["id"], "qty": 1})
    return client.post(
        "/orders", headers=headers, json={"delivery_address": "УБ", "delivery_phone": "9"}
    ).json()


def test_csv_import_bad_row_does_not_abort_batch(client, admin_headers):
    # row 2 valid; row 3 has a non-numeric price -> reported, valid row still saved
    csv = (
        "title_mn,base_price_jpy,weight_grams\n"
        "Зөв бараа,1000,300\n"
        "Буруу бараа,notanumber,300\n"
    )
    res = client.post(
        "/admin/products/import",
        headers=admin_headers,
        files={"file": ("p.csv", io.BytesIO(csv.encode()), "text/csv")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == 1
    assert len(body["errors"]) == 1
    assert "мөр 3" in body["errors"][0]


def test_refund_syncs_payment_status(client, login, admin_headers):
    h = login("+97696300001")
    order = _buy_one(client, h)
    client.patch(f"/admin/orders/{order['id']}/status", headers=admin_headers, json={"status": "PAID"})
    refunded = client.patch(
        f"/admin/orders/{order['id']}/status", headers=admin_headers, json={"status": "REFUNDED"}
    ).json()
    assert refunded["status"] == "REFUNDED"
    assert refunded["payment_status"] == "refunded"


def test_order_unit_price_is_jpy_not_mnt(client, login):
    h = login("+97696300002")
    order = _buy_one(client, h)
    item = order["items"][0]
    # qty 1 -> per-unit all-in JPY equals the line total JPY (no MNT inflation)
    assert item["unit_price_jpy"] == item["line_total_jpy"]
    # sanity: JPY total is far smaller than the MNT total (~22x)
    assert item["unit_price_jpy"] < order["total_mnt"]
