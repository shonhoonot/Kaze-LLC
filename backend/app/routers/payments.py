"""QPay payment endpoints (provider-swappable via PAYMENT_PROVIDER)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Order, OrderStatus, PaymentStatus, User
from app.schemas import QPayCallback, QPayInvoiceCreate, QPayInvoiceOut
from app.services.notifications import record_order_event
from app.services.payments import get_payment_provider

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/qpay/create-invoice", response_model=QPayInvoiceOut)
def create_invoice(
    body: QPayInvoiceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.get(Order, body.order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(404, "Захиалга олдсонгүй")
    if order.payment_status == PaymentStatus.paid:
        raise HTTPException(400, "Захиалга аль хэдийн төлөгдсөн")

    provider = get_payment_provider()
    invoice = provider.create_invoice(
        order_id=order.id,
        amount_mnt=order.total_mnt,
        description=f"Kaze Shop захиалга #{order.id}",
    )
    order.payment_status = PaymentStatus.pending
    order.payment_ref = invoice.invoice_id
    db.commit()
    return QPayInvoiceOut(
        invoice_id=invoice.invoice_id,
        qr_text=invoice.qr_text,
        qr_image=invoice.qr_image,
        deeplink=invoice.deeplink,
        amount_mnt=invoice.amount_mnt,
    )


@router.post("/qpay/callback")
def qpay_callback(body: QPayCallback, db: Session = Depends(get_db)):
    """QPay server-to-server callback. Marks the order paid and advances status.

    In production, verify the callback against QPay (payment/check) before
    trusting it. The stub provider relies on this endpoint to confirm payment.
    """
    order = None
    if body.order_id:
        order = db.get(Order, body.order_id)
    if order is None:
        from sqlalchemy import select

        order = db.scalar(select(Order).where(Order.payment_ref == body.invoice_id))
    if order is None:
        raise HTTPException(404, "Захиалга олдсонгүй")

    if body.payment_status.upper() in ("PAID", "SUCCESS", "PAID_SUCCESS"):
        order.payment_status = PaymentStatus.paid
        if order.status == OrderStatus.PLACED:
            order.status = OrderStatus.PAID
            record_order_event(db, order, OrderStatus.PAID)
    db.commit()
    return {"ok": True}
