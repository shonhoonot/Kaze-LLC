"""SQLAlchemy ORM models — the PostgreSQL data model for Kaze Shop.

Money is stored as integer JPY everywhere to avoid float drift.
MNT is only ever computed for display/charging.
"""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ─────────────────────────── enums ───────────────────────────
class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    staff = "staff"


class ProductSource(str, enum.Enum):
    amazon_jp = "amazon_jp"
    uniqlo = "uniqlo"
    gu = "gu"
    other = "other"


class PricingScope(str, enum.Enum):
    global_ = "global"
    category = "category"
    product = "product"


class FxMode(str, enum.Enum):
    live = "live"
    manual = "manual"


class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    PAID = "PAID"
    PURCHASING_IN_JP = "PURCHASING_IN_JP"
    RECEIVED_AT_JP_WAREHOUSE = "RECEIVED_AT_JP_WAREHOUSE"
    PACKED = "PACKED"
    SHIPPED_CARGO = "SHIPPED_CARGO"
    ARRIVED_MN = "ARRIVED_MN"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentStatus(str, enum.Enum):
    unpaid = "unpaid"
    pending = "pending"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"


class CartStatus(str, enum.Enum):
    active = "active"
    converted = "converted"
    abandoned = "abandoned"


class BoxStatus(str, enum.Enum):
    OPEN = "OPEN"
    PACKING = "PACKING"
    SHIPPED = "SHIPPED"
    ARRIVED = "ARRIVED"


# ─────────────────────────── models ───────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.customer)
    default_address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(120))
    district: Mapped[str | None] = mapped_column(String(120))
    referral_code: Mapped[str | None] = mapped_column(String(16), unique=True, index=True)
    referred_by: Mapped[str | None] = mapped_column(String(16))
    referral_credit_jpy: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    carts: Mapped[list[Cart]] = relationship(back_populates="user")
    orders: Mapped[list[Order]] = relationship(back_populates="user")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    code: Mapped[str] = mapped_column(String(8))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    consumed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_mn: Mapped[str] = mapped_column(String(120))
    name_ja: Mapped[str | None] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    icon: Mapped[str | None] = mapped_column(String(64))

    products: Mapped[list[Product]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[ProductSource] = mapped_column(Enum(ProductSource), default=ProductSource.other)
    source_url: Mapped[str | None] = mapped_column(Text)
    sku: Mapped[str | None] = mapped_column(String(64), index=True)
    title_mn: Mapped[str] = mapped_column(String(255))
    title_ja: Mapped[str | None] = mapped_column(String(255))
    brand: Mapped[str | None] = mapped_column(String(120), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), index=True)
    base_price_jpy: Mapped[int] = mapped_column(Integer)
    weight_grams: Mapped[int] = mapped_column(Integer, default=500)
    dimensions: Mapped[str | None] = mapped_column(String(64))
    reference_price_mnt: Mapped[int | None] = mapped_column(Integer)  # optional market-comparison badge
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped[Category | None] = relationship(back_populates="products")
    images: Mapped[list[ProductImage]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order"
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship(back_populates="images")


class PricingRule(Base):
    __tablename__ = "pricing_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    scope: Mapped[PricingScope] = mapped_column(Enum(PricingScope), default=PricingScope.global_)
    # scope_ref: category_id or product_id depending on scope (null for global)
    scope_ref: Mapped[int | None] = mapped_column(Integer, index=True)
    markup_percent: Mapped[float] = mapped_column(Float, default=0.10)
    service_fee_per_item_jpy: Mapped[int] = mapped_column(Integer, default=400)
    shipping_fee_per_kg_jpy: Mapped[int] = mapped_column(Integer, default=350)
    fx_rate_jpy_mnt: Mapped[float] = mapped_column(Float, default=22.5)
    fx_mode: Mapped[FxMode] = mapped_column(Enum(FxMode), default=FxMode.manual)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[CartStatus] = mapped_column(Enum(CartStatus), default=CartStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="carts")
    items: Mapped[list[CartItem]] = relationship(
        back_populates="cart", cascade="all, delete-orphan"
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    qty: Mapped[int] = mapped_column(Integer, default=1)
    unit_price_jpy_snapshot: Mapped[int] = mapped_column(Integer)  # base_price at add-time
    bag_note: Mapped[str | None] = mapped_column(Text)

    cart: Mapped[Cart] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PLACED, index=True)
    subtotal_jpy: Mapped[int] = mapped_column(Integer, default=0)
    markup_jpy: Mapped[int] = mapped_column(Integer, default=0)
    service_fee_jpy: Mapped[int] = mapped_column(Integer, default=0)
    est_weight_grams: Mapped[int] = mapped_column(Integer, default=0)
    shipping_fee_jpy: Mapped[int] = mapped_column(Integer, default=0)
    total_jpy: Mapped[int] = mapped_column(Integer, default=0)
    total_mnt: Mapped[int] = mapped_column(Integer, default=0)
    fx_rate_used: Mapped[float] = mapped_column(Float, default=22.5)
    delivery_address: Mapped[str | None] = mapped_column(Text)
    delivery_phone: Mapped[str | None] = mapped_column(String(20))
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.unpaid)
    payment_ref: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    events: Mapped[list[OrderEvent]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderEvent.created_at"
    )
    photos: Mapped[list[OrderPhoto]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderPhoto.created_at"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    title_mn_snapshot: Mapped[str | None] = mapped_column(String(255))
    qty: Mapped[int] = mapped_column(Integer, default=1)
    unit_price_jpy: Mapped[int] = mapped_column(Integer)
    line_total_jpy: Mapped[int] = mapped_column(Integer)
    weight_grams: Mapped[int] = mapped_column(Integer, default=0)

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()


class OrderEvent(Base):
    __tablename__ = "order_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped[Order] = relationship(back_populates="events")


class OrderPhoto(Base):
    """Warehouse/proof photos staff attach to an order (builds buyer trust)."""

    __tablename__ = "order_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(Text)
    caption: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped[Order] = relationship(back_populates="photos")


class Box(Base):
    __tablename__ = "boxes"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    status: Mapped[BoxStatus] = mapped_column(Enum(BoxStatus), default=BoxStatus.OPEN)
    capacity_grams: Mapped[int] = mapped_column(Integer, default=25000)
    current_weight_grams: Mapped[int] = mapped_column(Integer, default=0)
    ship_cost_jpy: Mapped[int] = mapped_column(Integer, default=4000)
    departed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list[BoxItem]] = relationship(
        back_populates="box", cascade="all, delete-orphan"
    )


class BoxItem(Base):
    __tablename__ = "box_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    box_id: Mapped[int] = mapped_column(ForeignKey("boxes.id", ondelete="CASCADE"), index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    bag_label: Mapped[str | None] = mapped_column(String(64))
    weight_grams: Mapped[int] = mapped_column(Integer, default=0)

    box: Mapped[Box] = relationship(back_populates="items")
    order: Mapped[Order] = relationship()


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped[Product] = relationship()


class Notification(Base):
    """In-app notification feed entry (order updates, promos)."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str | None] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
