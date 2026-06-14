"""Coupon validation and discount math.

Discounts apply against the merchandise subtotal (product cost, JPY) and are
capped so they never exceed it. All money math is integer JPY.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Coupon, CouponType


class CouponError(ValueError):
    """Raised when a coupon cannot be applied; message is customer-facing (MN)."""


def find_coupon(db: Session, code: str) -> Coupon | None:
    if not code:
        return None
    return db.scalar(select(Coupon).where(Coupon.code == code.strip().upper()))


def compute_discount(coupon: Coupon, subtotal_jpy: int) -> int:
    """Discount amount in JPY for a given merchandise subtotal (no validation)."""
    if coupon.discount_type == CouponType.percent:
        discount = round(subtotal_jpy * coupon.value / 100)
        if coupon.max_discount_jpy is not None:
            discount = min(discount, coupon.max_discount_jpy)
    else:  # fixed_jpy
        discount = coupon.value
    return max(0, min(discount, subtotal_jpy))


def validate_coupon(db: Session, code: str, subtotal_jpy: int) -> tuple[Coupon, int]:
    """Return (coupon, discount_jpy) or raise CouponError with an MN message."""
    coupon = find_coupon(db, code)
    if coupon is None:
        raise CouponError("Купон код олдсонгүй")
    if not coupon.is_active:
        raise CouponError("Энэ купон идэвхгүй байна")
    if coupon.expires_at is not None:
        expires = coupon.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            raise CouponError("Купоны хүчинтэй хугацаа дууссан")
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise CouponError("Купоны ашиглах эрх дууссан")
    if subtotal_jpy < coupon.min_subtotal_jpy:
        raise CouponError(
            f"Энэ купон ¥{coupon.min_subtotal_jpy:,}-аас дээш захиалгад хэрэглэнэ"
        )
    discount = compute_discount(coupon, subtotal_jpy)
    if discount <= 0:
        raise CouponError("Хөнгөлөлт тооцоологдсонгүй")
    return coupon, discount
