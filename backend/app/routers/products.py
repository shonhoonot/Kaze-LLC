"""Public product catalog with computed customer pricing."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Category, Product, Review
from app.schemas import PriceBreakdown, ProductListOut, ProductOut
from app.services.pricing_service import price_breakdown_dict, price_product_line
from app.services.reviews import rating_for, rating_map

router = APIRouter(tags=["products"])


def _attach_price(
    db: Session, product: Product, rating: tuple[float | None, int] | None = None
) -> ProductOut:
    out = ProductOut.model_validate(product)
    line = price_product_line(db, product, qty=1)
    out.price = PriceBreakdown(**price_breakdown_dict(line))
    if rating is None:
        rating = rating_for(db, product.id)
    out.avg_rating, out.review_count = rating
    return out


@router.get("/products", response_model=ProductListOut)
def list_products(
    db: Session = Depends(get_db),
    category: str | None = Query(None, description="category slug"),
    brand: str | None = None,
    q: str | None = None,
    min_price_jpy: int | None = None,
    max_price_jpy: int | None = None,
    sort: str = Query("new", description="new | price_asc | price_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
):
    stmt = select(Product).where(Product.is_active.is_(True))

    if category:
        cat = db.scalar(select(Category).where(Category.slug == category))
        if cat:
            stmt = stmt.where(Product.category_id == cat.id)
        else:
            stmt = stmt.where(Product.id == -1)  # unknown slug -> empty
    if brand:
        stmt = stmt.where(Product.brand == brand)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Product.title_mn.ilike(like) | Product.title_ja.ilike(like))
    if min_price_jpy is not None:
        stmt = stmt.where(Product.base_price_jpy >= min_price_jpy)
    if max_price_jpy is not None:
        stmt = stmt.where(Product.base_price_jpy <= max_price_jpy)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    rows_stmt = stmt.options(selectinload(Product.images))
    if sort == "rating":
        # highest average rating first, then most-reviewed, then newest
        agg = (
            select(
                Review.product_id.label("pid"),
                func.avg(Review.rating).label("avg"),
                func.count().label("cnt"),
            )
            .group_by(Review.product_id)
            .subquery()
        )
        rows_stmt = rows_stmt.outerjoin(agg, Product.id == agg.c.pid).order_by(
            func.coalesce(agg.c.avg, 0).desc(),
            func.coalesce(agg.c.cnt, 0).desc(),
            Product.created_at.desc(),
        )
    else:
        order_by = {
            "price_asc": Product.base_price_jpy.asc(),
            "price_desc": Product.base_price_jpy.desc(),
            "new": Product.created_at.desc(),
        }.get(sort, Product.created_at.desc())
        rows_stmt = rows_stmt.order_by(order_by)

    rows = db.scalars(
        rows_stmt.offset((page - 1) * page_size).limit(page_size)
    ).all()

    ratings = rating_map(db, [p.id for p in rows])
    return ProductListOut(
        items=[_attach_price(db, p, ratings.get(p.id, (None, 0))) for p in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(404, "Бараа олдсонгүй")
    return _attach_price(db, product)
