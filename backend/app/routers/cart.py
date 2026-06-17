"""Cart: add/update/remove items and compute live pricing + box-fill estimate."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Cart, CartItem, CartStatus, Order, Product, User
from app.pricing import price_cart
from app.schemas import (
    BoxFillOut,
    CartItemIn,
    CartItemUpdate,
    CartLineOut,
    CartOut,
    ReorderOut,
)
from app.services.boxes import box_fill_payload, get_open_box
from app.services.pricing_service import (
    get_global_rule,
    price_breakdown_dict,
    price_product_line,
)

router = APIRouter(prefix="/cart", tags=["cart"])


def _get_or_create_cart(db: Session, user: User) -> Cart:
    cart = db.scalar(
        select(Cart).where(Cart.user_id == user.id, Cart.status == CartStatus.active)
    )
    if cart is None:
        cart = Cart(user_id=user.id, status=CartStatus.active)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _build_cart_out(db: Session, cart: Cart) -> CartOut:
    lines_out: list[CartLineOut] = []
    priced_lines = []
    for item in cart.items:
        product = item.product
        line = price_product_line(db, product, qty=item.qty)
        priced_lines.append(line)
        image_url = product.images[0].url if product.images else None
        lines_out.append(
            CartLineOut(
                id=item.id,
                product_id=product.id,
                title_mn=product.title_mn,
                qty=item.qty,
                weight_grams=line.weight_grams,
                image_url=image_url,
                bag_note=item.bag_note,
                price=price_breakdown_dict(line),  # type: ignore[arg-type]
            )
        )

    global_rule = get_global_rule(db)
    fx = global_rule.fx_rate_jpy_mnt if global_rule else 22.5
    agg = price_cart(priced_lines, fx_rate_jpy_mnt=fx)

    # box-fill: projected if this cart's weight were added to the open box
    open_box = get_open_box(db)
    fill = box_fill_payload(open_box, extra_grams=agg.est_weight_grams)

    return CartOut(
        id=cart.id,
        lines=lines_out,
        subtotal_jpy=agg.subtotal_jpy,
        markup_jpy=agg.markup_jpy,
        service_fee_jpy=agg.service_fee_jpy,
        shipping_fee_jpy=agg.shipping_fee_jpy,
        est_weight_grams=agg.est_weight_grams,
        total_jpy=agg.total_jpy,
        total_mnt=agg.total_mnt,
        fx_rate_used=agg.fx_rate_used,
        box_fill=BoxFillOut(**fill),
    )


@router.get("", response_model=CartOut)
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cart = _get_or_create_cart(db, user)
    return _build_cart_out(db, cart)


@router.post("/items", response_model=CartOut)
def add_item(body: CartItemIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.qty < 1:
        raise HTTPException(400, "Тоо ширхэг 1-ээс багагүй байх ёстой")
    product = db.get(Product, body.product_id)
    if product is None or not product.is_active:
        raise HTTPException(404, "Бараа олдсонгүй")
    if not product.in_stock:
        raise HTTPException(400, "Уг бараа одоогоор дууссан байна")

    cart = _get_or_create_cart(db, user)
    existing = db.scalar(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product.id)
    )
    if existing:
        existing.qty += body.qty
        if body.bag_note is not None:
            existing.bag_note = body.bag_note
    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                qty=body.qty,
                unit_price_jpy_snapshot=product.base_price_jpy,
                bag_note=body.bag_note,
            )
        )
    db.commit()
    db.refresh(cart)
    return _build_cart_out(db, cart)


@router.post("/reorder/{order_id}", response_model=ReorderOut)
def reorder(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Re-add every still-available item from a past order into the active cart."""
    order = db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(404, "Захиалга олдсонгүй")

    cart = _get_or_create_cart(db, user)
    added = skipped = 0
    for item in order.items:
        product = db.get(Product, item.product_id)
        if product is None or not product.is_active or not product.in_stock:
            skipped += 1
            continue
        existing = db.scalar(
            select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product.id)
        )
        if existing:
            existing.qty += item.qty
        else:
            db.add(
                CartItem(
                    cart_id=cart.id,
                    product_id=product.id,
                    qty=item.qty,
                    unit_price_jpy_snapshot=product.base_price_jpy,
                )
            )
        added += 1
    db.commit()
    db.refresh(cart)
    return ReorderOut(added=added, skipped=skipped, cart=_build_cart_out(db, cart))


@router.patch("/items/{item_id}", response_model=CartOut)
def update_item(
    item_id: int,
    body: CartItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.get(CartItem, item_id)
    if item is None or item.cart.user_id != user.id:
        raise HTTPException(404, "Сагсны бараа олдсонгүй")
    if body.qty is not None:
        if body.qty < 1:
            raise HTTPException(400, "Тоо ширхэг 1-ээс багагүй байх ёстой")
        item.qty = body.qty
    if body.bag_note is not None:
        item.bag_note = body.bag_note
    db.commit()
    db.refresh(item.cart)
    return _build_cart_out(db, item.cart)


@router.delete("/items/{item_id}", response_model=CartOut)
def delete_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(CartItem, item_id)
    if item is None or item.cart.user_id != user.id:
        raise HTTPException(404, "Сагсны бараа олдсонгүй")
    cart = item.cart
    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_out(db, cart)
