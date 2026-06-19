"""Admin / staff endpoints: products, pricing, orders board, boxes, dashboard."""
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.auth import require_admin, require_staff
from app.database import get_db
from app.models import (
    Box,
    BoxItem,
    BoxStatus,
    ContactMessage,
    Coupon,
    CouponType,
    FxMode,
    Notification,
    Order,
    OrderPhoto,
    OrderStatus,
    PaymentStatus,
    PricingRule,
    PricingScope,
    Product,
    ProductImage,
    ProductRequest,
    ProductSource,
    RequestStatus,
    User,
)
from app.schemas import (
    BoxItemIn,
    BoxOut,
    ContactOut,
    ContactUpdate,
    CouponIn,
    CouponOut,
    CouponUpdate,
    DashboardOut,
    OrderOut,
    OrderPhotoIn,
    OrderStatusUpdate,
    PricingRuleIn,
    PricingRuleOut,
    ProductIn,
    ProductListOut,
    ProductOut,
    ProductRequestOut,
    ProductRequestUpdate,
    ProductScrapeIn,
    ProductScrapeOut,
    ProductUpdate,
    StatusCountOut,
    UploadOut,
)
from app.services.boxes import box_fill_payload, get_open_box
from app.services.storage import UploadError, save_image
from app.services.notifications import record_order_event
from app.services.scraper import fetch_product
from app.services.fx import FxError, fetch_live_rate

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


@router.post("/products/scrape", response_model=ProductScrapeOut)
def scrape_product(
    body: ProductScrapeIn,
    _: User = Depends(require_staff),
):
    """Best-effort pull of title/price/image/brand from a Japanese product URL.

    Does not save anything — the admin reviews/edits, then submits the form.
    """
    url = body.url.strip()
    if not url.lower().startswith(("http://", "https://")):
        raise HTTPException(400, "Зөв http(s) холбоос оруулна уу")
    return ProductScrapeOut(**fetch_product(url))


@router.post("/uploads", response_model=UploadOut, status_code=201)
def upload_image(
    file: UploadFile,
    _: User = Depends(require_staff),
):
    """Store an uploaded image and return its public URL."""
    try:
        url = save_image(file.file.read(), file.content_type or "")
    except UploadError as exc:
        raise HTTPException(400, str(exc))
    return UploadOut(url=url)


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
            # Per-row savepoint so one bad row (e.g. invalid category_id FK)
            # doesn't roll back the whole import or 500 at the final commit.
            with db.begin_nested():
                db.add(product)
                db.flush()
            created += 1
        except (KeyError, ValueError) as exc:
            errors.append(f"мөр {i}: {exc}")
        except IntegrityError as exc:
            errors.append(f"мөр {i}: хадгалах боломжгүй ({exc.orig})")
    db.commit()
    return {"created": created, "errors": errors}


@router.get("/products", response_model=ProductListOut)
def admin_list_products(
    q: str | None = None,
    category_id: int | None = None,
    active: str = "all",  # all | active | inactive
    page: int = 1,
    page_size: int = 30,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Admin catalogue — unlike the public list, includes inactive products."""
    stmt = select(Product)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            Product.title_mn.ilike(like)
            | Product.title_ja.ilike(like)
            | Product.brand.ilike(like)
            | Product.sku.ilike(like)
        )
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if active == "active":
        stmt = stmt.where(Product.is_active.is_(True))
    elif active == "inactive":
        stmt = stmt.where(Product.is_active.is_(False))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    page_size = max(1, min(page_size, 100))
    rows = db.scalars(
        stmt.options(selectinload(Product.images))
        .order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return ProductListOut(items=rows, total=total, page=page, page_size=page_size)


# ─────────────── coupons ───────────────
@router.get("/coupons", response_model=list[CouponOut])
def list_coupons(db: Session = Depends(get_db), _: User = Depends(require_staff)):
    return db.scalars(select(Coupon).order_by(Coupon.created_at.desc())).all()


@router.post("/coupons", response_model=CouponOut, status_code=201)
def create_coupon(body: CouponIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(400, "Купон код хоосон байж болохгүй")
    if db.scalar(select(Coupon).where(Coupon.code == code)):
        raise HTTPException(409, "Энэ купон код аль хэдийн бүртгэгдсэн")
    if body.value <= 0:
        raise HTTPException(400, "Хөнгөлөлтийн утга 0-ээс их байх ёстой")
    if body.discount_type == CouponType.percent and body.value > 100:
        raise HTTPException(400, "Хувийн хөнгөлөлт 100-аас их байж болохгүй")
    coupon = Coupon(**{**body.model_dump(), "code": code})
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.patch("/coupons/{coupon_id}", response_model=CouponOut)
def update_coupon(
    coupon_id: int,
    body: CouponUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    coupon = db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(404, "Купон олдсонгүй")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(coupon, field, value)
    db.commit()
    db.refresh(coupon)
    return coupon


# ─────────────── product requests ───────────────
@router.get("/requests", response_model=list[ProductRequestOut])
def list_requests(
    status: RequestStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    stmt = select(ProductRequest)
    if status:
        stmt = stmt.where(ProductRequest.status == status)
    return db.scalars(stmt.order_by(ProductRequest.created_at.desc())).all()


@router.patch("/requests/{request_id}", response_model=ProductRequestOut)
def update_request(
    request_id: int,
    body: ProductRequestUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    req = db.get(ProductRequest, request_id)
    if req is None:
        raise HTTPException(404, "Хүсэлт олдсонгүй")
    prev_status = req.status
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    # notify the customer when the admin responds with a quote or decision
    if body.status is not None and body.status != prev_status:
        _notify_request(db, req)
    db.commit()
    db.refresh(req)
    return req


def _notify_request(db: Session, req: ProductRequest) -> None:
    copy = {
        RequestStatus.quoted: ("Захиалгат бараа — үнийн санал", "Таны хүсэлтэд үнэ гаргалаа."),
        RequestStatus.rejected: ("Захиалгат бараа", "Уучлаарай, энэ барааг олох боломжгүй байна."),
        RequestStatus.fulfilled: ("Захиалгат бараа бэлэн", "Таны хүсэлтийн дагуу бараа нэмэгдлээ."),
    }.get(req.status)
    if copy:
        title, suffix = copy
        body_text = req.admin_note or suffix
        db.add(Notification(user_id=req.user_id, title=title, body=body_text))


# ─────────────── contact messages ───────────────
@router.get("/contact", response_model=list[ContactOut])
def list_contact(
    handled: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    stmt = select(ContactMessage)
    if handled is not None:
        stmt = stmt.where(ContactMessage.handled.is_(handled))
    return db.scalars(stmt.order_by(ContactMessage.created_at.desc())).all()


@router.patch("/contact/{message_id}", response_model=ContactOut)
def update_contact(
    message_id: int,
    body: ContactUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    msg = db.get(ContactMessage, message_id)
    if msg is None:
        raise HTTPException(404, "Зурвас олдсонгүй")
    msg.handled = body.handled
    db.commit()
    db.refresh(msg)
    return msg


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


@router.post("/fx/refresh", response_model=PricingRuleOut)
def refresh_fx_rate(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Pull the live JPY→MNT rate and update the global pricing rule."""
    try:
        rate = fetch_live_rate()
    except FxError as exc:
        raise HTTPException(502, str(exc))
    rule = db.scalar(
        select(PricingRule).where(
            PricingRule.scope == PricingScope.global_, PricingRule.scope_ref.is_(None)
        )
    )
    if rule is None:
        rule = PricingRule(scope=PricingScope.global_)
        db.add(rule)
    rule.fx_rate_jpy_mnt = rate
    rule.fx_mode = FxMode.live
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
    elif body.status == OrderStatus.REFUNDED and order.payment_status == PaymentStatus.paid:
        order.payment_status = PaymentStatus.refunded
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

    pending_orders = db.scalar(
        select(func.count()).select_from(Order).where(
            Order.payment_status == PaymentStatus.unpaid,
            Order.status.notin_((OrderStatus.CANCELLED, OrderStatus.REFUNDED)),
        )
    ) or 0
    orders_month = db.scalar(
        select(func.count()).select_from(Order).where(Order.created_at >= start_month)
    ) or 0
    revenue_month = db.scalar(
        select(func.coalesce(func.sum(Order.total_mnt), 0)).where(
            Order.created_at >= start_month, Order.payment_status == PaymentStatus.paid
        )
    ) or 0
    active_products = db.scalar(
        select(func.count()).select_from(Product).where(Product.is_active.is_(True))
    ) or 0
    rows = db.execute(
        select(Order.status, func.count()).group_by(Order.status)
    ).all()
    status_counts = [StatusCountOut(status=s, count=c) for s, c in rows]

    return DashboardOut(
        orders_today=orders_today,
        revenue_today_mnt=int(revenue_today),
        avg_margin_per_order_jpy=int(avg_margin),
        boxes_this_month=boxes_month,
        open_box_fill_percent=fill["fill_percent"],
        pending_orders=pending_orders,
        orders_this_month=orders_month,
        revenue_month_mnt=int(revenue_month),
        active_products=active_products,
        status_counts=status_counts,
    )
