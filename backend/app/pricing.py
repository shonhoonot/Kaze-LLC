"""Pricing engine — the single source of truth for customer-facing prices.

Design rules (from the spec):
  * All money math is done in INTEGER JPY to avoid float drift.
  * MNT is computed only for display/charging, at the very end.
  * Pricing rules are resolvable at product > category > global precedence.

Formula (per line item):
    markup_jpy        = round(base_price_jpy * markup_percent)
    service_fee_jpy   = service_fee_per_item_jpy * qty
    shipping_fee_jpy  = round((weight_grams / 1000) * shipping_fee_per_kg_jpy) * qty
    line_subtotal_jpy = (base_price_jpy + markup_jpy) * qty
    line_total_jpy    = line_subtotal_jpy + service_fee_jpy + shipping_fee_jpy
    display_mnt       = round(line_total_jpy * fx_rate_jpy_mnt)

`markup_jpy` here is the markup for a *single* unit; the breakdown returned
multiplies it by qty so totals reconcile exactly.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict


@dataclass(frozen=True)
class PricingConfig:
    """Resolved pricing parameters for a given product/category/global scope."""

    markup_percent: float = 0.10
    service_fee_per_item_jpy: int = 400
    shipping_fee_per_kg_jpy: int = 350
    fx_rate_jpy_mnt: float = 22.5


@dataclass(frozen=True)
class LinePricing:
    base_price_jpy: int
    qty: int
    weight_grams: int
    markup_jpy: int          # total markup across qty
    service_fee_jpy: int     # total service fee across qty
    shipping_fee_jpy: int    # total shipping across qty
    subtotal_jpy: int        # (base + markup) * qty, markup excluded
    line_total_jpy: int      # everything, in JPY
    line_total_mnt: int      # display value
    unit_total_jpy: int      # per-unit all-in value in JPY
    unit_total_mnt: int      # per-unit display value (rounded)

    def as_dict(self) -> dict:
        return asdict(self)


def price_line(
    base_price_jpy: int,
    qty: int,
    weight_grams: int,
    config: PricingConfig,
) -> LinePricing:
    """Compute the full price breakdown for a single line item.

    Everything is integer JPY until the final MNT conversion.
    """
    if qty < 1:
        raise ValueError("qty must be >= 1")
    if base_price_jpy < 0 or weight_grams < 0:
        raise ValueError("base_price_jpy and weight_grams must be non-negative")

    unit_markup_jpy = round(base_price_jpy * config.markup_percent)
    markup_jpy = unit_markup_jpy * qty

    service_fee_jpy = config.service_fee_per_item_jpy * qty

    unit_shipping_jpy = round((weight_grams / 1000) * config.shipping_fee_per_kg_jpy)
    shipping_fee_jpy = unit_shipping_jpy * qty

    subtotal_jpy = base_price_jpy * qty  # raw product cost (markup tracked separately)

    line_total_jpy = subtotal_jpy + markup_jpy + service_fee_jpy + shipping_fee_jpy
    line_total_mnt = round(line_total_jpy * config.fx_rate_jpy_mnt)

    unit_total_jpy = base_price_jpy + unit_markup_jpy + config.service_fee_per_item_jpy + unit_shipping_jpy
    unit_total_mnt = round(unit_total_jpy * config.fx_rate_jpy_mnt)

    return LinePricing(
        base_price_jpy=base_price_jpy,
        qty=qty,
        weight_grams=weight_grams * qty,
        markup_jpy=markup_jpy,
        service_fee_jpy=service_fee_jpy,
        shipping_fee_jpy=shipping_fee_jpy,
        subtotal_jpy=subtotal_jpy,
        line_total_jpy=line_total_jpy,
        line_total_mnt=line_total_mnt,
        unit_total_jpy=unit_total_jpy,
        unit_total_mnt=unit_total_mnt,
    )


@dataclass(frozen=True)
class CartPricing:
    subtotal_jpy: int
    markup_jpy: int
    service_fee_jpy: int
    shipping_fee_jpy: int
    est_weight_grams: int
    total_jpy: int
    total_mnt: int
    fx_rate_used: float
    lines: list[LinePricing]

    def as_dict(self) -> dict:
        d = asdict(self)
        d["lines"] = [line.as_dict() for line in self.lines]
        return d


def price_cart(lines: list[LinePricing], fx_rate_jpy_mnt: float) -> CartPricing:
    """Aggregate already-priced lines into a cart/order total.

    JPY components are summed as integers; MNT is computed once on the
    JPY total so per-line rounding never compounds.
    """
    subtotal_jpy = sum(l.subtotal_jpy for l in lines)
    markup_jpy = sum(l.markup_jpy for l in lines)
    service_fee_jpy = sum(l.service_fee_jpy for l in lines)
    shipping_fee_jpy = sum(l.shipping_fee_jpy for l in lines)
    est_weight_grams = sum(l.weight_grams for l in lines)
    total_jpy = subtotal_jpy + markup_jpy + service_fee_jpy + shipping_fee_jpy
    total_mnt = round(total_jpy * fx_rate_jpy_mnt)

    return CartPricing(
        subtotal_jpy=subtotal_jpy,
        markup_jpy=markup_jpy,
        service_fee_jpy=service_fee_jpy,
        shipping_fee_jpy=shipping_fee_jpy,
        est_weight_grams=est_weight_grams,
        total_jpy=total_jpy,
        total_mnt=total_mnt,
        fx_rate_used=fx_rate_jpy_mnt,
        lines=lines,
    )
