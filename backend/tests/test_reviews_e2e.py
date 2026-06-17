"""End-to-end tests for product reviews & ratings."""


def _first_product(client):
    """A product with no pre-existing (seeded) reviews, for deterministic counts."""
    items = client.get("/products?page=1&page_size=50").json()["items"]
    return next(p for p in items if p["review_count"] == 0)


def _buy(client, headers, product_id):
    client.post("/cart/items", headers=headers, json={"product_id": product_id, "qty": 1})
    client.post(
        "/orders", headers=headers, json={"delivery_address": "УБ", "delivery_phone": "99"}
    )


def test_empty_reviews_summary(client):
    pid = _first_product(client)["id"]
    data = client.get(f"/products/{pid}/reviews").json()
    assert data["summary"]["review_count"] == 0
    assert data["summary"]["avg_rating"] is None
    assert data["items"] == []


def test_upsert_is_idempotent_per_user(client, login):
    pid = _first_product(client)["id"]
    h = login("+97695200001", "Болд")
    client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 4, "comment": "Сайн"})
    # second post updates, does not duplicate
    r = client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 5, "comment": "Маш сайн"})
    assert r.status_code == 201
    assert r.json()["rating"] == 5

    data = client.get(f"/products/{pid}/reviews", headers=h).json()
    assert data["summary"]["review_count"] == 1
    assert data["summary"]["avg_rating"] == 5.0
    assert data["my_review"]["comment"] == "Маш сайн"
    assert data["my_review"]["author_name"] == "Болд"


def test_unverified_until_purchase(client, login):
    pid = _first_product(client)["id"]
    h = login("+97695200002")
    r = client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 4}).json()
    assert r["verified"] is False
    # purchase then re-review -> verified
    _buy(client, h, pid)
    r2 = client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 4}).json()
    assert r2["verified"] is True


def test_average_and_distribution_across_users(client, login):
    pid = _first_product(client)["id"]
    client.post(f"/products/{pid}/reviews", headers=login("+97695200003"), json={"rating": 5})
    client.post(f"/products/{pid}/reviews", headers=login("+97695200004"), json={"rating": 2})
    data = client.get(f"/products/{pid}/reviews").json()
    assert data["summary"]["review_count"] == 2
    assert data["summary"]["avg_rating"] == 3.5
    dist = data["summary"]["distribution"]
    assert dist["5"] == 1 and dist["2"] == 1 and dist["3"] == 0


def test_rating_surfaces_in_catalogue(client, login):
    pid = _first_product(client)["id"]
    client.post(f"/products/{pid}/reviews", headers=login("+97695200005"), json={"rating": 4})
    client.post(f"/products/{pid}/reviews", headers=login("+97695200006"), json={"rating": 5})
    item = next(p for p in client.get("/products?page=1&page_size=50").json()["items"] if p["id"] == pid)
    assert item["review_count"] == 2
    assert item["avg_rating"] == 4.5


def test_invalid_rating_rejected(client, login):
    pid = _first_product(client)["id"]
    h = login("+97695200007")
    assert client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 0}).status_code == 422
    assert client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 6}).status_code == 422


def test_delete_own_review(client, login):
    pid = _first_product(client)["id"]
    h = login("+97695200008")
    client.post(f"/products/{pid}/reviews", headers=h, json={"rating": 3})
    assert client.delete(f"/products/{pid}/reviews", headers=h).status_code == 204
    assert client.get(f"/products/{pid}/reviews").json()["summary"]["review_count"] == 0
    # deleting again -> 404
    assert client.delete(f"/products/{pid}/reviews", headers=h).status_code == 404


def test_sort_by_rating_surfaces_best(client, login):
    # give a mid-list product a perfect score; it should jump to the top
    items = client.get("/products?page=1&page_size=50").json()["items"]
    target = next(p for p in items if p["review_count"] == 0)
    client.post(f"/products/{target['id']}/reviews", headers=login("+97695210001"), json={"rating": 5})
    client.post(f"/products/{target['id']}/reviews", headers=login("+97695210002"), json={"rating": 5})
    top = client.get("/products?sort=rating&page=1&page_size=1").json()["items"][0]
    assert top["id"] == target["id"]
    assert top["avg_rating"] == 5.0
