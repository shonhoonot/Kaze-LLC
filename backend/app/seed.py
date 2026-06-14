"""Seed the database with demo data: pricing rule, 3 categories, ~12 products,
and an open box. Idempotent-ish: skips if products already exist.

Run with:  python -m app.seed
"""
from __future__ import annotations

from sqlalchemy import select

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import (
    Box,
    BoxStatus,
    Category,
    Coupon,
    CouponType,
    FxMode,
    PricingRule,
    PricingScope,
    Product,
    ProductImage,
    ProductSource,
    User,
    UserRole,
)

PLACEHOLDER = "https://placehold.co/600x600/f5f5f5/333333?text=Kaze"


def _img(label: str) -> str:
    return f"https://placehold.co/600x600/f5f5f5/222?text={label.replace(' ', '+')}"


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # global pricing rule
        if not db.scalar(select(PricingRule).where(PricingRule.scope == PricingScope.global_)):
            db.add(
                PricingRule(
                    scope=PricingScope.global_,
                    markup_percent=settings.default_markup_percent,
                    service_fee_per_item_jpy=settings.default_service_fee_per_item_jpy,
                    shipping_fee_per_kg_jpy=settings.default_shipping_fee_per_kg_jpy,
                    fx_rate_jpy_mnt=settings.default_fx_rate_jpy_mnt,
                    fx_mode=FxMode.manual,
                )
            )

        # admin user (login via OTP using this phone)
        if not db.scalar(select(User).where(User.phone == "+97699000000")):
            db.add(
                User(
                    name="Kaze Admin",
                    phone="+97699000000",
                    role=UserRole.admin,
                    referral_code="KAZEADMIN",
                )
            )

        # open box
        if not db.scalar(select(Box).where(Box.status == BoxStatus.OPEN)):
            db.add(Box(code="KZ-DEMO-001", status=BoxStatus.OPEN, current_weight_grams=18400))

        if db.scalar(select(Product).limit(1)):
            db.commit()
            print("Products already seeded; skipping product insert.")
            return

        cats = {
            "clothing": Category(name_mn="Хувцас", name_ja="衣類", slug="clothing", icon="shirt"),
            "beauty": Category(name_mn="Гоо сайхан", name_ja="美容", slug="beauty", icon="sparkles"),
            "electronics": Category(name_mn="Цахилгаан бараа", name_ja="電子機器", slug="electronics", icon="cpu"),
        }
        for c in cats.values():
            db.add(c)
        db.flush()

        products = [
            # clothing
            ("Uniqlo U Crew Neck T-Shirt", "ユニクロU クルーネックT", "Uniqlo", ProductSource.uniqlo, "clothing", 1990, 200),
            ("Uniqlo Ultra Light Down Jacket", "ウルトラライトダウン", "Uniqlo", ProductSource.uniqlo, "clothing", 7990, 450),
            ("GU Wide Fit Jeans", "GU ワイドフィットジーンズ", "GU", ProductSource.gu, "clothing", 2990, 600),
            ("GU Sweat Hoodie", "GU スウェットパーカ", "GU", ProductSource.gu, "clothing", 1990, 550),
            ("Uniqlo HEATTECH Innerwear", "ヒートテック", "Uniqlo", ProductSource.uniqlo, "clothing", 1500, 150),
            # beauty
            ("Shiseido Senka Perfect Whip", "専科 パーフェクトホイップ", "Shiseido", ProductSource.amazon_jp, "beauty", 500, 120),
            ("Hada Labo Gokujyun Lotion", "肌ラボ 極潤", "Hada Labo", ProductSource.amazon_jp, "beauty", 800, 200),
            ("Biore UV Aqua Rich Sunscreen", "ビオレUV アクアリッチ", "Biore", ProductSource.amazon_jp, "beauty", 700, 90),
            ("DHC Deep Cleansing Oil", "DHC 薬用ディープクレンジングオイル", "DHC", ProductSource.amazon_jp, "beauty", 1400, 250),
            # electronics
            ("Anker PowerCore 10000", "Anker モバイルバッテリー", "Anker", ProductSource.amazon_jp, "electronics", 2990, 220),
            ("Sony WF-C500 Earbuds", "ソニー ワイヤレスイヤホン", "Sony", ProductSource.amazon_jp, "electronics", 7900, 110),
            ("Casio Standard Watch", "カシオ スタンダード", "Casio", ProductSource.amazon_jp, "electronics", 3500, 130),
        ]

        for title_mn, title_ja, brand, source, cat_slug, price, weight in products:
            p = Product(
                title_mn=title_mn,
                title_ja=title_ja,
                brand=brand,
                source=source,
                category_id=cats[cat_slug].id,
                base_price_jpy=price,
                weight_grams=weight,
                in_stock=True,
                is_active=True,
            )
            p.images = [ProductImage(url=_img(brand), sort_order=0)]
            db.add(p)

        db.commit()
        print(f"Seeded {len(cats)} categories and {len(products)} products.")

        # sample coupon for demos
        if not db.scalar(select(Coupon).where(Coupon.code == "WELCOME10")):
            db.add(
                Coupon(
                    code="WELCOME10",
                    discount_type=CouponType.percent,
                    value=10,
                    min_subtotal_jpy=3000,
                    max_discount_jpy=1000,
                )
            )
            db.commit()
            print("Seeded sample coupon WELCOME10.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
