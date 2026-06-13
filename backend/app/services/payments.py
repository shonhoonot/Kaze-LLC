"""Payment provider abstraction.

Providers are swappable behind `PaymentProvider`. v1 ships a Stub (for local
dev/tests) and a QPay implementation skeleton. Select via PAYMENT_PROVIDER env.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Protocol

import httpx

from app.config import settings


@dataclass
class Invoice:
    invoice_id: str
    qr_text: str
    qr_image: str | None
    deeplink: str | None
    amount_mnt: int


class PaymentProvider(Protocol):
    def create_invoice(self, *, order_id: int, amount_mnt: int, description: str) -> Invoice: ...
    def check_payment(self, *, invoice_id: str) -> bool: ...


class StubProvider:
    """Local/dev provider. Returns a fake QR; payment is 'confirmed' on callback."""

    def create_invoice(self, *, order_id: int, amount_mnt: int, description: str) -> Invoice:
        invoice_id = f"STUB-{order_id}-{uuid.uuid4().hex[:8]}"
        return Invoice(
            invoice_id=invoice_id,
            qr_text=f"kaze://pay?order={order_id}&amount={amount_mnt}",
            qr_image=None,
            deeplink=f"kaze://pay?invoice={invoice_id}",
            amount_mnt=amount_mnt,
        )

    def check_payment(self, *, invoice_id: str) -> bool:
        # In stub mode payments are confirmed via the callback endpoint.
        return False


class QPayProvider:
    """QPay v2 integration skeleton. Wire real credentials via env vars.

    Real flow:
      1. POST /auth/token with basic auth -> access token (cache it)
      2. POST /invoice -> qr_text, qr_image, urls
      3. callback hits /payments/qpay/callback OR poll POST /payment/check
    """

    def __init__(self) -> None:
        self._token: str | None = None

    def _auth(self) -> str:
        if self._token:
            return self._token
        resp = httpx.post(
            f"{settings.qpay_base_url}/auth/token",
            auth=(settings.qpay_username, settings.qpay_password),
            timeout=15,
        )
        resp.raise_for_status()
        self._token = resp.json()["access_token"]
        return self._token

    def create_invoice(self, *, order_id: int, amount_mnt: int, description: str) -> Invoice:
        token = self._auth()
        resp = httpx.post(
            f"{settings.qpay_base_url}/invoice",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "invoice_code": settings.qpay_invoice_code,
                "sender_invoice_no": str(order_id),
                "invoice_receiver_code": "terminal",
                "invoice_description": description,
                "amount": amount_mnt,
                "callback_url": f"{settings.qpay_callback_url}?order_id={order_id}",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return Invoice(
            invoice_id=data["invoice_id"],
            qr_text=data.get("qr_text", ""),
            qr_image=data.get("qr_image"),
            deeplink=(data.get("urls") or [{}])[0].get("link"),
            amount_mnt=amount_mnt,
        )

    def check_payment(self, *, invoice_id: str) -> bool:
        token = self._auth()
        resp = httpx.post(
            f"{settings.qpay_base_url}/payment/check",
            headers={"Authorization": f"Bearer {token}"},
            json={"object_type": "INVOICE", "object_id": invoice_id},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get("count", 0) > 0


def get_payment_provider() -> PaymentProvider:
    if settings.payment_provider == "qpay":
        return QPayProvider()
    return StubProvider()
