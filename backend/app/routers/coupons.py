"""Customer-facing coupon validation (preview the discount before checkout)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Cart, CartStatus, User
from app.pricing import price_cart
from app.schemas import CouponValidateIn, CouponValidateOut
from app.services.coupons import CouponError, validate_coupon
from app.services.pricing_service import get_global_rule, price_product_line

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.post("/validate", response_model=CouponValidateOut)
def validate(
    body: CouponValidateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Validate a coupon against the user's active cart and preview the discount."""
    cart = db.scalar(
        select(Cart).where(Cart.user_id == user.id, Cart.status == CartStatus.active)
    )
    if cart is None or not cart.items:
        return CouponValidateOut(valid=False, code=body.code, message="Сагс хоосон байна")

    global_rule = get_global_rule(db)
    fx = global_rule.fx_rate_jpy_mnt if global_rule else 22.5
    priced = [price_product_line(db, item.product, qty=item.qty) for item in cart.items]
    agg = price_cart(priced, fx_rate_jpy_mnt=fx)

    try:
        coupon, discount_jpy = validate_coupon(db, body.code, agg.subtotal_jpy)
    except CouponError as exc:
        return CouponValidateOut(valid=False, code=body.code, message=str(exc))

    return CouponValidateOut(
        valid=True,
        code=coupon.code,
        discount_jpy=discount_jpy,
        discount_mnt=round(discount_jpy * fx),
        message=f"¥{discount_jpy:,} хөнгөлөлт хэрэглэгдэнэ",
    )
