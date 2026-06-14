"""Wishlist — save products for later."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Product, User, WishlistItem
from app.routers.products import _attach_price
from app.schemas import WishlistOut

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


def _build(db: Session, user: User) -> WishlistOut:
    rows = db.scalars(
        select(WishlistItem)
        .where(WishlistItem.user_id == user.id)
        .options(selectinload(WishlistItem.product).selectinload(Product.images))
        .order_by(WishlistItem.created_at.desc())
    ).all()
    active = [w for w in rows if w.product and w.product.is_active]
    return WishlistOut(
        product_ids=[w.product_id for w in active],
        items=[_attach_price(db, w.product) for w in active],
    )


@router.get("", response_model=WishlistOut)
def get_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _build(db, user)


@router.post("/{product_id}", response_model=WishlistOut)
def add(product_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(404, "Бараа олдсонгүй")
    exists = db.scalar(
        select(WishlistItem).where(
            WishlistItem.user_id == user.id, WishlistItem.product_id == product_id
        )
    )
    if not exists:
        db.add(WishlistItem(user_id=user.id, product_id=product_id))
        db.commit()
    return _build(db, user)


@router.delete("/{product_id}", response_model=WishlistOut)
def remove(product_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(
        select(WishlistItem).where(
            WishlistItem.user_id == user.id, WishlistItem.product_id == product_id
        )
    )
    if item:
        db.delete(item)
        db.commit()
    return _build(db, user)
