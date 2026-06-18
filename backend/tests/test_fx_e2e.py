"""End-to-end tests for the admin live-FX refresh."""
import pytest

from app.services.fx import FxError, _extract_rate


def test_extract_rate_shapes():
    assert _extract_rate({"rates": {"MNT": 23.1}}) == 23.1
    assert _extract_rate({"conversion_rates": {"MNT": 22.0}}) == 22.0
    assert _extract_rate({"jpy_mnt": 21.5}) == 21.5
    assert _extract_rate({"rates": {"USD": 1}}) is None


def test_refresh_updates_global_rule(client, admin_headers, monkeypatch):
    monkeypatch.setattr("app.routers.admin.fetch_live_rate", lambda: 24.75)
    res = client.post("/admin/fx/refresh", headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["fx_rate_jpy_mnt"] == 24.75
    assert body["fx_mode"] == "live"
    # persisted on the global rule
    rules = client.get("/admin/pricing-rules", headers=admin_headers).json()
    glob = next(r for r in rules if r["scope"] == "global")
    assert glob["fx_rate_jpy_mnt"] == 24.75


def test_refresh_propagates_fetch_failure(client, admin_headers, monkeypatch):
    def boom():
        raise FxError("Ханш татаж чадсангүй (ConnectError)")

    monkeypatch.setattr("app.routers.admin.fetch_live_rate", boom)
    res = client.post("/admin/fx/refresh", headers=admin_headers)
    assert res.status_code == 502
    assert "татаж чадсангүй" in res.json()["detail"]


def test_refresh_requires_admin(client, login):
    h = login("+97696100001")  # customer
    assert client.post("/admin/fx/refresh", headers=h).status_code == 403
