"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import (
    BoxStatus,
    FxMode,
    OrderStatus,
    PaymentStatus,
    PricingScope,
    ProductSource,
    UserRole,
)


# ───────────── auth ─────────────
class OtpRequest(BaseModel):
    phone: str = Field(..., examples=["+97699112233"])


class OtpRequestResponse(BaseModel):
    sent: bool
    # dev_code only populated when OTP_DEV_MODE=true
    dev_code: str | None = None


class OtpVerify(BaseModel):
    phone: str
    code: str
    name: str | None = None
    referred_by: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str | None
    phone: str
    email: str | None
    role: UserRole
    default_address: str | None
    city: str | None
    district: str | None
    referral_code: str | None
    referral_credit_jpy: int


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    default_address: str | None = None
    city: str | None = None
    district: str | None = None


# ───────────── categories ─────────────
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name_mn: str
    name_ja: str | None
    slug: str
    parent_id: int | None
    icon: str | None


class CategoryIn(BaseModel):
    name_mn: str
    name_ja: str | None = None
    slug: str
    parent_id: int | None = None
    icon: str | None = None


# ───────────── products ─────────────
class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    sort_order: int


class PriceBreakdown(BaseModel):
    base_price_jpy: int
    markup_jpy: int
    service_fee_jpy: int
    shipping_fee_jpy: int
    unit_total_mnt: int
    line_total_jpy: int
    line_total_mnt: int


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: ProductSource
    source_url: str | None
    sku: str | None
    title_mn: str
    title_ja: str | None
    brand: str | None
    category_id: int | None
    base_price_jpy: int
    weight_grams: int
    dimensions: str | None
    reference_price_mnt: int | None
    in_stock: bool
    is_active: bool
    images: list[ProductImageOut] = []
    # computed for the customer (qty=1)
    price: PriceBreakdown | None = None


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


class ProductScrapeIn(BaseModel):
    url: str


class ProductScrapeOut(BaseModel):
    source: ProductSource
    source_url: str
    title_ja: str | None = None
    title_mn: str | None = None
    brand: str | None = None
    base_price_jpy: int | None = None
    image_url: str | None = None
    weight_grams: int = 500
    fetched: bool = False
    note: str | None = None


class ProductImageIn(BaseModel):
    url: str
    sort_order: int = 0


class ProductIn(BaseModel):
    source: ProductSource = ProductSource.other
    source_url: str | None = None
    sku: str | None = None
    title_mn: str
    title_ja: str | None = None
    brand: str | None = None
    category_id: int | None = None
    base_price_jpy: int
    weight_grams: int = 500
    dimensions: str | None = None
    reference_price_mnt: int | None = None
    in_stock: bool = True
    is_active: bool = True
    images: list[ProductImageIn] = []


class ProductUpdate(BaseModel):
    source: ProductSource | None = None
    source_url: str | None = None
    sku: str | None = None
    title_mn: str | None = None
    title_ja: str | None = None
    brand: str | None = None
    category_id: int | None = None
    base_price_jpy: int | None = None
    weight_grams: int | None = None
    dimensions: str | None = None
    reference_price_mnt: int | None = None
    in_stock: bool | None = None
    is_active: bool | None = None


# ───────────── cart ─────────────
class CartItemIn(BaseModel):
    product_id: int
    qty: int = 1
    bag_note: str | None = None


class CartItemUpdate(BaseModel):
    qty: int | None = None
    bag_note: str | None = None


class CartLineOut(BaseModel):
    id: int
    product_id: int
    title_mn: str
    qty: int
    weight_grams: int
    image_url: str | None
    bag_note: str | None
    price: PriceBreakdown


class BoxFillOut(BaseModel):
    current_weight_grams: int
    capacity_grams: int
    fill_percent: float
    remaining_grams: int
    est_days_to_full: int | None = None
    est_ship_date: str | None = None
    est_arrival_date: str | None = None


class CartOut(BaseModel):
    id: int
    lines: list[CartLineOut]
    subtotal_jpy: int
    markup_jpy: int
    service_fee_jpy: int
    shipping_fee_jpy: int
    est_weight_grams: int
    total_jpy: int
    total_mnt: int
    fx_rate_used: float
    box_fill: BoxFillOut | None = None


# ───────────── orders ─────────────
class OrderCreate(BaseModel):
    delivery_address: str
    delivery_phone: str


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    title_mn_snapshot: str | None
    qty: int
    unit_price_jpy: int
    line_total_jpy: int
    weight_grams: int


class OrderEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: OrderStatus
    note: str | None
    created_at: datetime


class OrderPhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    caption: str | None
    created_at: datetime


class OrderPhotoIn(BaseModel):
    url: str
    caption: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: OrderStatus
    subtotal_jpy: int
    markup_jpy: int
    service_fee_jpy: int
    est_weight_grams: int
    shipping_fee_jpy: int
    total_jpy: int
    total_mnt: int
    fx_rate_used: float
    delivery_address: str | None
    delivery_phone: str | None
    payment_status: PaymentStatus
    created_at: datetime
    items: list[OrderItemOut] = []
    events: list[OrderEventOut] = []
    photos: list[OrderPhotoOut] = []


# ───────────── notifications ─────────────
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int | None
    title: str
    body: str | None
    is_read: bool
    created_at: datetime


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    unread: int


# ───────────── pricing rules (admin) ─────────────
class PricingRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    scope: PricingScope
    scope_ref: int | None
    markup_percent: float
    service_fee_per_item_jpy: int
    shipping_fee_per_kg_jpy: int
    fx_rate_jpy_mnt: float
    fx_mode: FxMode
    updated_at: datetime


class PricingRuleIn(BaseModel):
    scope: PricingScope = PricingScope.global_
    scope_ref: int | None = None
    markup_percent: float = 0.10
    service_fee_per_item_jpy: int = 400
    shipping_fee_per_kg_jpy: int = 350
    fx_rate_jpy_mnt: float = 22.5
    fx_mode: FxMode = FxMode.manual


# ───────────── payments ─────────────
class QPayInvoiceCreate(BaseModel):
    order_id: int


class QPayInvoiceOut(BaseModel):
    invoice_id: str
    qr_text: str
    qr_image: str | None = None
    deeplink: str | None = None
    amount_mnt: int


class QPayCallback(BaseModel):
    invoice_id: str
    payment_status: str
    order_id: int | None = None


# ───────────── boxes (admin) ─────────────
class BoxOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    status: BoxStatus
    capacity_grams: int
    current_weight_grams: int
    ship_cost_jpy: int
    created_at: datetime


class BoxItemIn(BaseModel):
    order_id: int
    bag_label: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: str | None = None


# ───────────── dashboard ─────────────
class StatusCountOut(BaseModel):
    status: OrderStatus
    count: int


class DashboardOut(BaseModel):
    orders_today: int
    revenue_today_mnt: int
    avg_margin_per_order_jpy: int
    boxes_this_month: int
    open_box_fill_percent: float
    pending_orders: int = 0
    orders_this_month: int = 0
    revenue_month_mnt: int = 0
    active_products: int = 0
    status_counts: list[StatusCountOut] = []


TokenResponse.model_rebuild()


# ───────────── wishlist ─────────────
class WishlistOut(BaseModel):
    product_ids: list[int]
    items: list[ProductOut] = []
