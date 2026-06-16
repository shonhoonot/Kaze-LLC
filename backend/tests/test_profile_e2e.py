"""End-to-end tests for editing the authenticated user's profile."""


def test_update_profile_fields(client, login):
    h = login("+97695600001", "Болд")
    res = client.patch(
        "/auth/me",
        headers=h,
        json={"name": "Болд-Эрдэнэ", "city": "Улаанбаатар", "district": "Хан-Уул", "default_address": "12 байр"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Болд-Эрдэнэ"
    assert body["city"] == "Улаанбаатар"
    assert body["district"] == "Хан-Уул"
    # persisted: /auth/me reflects the change
    assert client.get("/auth/me", headers=h).json()["default_address"] == "12 байр"


def test_email_is_normalised(client, login):
    h = login("+97695600002")
    body = client.patch("/auth/me", headers=h, json={"email": "  Bold@Example.COM "}).json()
    assert body["email"] == "bold@example.com"


def test_partial_update_leaves_other_fields(client, login):
    h = login("+97695600003", "Сараа")
    client.patch("/auth/me", headers=h, json={"city": "Дархан"})
    me = client.patch("/auth/me", headers=h, json={"district": "1-р баг"}).json()
    assert me["name"] == "Сараа"  # untouched
    assert me["city"] == "Дархан"  # from the first patch
    assert me["district"] == "1-р баг"


def test_duplicate_email_rejected(client, login):
    a = login("+97695600004")
    client.patch("/auth/me", headers=a, json={"email": "taken@example.com"})
    b = login("+97695600005")
    assert client.patch("/auth/me", headers=b, json={"email": "taken@example.com"}).status_code == 409
    # same user keeping their own email is fine
    assert client.patch("/auth/me", headers=a, json={"email": "taken@example.com"}).status_code == 200


def test_update_requires_auth(client):
    assert client.patch("/auth/me", json={"name": "x"}).status_code == 401
