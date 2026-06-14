"""Customer product requests — source a Japanese URL not yet in the catalogue."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ProductRequest, User
from app.schemas import ProductRequestIn, ProductRequestOut
from app.services.scraper import fetch_product

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("", response_model=list[ProductRequestOut])
def my_requests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(ProductRequest)
        .where(ProductRequest.user_id == user.id)
        .order_by(ProductRequest.created_at.desc())
    ).all()


@router.post("", response_model=ProductRequestOut, status_code=201)
def create_request(
    body: ProductRequestIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    url = body.url.strip()
    if not url.lower().startswith(("http://", "https://")):
        raise HTTPException(400, "Зөв http(s) холбоос оруулна уу")

    # best-effort snapshot; never blocks the request if scraping fails
    scraped = fetch_product(url)
    req = ProductRequest(
        user_id=user.id,
        url=url,
        note=(body.note or "").strip() or None,
        title=scraped.get("title_ja") or scraped.get("title_mn"),
        image_url=scraped.get("image_url"),
        est_price_jpy=scraped.get("base_price_jpy"),
        source=scraped.get("source"),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req
