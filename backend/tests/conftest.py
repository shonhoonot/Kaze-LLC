"""Shared pytest fixtures for integration tests.

Points the app at an isolated throwaway SQLite database (set *before* any
app module is imported) and gives each test a freshly-seeded TestClient plus
login/auth helpers.
"""
import os
import tempfile

os.environ.setdefault("DATABASE_URL", f"sqlite+pysqlite:///{tempfile.mktemp(suffix='.db')}")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("OTP_DEV_MODE", "true")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    """Fresh, seeded app per test (tables dropped + recreated for isolation)."""
    from app import models  # noqa: F401  (register mappers)
    from app.database import Base, engine
    from app.main import app
    from app.seed import seed

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed()
    with TestClient(app) as c:
        yield c


def _login(client: TestClient, phone: str, name: str | None = None) -> dict:
    req = client.post("/auth/otp/request", json={"phone": phone}).json()
    body = {"phone": phone, "code": req["dev_code"]}
    if name:
        body["name"] = name
    token = client.post("/auth/otp/verify", json=body).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def login(client):
    """Return a helper that logs in (registering on first OTP) and yields headers."""
    def _do(phone: str, name: str | None = None) -> dict:
        return _login(client, phone, name)

    return _do


@pytest.fixture()
def admin_headers(client, login):
    from app.database import SessionLocal
    from app.models import User, UserRole

    db = SessionLocal()
    try:
        phone = db.query(User).filter(User.role != UserRole.customer).first().phone
    finally:
        db.close()
    return login(phone)
