"""End-to-end tests for admin image uploads (local backend)."""
import io
import os

import pytest

# 1x1 transparent PNG
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000a49444154789c6360000002000154a24f1f0000000049454e44ae426082"
)


@pytest.fixture()
def upload_dir(tmp_path, monkeypatch):
    d = tmp_path / "uploads"
    monkeypatch.setattr("app.services.storage.settings.upload_dir", str(d))
    monkeypatch.setattr("app.services.storage.settings.storage_backend", "local")
    return d


def test_upload_png_returns_url_and_saves_file(client, admin_headers, upload_dir):
    res = client.post(
        "/admin/uploads",
        headers=admin_headers,
        files={"file": ("pic.png", io.BytesIO(PNG), "image/png")},
    )
    assert res.status_code == 201
    url = res.json()["url"]
    assert url.startswith("/uploads/") and url.endswith(".png")
    assert os.path.exists(os.path.join(str(upload_dir), url.split("/")[-1]))


def test_reject_non_image(client, admin_headers, upload_dir):
    res = client.post(
        "/admin/uploads",
        headers=admin_headers,
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert res.status_code == 400


def test_upload_requires_staff(client, login, upload_dir):
    h = login("+97695900001")  # a customer
    res = client.post(
        "/admin/uploads",
        headers=h,
        files={"file": ("pic.png", io.BytesIO(PNG), "image/png")},
    )
    assert res.status_code == 403
