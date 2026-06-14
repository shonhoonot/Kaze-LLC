"""Orders: create from cart (locking a price snapshot) and read back."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Cart,
    CartStatus,
    Order,
    OrderEvent,
    OrderItem,
    OrderStatus,
    User,
)
from app.pricing import price_cart
from app.schemas import OrderCreate, OrderOut
from app.services.pricing_service import get_global_rule, price_product_line

router = APIRouter(prefix="/orders", tags=["orders"])

REFEREE_DISCOUNT_JPY = 400  # one-time first-order service-fee discount


@router.post("", response_model=OrderOut, status_code=201)
def create_order(body: OrderCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cart = db.scalar(
        select(Cart).where(Cart.user_id == user.id, Cart.status == CartStatus.active)
    )
    if cart is None or not cart.items:
        raise HTTPException(400, "Сагс хоосон байна")

    global_rule = get_global_rule(db)
    fx = global_rule.fx_rate_jpy_mnt if global_rule else 22.5

    priced = []
    order_items: list[OrderItem] = []
    for item in cart.items:
        product = item.product
        line = price_product_line(db, product, qty=item.qty)
        priced.append(line)
        order_items.append(
            OrderItem(
                product_id=product.id,
                title_mn_snapshot=product.title_mn,
                qty=item.qty,
                unit_price_jpy=line.unit_total_mnt,  # display unit; JPY components in line_total
                line_total_jpy=line.line_total_jpy,
                weight_grams=line.weight_grams,
            )
        )

    agg = price_cart(priced, fx_rate_jpy_mnt=fx)

    # First-order referral discount: referee gets a one-time service-fee cut.
    referee_discount_jpy = 0
    if user.referred_by:
        prior_orders = db.scalar(
            select(func.count()).select_from(Order).where(Order.user_id == user.id)
        ) or 0
        if prior_orders == 0:
            referee_discount_jpy = min(REFEREE_DISCOUNT_JPY, agg.service_fee_jpy)

    service_fee_jpy = agg.service_fee_jpy - referee_discount_jpy
    total_jpy = agg.total_jpy - referee_discount_jpy
    total_mnt = round(total_jpy * fx)

    order = Order(
        user_id=user.id,
        status=OrderStatus.PLACED,
        subtotal_jpy=agg.subtotal_jpy,
        markup_jpy=agg.markup_jpy,
        service_fee_jpy=service_fee_jpy,
        est_weight_grams=agg.est_weight_grams,
        shipping_fee_jpy=agg.shipping_fee_jpy,
        total_jpy=total_jpy,
        total_mnt=total_mnt,
        fx_rate_used=fx,
        delivery_address=body.delivery_address,
        delivery_phone=body.delivery_phone,
    )
    order.items = order_items
    placed_note = "Захиалга үүсгэгдсэн"
    if referee_discount_jpy:
        placed_note += f" (урамшууллын хөнгөлөлт ¥{referee_discount_jpy})"
    order.events = [OrderEvent(status=OrderStatus.PLACED, note=placed_note)]
    db.add(order)

    cart.status = CartStatus.converted
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.events))
        .order_by(Order.created_at.desc())
    ).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(404, "Захиалга олдсонгүй")
    return order
