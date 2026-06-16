"""End-to-end tests for Sign in with Google."""
import pytest


def _fake_info(monkeypatch, *, sub="google-sub-1", email="user@gmail.com", name="Google Хэрэглэгч", verified=True):
    monkeypatch.setattr(
        "app.routers.auth.verify_google_token",
        lambda token: {
            "sub": sub,
            "email": email.lower(),
            "email_verified": verified,
            "name": name,
            "picture": None,
        },
    )


def test_unconfigured_returns_401(client):
    # no GOOGLE_CLIENT_ID set -> verification refuses
    r = client.post("/auth/google", json={"id_token": "x"})
    assert r.status_code == 401
    assert "тохируулагдаагүй" in r.json()["detail"]


def test_google_login_creates_user(client, monkeypatch):
    _fake_info(monkeypatch, email="newbie@gmail.com", name="Шинэ")
    r = client.post("/auth/google", json={"id_token": "valid"})
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["email"] == "newbie@gmail.com"
    assert data["user"]["name"] == "Шинэ"
    assert data["user"]["phone"] is None
    # token works
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.json()["email"] == "newbie@gmail.com"


def test_repeat_login_same_user(client, monkeypatch):
    _fake_info(monkeypatch, sub="stable-sub", email="repeat@gmail.com")
    first = client.post("/auth/google", json={"id_token": "v"}).json()
    second = client.post("/auth/google", json={"id_token": "v"}).json()
    assert first["user"]["id"] == second["user"]["id"]


def test_unverified_email_rejected(client, monkeypatch):
    _fake_info(monkeypatch, verified=False)
    assert client.post("/auth/google", json={"id_token": "v"}).status_code == 401


def test_google_links_to_existing_email_account(client, login, monkeypatch):
    # existing phone-based user who set their email
    h = login("+97695700001", "Утасны хэрэглэгч")
    client.patch("/auth/me", headers=h, json={"email": "link@gmail.com"})
    me_before = client.get("/auth/me", headers=h).json()

    _fake_info(monkeypatch, sub="link-sub", email="link@gmail.com")
    data = client.post("/auth/google", json={"id_token": "v"}).json()
    # same account, now linked (kept phone + name)
    assert data["user"]["id"] == me_before["id"]
    assert data["user"]["phone"] == "+97695700001"
