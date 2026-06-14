"""Product reviews — star ratings + comments, one per user per product."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user, get_current_user_optional
from app.database import get_db
from app.models import Product, Review, User
from app.schemas import ProductReviewsOut, ReviewIn, ReviewOut, ReviewSummary
from app.services.reviews import distribution_for, has_purchased, rating_for

router = APIRouter(tags=["reviews"])


def _author_name(user: User | None) -> str:
    if user and user.name:
        return user.name
    if user and user.phone:
        return user.phone[:-4] + "••••" if len(user.phone) >= 4 else "Хэрэглэгч"
    return "Хэрэглэгч"


def _to_out(review: Review) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        rating=review.rating,
        comment=review.comment,
        verified=review.verified,
        author_name=_author_name(review.user),
        created_at=review.created_at,
    )


def _require_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(404, "Бараа олдсонгүй")
    return product


@router.get("/products/{product_id}/reviews", response_model=ProductReviewsOut)
def list_reviews(
    product_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    _require_product(db, product_id)
    reviews = db.scalars(
        select(Review)
        .where(Review.product_id == product_id)
        .options(selectinload(Review.user))
        .order_by(Review.created_at.desc())
    ).all()
    avg, count = rating_for(db, product_id)
    summary = ReviewSummary(
        avg_rating=avg, review_count=count, distribution=distribution_for(db, product_id)
    )
    mine = next((r for r in reviews if user and r.user_id == user.id), None)
    return ProductReviewsOut(
        summary=summary,
        items=[_to_out(r) for r in reviews],
        my_review=_to_out(mine) if mine else None,
    )


@router.post("/products/{product_id}/reviews", response_model=ReviewOut, status_code=201)
def upsert_review(
    product_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_product(db, product_id)
    review = db.scalar(
        select(Review).where(Review.product_id == product_id, Review.user_id == user.id)
    )
    if review is None:
        review = Review(product_id=product_id, user_id=user.id)
        db.add(review)
    review.rating = body.rating
    review.comment = (body.comment or "").strip() or None
    review.verified = has_purchased(db, user.id, product_id)
    db.commit()
    db.refresh(review)
    return _to_out(review)


@router.delete("/products/{product_id}/reviews", status_code=204)
def delete_review(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    review = db.scalar(
        select(Review).where(Review.product_id == product_id, Review.user_id == user.id)
    )
    if review is None:
        raise HTTPException(404, "Сэтгэгдэл олдсонгүй")
    db.delete(review)
    db.commit()
