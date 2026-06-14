"""Admin / staff endpoints: products, pricing, orders board, boxes, dashboard."""
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth import require_admin, require_staff
from app.database import get_db
from app.models import (
    Box,
    BoxItem,
    BoxStatus,
    Notification,
    Order,
    OrderPhoto,
    OrderStatus,
    PaymentStatus,
    PricingRule,
    PricingScope,
    Product,
    ProductImage,
    ProductSource,
    User,
)
from app.schemas import (
    BoxItemIn,
    BoxOut,
    DashboardOut,
    OrderOut,
    OrderPhotoIn,
    OrderStatusUpdate,
    PricingRuleIn,
    PricingRuleOut,
    ProductIn,
    ProductOut,
    ProductUpdate,
)
from app.services.boxes import box_fill_payload, get_open_box
from app.services.notifications import record_order_event

router = APIRouter(prefix="/admin", tags=["admin"])


# ─────────────── products ───────────────
@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(body: ProductIn, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    product = Product(**body.model_dump(exclude={"images"}))
    product.images = [
        ProductImage(url=img.url, sort_order=img.sort_order) for img in body.images
    ]
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Бараа олдсонгүй")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Бараа олдсонгүй")
    # soft-delete to preserve order history integrity
    product.is_active = False
    db.commit()


@router.post("/products/import")
def import_products_csv(
    file: UploadFile,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Bulk add products from CSV.

    Columns: title_mn,title_ja,brand,source,source_url,sku,category_id,
             base_price_jpy,weight_grams,image_url
    """
    raw = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))
    created = 0
    errors: list[str] = []
    for i, row in enumerate(reader, start=2):
        try:
            source = row.get("source", "other").strip() or "other"
            product = Product(
                title_mn=row["title_mn"].strip(),
                title_ja=(row.get("title_ja") or "").strip() or None,
                brand=(row.get("brand") or "").strip() or None,
                source=ProductSource(source) if source in ProductSource._value2member_map_ else ProductSource.other,
                source_url=(row.get("source_url") or "").strip() or None,
                sku=(row.get("sku") or "").strip() or None,
                category_id=int(row["category_id"]) if row.get("category_id") else None,
                base_price_jpy=int(row["base_price_jpy"]),
                weight_grams=int(row.get("weight_grams") or 500),
            )
            image_url = (row.get("image_url") or "").strip()
            if image_url:
                product.images = [ProductImage(url=image_url, sort_order=0)]
            db.add(product)
            created += 1
        except (KeyError, ValueError) as exc:
            errors.append(f"мөр {i}: {exc}")
    db.commit()
    return {"created": created, "errors": errors}


# ─────────────── pricing rules ───────────────
@router.get("/pricing-rules", response_model=list[PricingRuleOut])
def list_pricing_rules(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(PricingRule).order_by(PricingRule.scope, PricingRule.scope_ref)).all()


@router.put("/pricing-rules", response_model=PricingRuleOut)
def upsert_pricing_rule(
    body: PricingRuleIn, db: Session = Depends(get_db), _: User = Depends(require_admin)
):
    """Create or update a pricing rule for a given scope/scope_ref."""
    stmt = select(PricingRule).where(PricingRule.scope == body.scope)
    if body.scope == PricingScope.global_:
        stmt = stmt.where(PricingRule.scope_ref.is_(None))
    else:
        if body.scope_ref is None:
            raise HTTPException(400, "scope_ref шаардлагатай")
        stmt = stmt.where(PricingRule.scope_ref == body.scope_ref)

    rule = db.scalar(stmt)
    if rule is None:
        rule = PricingRule(scope=body.scope, scope_ref=body.scope_ref)
        db.add(rule)
    rule.markup_percent = body.markup_percent
    rule.service_fee_per_item_jpy = body.service_fee_per_item_jpy
    rule.shipping_fee_per_kg_jpy = body.shipping_fee_per_kg_jpy
    rule.fx_rate_jpy_mnt = body.fx_rate_jpy_mnt
    rule.fx_mode = body.fx_mode
    db.commit()
    db.refresh(rule)
    return rule


# ─────────────── orders board ───────────────
@router.get("/orders", response_model=list[OrderOut])
def list_all_orders(
    status: OrderStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    stmt = select(Order).options(
        selectinload(Order.items),
        selectinload(Order.events),
        selectinload(Order.photos),
    )
    if status:
        stmt = stmt.where(Order.status == status)
    return db.scalars(stmt.order_by(Order.created_at.desc())).all()


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(404, "Захиалга олдсонгүй")
    order.status = body.status
    if body.status == OrderStatus.PAID and order.payment_status != PaymentStatus.paid:
        order.payment_status = PaymentStatus.paid
    record_order_event(db, order, body.status, note=body.note)
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{order_id}/photos", response_model=OrderOut)
def add_order_photo(
    order_id: int,
    body: OrderPhotoIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(404, "Захиалга олдсонгүй")
    order.photos.append(OrderPhoto(url=body.url, caption=body.caption))
    db.add(
        Notification(
            user_id=order.user_id,
            order_id=order.id,
            title="Шинэ зураг нэмэгдлээ",
            body=body.caption or "Таны захиалгын барааны зураг агуулахаас нэмэгдлээ.",
        )
    )
    db.commit()
    db.refresh(order)
    return order


# ─────────────── boxes ───────────────
@router.get("/boxes", response_model=list[BoxOut])
def list_boxes(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    return db.scalars(select(Box).order_by(Box.created_at.desc())).all()


@router.post("/boxes", response_model=BoxOut, status_code=201)
def create_box(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    code = f"KZ-{datetime.now(timezone.utc).strftime('%y%m%d-%H%M%S')}"
    box = Box(code=code, status=BoxStatus.OPEN)
    db.add(box)
    db.commit()
    db.refresh(box)
    return box


@router.post("/boxes/{box_id}/items", response_model=BoxOut)
def add_box_item(
    box_id: int,
    body: BoxItemIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    box = db.get(Box, box_id)
    if box is None:
        raise HTTPException(404, "Хайрцаг олдсонгүй")
    if box.status not in (BoxStatus.OPEN, BoxStatus.PACKING):
        raise HTTPException(400, "Зөвхөн нээлттэй хайрцагт нэмнэ")
    order = db.get(Order, body.order_id)
    if order is None:
        raise HTTPException(404, "Захиалга олдсонгүй")
    if order.payment_status != PaymentStatus.paid:
        raise HTTPException(400, "Зөвхөн төлбөр төлөгдсөн захиалгыг нэмнэ")

    bag_label = body.bag_label or f"BAG-{order.id}"
    db.add(
        BoxItem(
            box_id=box.id,
            order_id=order.id,
            bag_label=bag_label,
            weight_grams=order.est_weight_grams,
        )
    )
    box.current_weight_grams += order.est_weight_grams
    box.status = BoxStatus.PACKING
    if order.status in (OrderStatus.PAID, OrderStatus.PURCHASING_IN_JP, OrderStatus.RECEIVED_AT_JP_WAREHOUSE):
        order.status = OrderStatus.PACKED
        record_order_event(db, order, OrderStatus.PACKED, note=f"Хайрцаг {box.code}-д савлагдсан")
    db.commit()
    db.refresh(box)
    return box


@router.patch("/boxes/{box_id}/ship", response_model=BoxOut)
def ship_box(box_id: int, db: Session = Depends(get_db), _: User = Depends(require_staff)):
    box = db.get(Box, box_id)
    if box is None:
        raise HTTPException(404, "Хайрцаг олдсонгүй")
    box.status = BoxStatus.SHIPPED
    box.departed_at = datetime.now(timezone.utc)
    # auto-advance all orders in the box
    for item in box.items:
        order = item.order
        order.status = OrderStatus.SHIPPED_CARGO
        record_order_event(db, order, OrderStatus.SHIPPED_CARGO, note=f"Далайн ачаагаар явсан ({box.code})")
    db.commit()
    db.refresh(box)
    return box


# ─────────────── dashboard ───────────────
@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    orders_today = db.scalar(
        select(func.count()).select_from(Order).where(Order.created_at >= start_today)
    ) or 0
    revenue_today = db.scalar(
        select(func.coalesce(func.sum(Order.total_mnt), 0)).where(
            Order.created_at >= start_today, Order.payment_status == PaymentStatus.paid
        )
    ) or 0
    avg_margin = db.scalar(
        select(func.coalesce(func.avg(Order.markup_jpy + Order.service_fee_jpy), 0))
    ) or 0
    boxes_month = db.scalar(
        select(func.count()).select_from(Box).where(Box.created_at >= start_month)
    ) or 0

    open_box = get_open_box(db)
    fill = box_fill_payload(open_box)

    return DashboardOut(
        orders_today=orders_today,
        revenue_today_mnt=int(revenue_today),
        avg_margin_per_order_jpy=int(avg_margin),
        boxes_this_month=boxes_month,
        open_box_fill_percent=fill["fill_percent"],
    )
