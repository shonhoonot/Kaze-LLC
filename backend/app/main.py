"""Kaze Shop FastAPI application entrypoint."""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.routers import (
    admin,
    auth,
    cart,
    categories,
    coupons,
    notifications,
    orders,
    payments,
    products,
    wishlist,
)
from app.schemas import BoxFillOut
from app.services.boxes import box_fill_payload, get_open_box

app = FastAPI(title="Kaze Shop API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # For v1 we create tables directly. A migrations tool (Alembic) is the
    # next step for production schema evolution.
    Base.metadata.create_all(bind=engine)
    if settings.storage_backend == "local":
        os.makedirs(settings.upload_dir, exist_ok=True)


# ─────────────── public misc ───────────────
public = APIRouter(tags=["public"])


@public.get("/health")
def health() -> dict:
    return {"status": "ok", "env": settings.env}


@public.get("/box-fill", response_model=BoxFillOut)
def box_fill(db: Session = Depends(get_db)):
    """Current open box fill — powers the urgency progress bar on home."""
    return box_fill_payload(get_open_box(db))


app.include_router(public)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(coupons.router)
app.include_router(payments.router)
app.include_router(wishlist.router)
app.include_router(notifications.router)
app.include_router(admin.router)

if settings.storage_backend == "local":
    os.makedirs(settings.upload_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
