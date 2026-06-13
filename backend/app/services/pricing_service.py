"""Resolves DB-stored pricing_rules into a PricingConfig for the pure engine.

Precedence (most specific wins): product > category > global.
A missing field at a narrower scope is NOT inherited individually — the
narrowest matching *rule row* is used wholesale, falling back to the next
scope only when no row exists at the narrower scope. This keeps admin
configuration predictable.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Product, PricingRule, PricingScope, FxMode
from app.pricing import PricingConfig, LinePricing, price_line


def _config_from_rule(rule: PricingRule) -> PricingConfig:
    return PricingConfig(
        markup_percent=rule.markup_percent,
        service_fee_per_item_jpy=rule.service_fee_per_item_jpy,
        shipping_fee_per_kg_jpy=rule.shipping_fee_per_kg_jpy,
        fx_rate_jpy_mnt=rule.fx_rate_jpy_mnt,
    )


def _default_config() -> PricingConfig:
    return PricingConfig(
        markup_percent=settings.default_markup_percent,
        service_fee_per_item_jpy=settings.default_service_fee_per_item_jpy,
        shipping_fee_per_kg_jpy=settings.default_shipping_fee_per_kg_jpy,
        fx_rate_jpy_mnt=settings.default_fx_rate_jpy_mnt,
    )


def get_global_rule(db: Session) -> PricingRule | None:
    return db.scalar(select(PricingRule).where(PricingRule.scope == PricingScope.global_))


def resolve_config(db: Session, product: Product | None = None) -> PricingConfig:
    """Resolve the effective PricingConfig for a product (or global if None)."""
    if product is not None:
        product_rule = db.scalar(
            select(PricingRule).where(
                PricingRule.scope == PricingScope.product,
                PricingRule.scope_ref == product.id,
            )
        )
        if product_rule:
            return _resolve_fx(db, _config_from_rule(product_rule))

        if product.category_id is not None:
            cat_rule = db.scalar(
                select(PricingRule).where(
                    PricingRule.scope == PricingScope.category,
                    PricingRule.scope_ref == product.category_id,
                )
            )
            if cat_rule:
                return _resolve_fx(db, _config_from_rule(cat_rule))

    global_rule = get_global_rule(db)
    if global_rule:
        return _resolve_fx(db, _config_from_rule(global_rule))

    return _default_config()


def _resolve_fx(db: Session, config: PricingConfig) -> PricingConfig:
    """Apply live FX if the global rule is in live mode.

    Live FX is fetched/cached elsewhere; for v1 the cached value lives on the
    global rule's fx_rate_jpy_mnt (updated by a daily job). Manual mode just
    uses the stored value, so this is a no-op unless we later add a cache read.
    """
    global_rule = get_global_rule(db)
    if global_rule and global_rule.fx_mode == FxMode.live:
        # The daily job writes the live rate into the global rule, so the
        # stored fx_rate_jpy_mnt already reflects "live". We surface it here
        # so per-scope rules still honour the live global rate.
        return PricingConfig(
            markup_percent=config.markup_percent,
            service_fee_per_item_jpy=config.service_fee_per_item_jpy,
            shipping_fee_per_kg_jpy=config.shipping_fee_per_kg_jpy,
            fx_rate_jpy_mnt=global_rule.fx_rate_jpy_mnt,
        )
    return config


def price_product_line(db: Session, product: Product, qty: int = 1) -> LinePricing:
    """Convenience: resolve config + price a single product line."""
    config = resolve_config(db, product)
    return price_line(
        base_price_jpy=product.base_price_jpy,
        qty=qty,
        weight_grams=product.weight_grams,
        config=config,
    )


def price_breakdown_dict(line: LinePricing) -> dict:
    """Shape a LinePricing into the PriceBreakdown schema fields."""
    return {
        "base_price_jpy": line.base_price_jpy,
        "markup_jpy": line.markup_jpy,
        "service_fee_jpy": line.service_fee_jpy,
        "shipping_fee_jpy": line.shipping_fee_jpy,
        "unit_total_mnt": line.unit_total_mnt,
        "line_total_jpy": line.line_total_jpy,
        "line_total_mnt": line.line_total_mnt,
    }
