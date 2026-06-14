"""Review aggregates — rating summaries shared by the catalogue and review API."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Order, OrderItem, Review


def rating_map(db: Session, product_ids: list[int]) -> dict[int, tuple[float, int]]:
    """Batch {product_id: (avg_rating, count)} for the given products (no N+1)."""
    if not product_ids:
        return {}
    rows = db.execute(
        select(Review.product_id, func.avg(Review.rating), func.count())
        .where(Review.product_id.in_(product_ids))
        .group_by(Review.product_id)
    ).all()
    return {pid: (round(float(avg), 1), int(cnt)) for pid, avg, cnt in rows}


def rating_for(db: Session, product_id: int) -> tuple[float | None, int]:
    avg, cnt = db.execute(
        select(func.avg(Review.rating), func.count()).where(Review.product_id == product_id)
    ).one()
    return (round(float(avg), 1) if avg is not None else None, int(cnt))


def distribution_for(db: Session, product_id: int) -> dict[int, int]:
    rows = db.execute(
        select(Review.rating, func.count())
        .where(Review.product_id == product_id)
        .group_by(Review.rating)
    ).all()
    counts = {star: 0 for star in range(1, 6)}
    for star, cnt in rows:
        counts[int(star)] = int(cnt)
    return counts


def has_purchased(db: Session, user_id: int, product_id: int) -> bool:
    """True if the user has an order line for this product (verified-buyer badge)."""
    return db.scalar(
        select(OrderItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(OrderItem.product_id == product_id, Order.user_id == user_id)
        .limit(1)
    ) is not None
