"""Unit tests for the pricing engine — the business-critical money math.

All JPY math is integer; MNT is computed only at the end.
"""
from app.pricing import PricingConfig, price_cart, price_line

DEFAULT = PricingConfig(
    markup_percent=0.10,
    service_fee_per_item_jpy=400,
    shipping_fee_per_kg_jpy=350,
    fx_rate_jpy_mnt=22.5,
)


def test_single_unit_breakdown():
    # base 1990, qty 1, weight 200g
    line = price_line(base_price_jpy=1990, qty=1, weight_grams=200, config=DEFAULT)
    assert line.markup_jpy == 199          # round(1990 * 0.10)
    assert line.service_fee_jpy == 400     # 400 * 1
    assert line.shipping_fee_jpy == 70     # round(0.2 * 350)
    assert line.subtotal_jpy == 1990
    # total = 1990 + 199 + 400 + 70 = 2659
    assert line.line_total_jpy == 2659
    assert line.line_total_mnt == round(2659 * 22.5)  # 59828
    assert line.line_total_mnt == 59828


def test_quantity_scales_all_components():
    line = price_line(base_price_jpy=1000, qty=3, weight_grams=500, config=DEFAULT)
    assert line.subtotal_jpy == 3000       # 1000 * 3
    assert line.markup_jpy == 300          # round(1000*0.1)=100, *3
    assert line.service_fee_jpy == 1200    # 400 * 3
    # unit shipping = round(0.5 * 350) = 175, * 3 = 525
    assert line.shipping_fee_jpy == 525
    assert line.weight_grams == 1500       # 500 * 3
    assert line.line_total_jpy == 3000 + 300 + 1200 + 525


def test_integer_money_no_float_drift():
    # a price that would create fractions if floats leaked through
    line = price_line(base_price_jpy=333, qty=7, weight_grams=333, config=DEFAULT)
    assert isinstance(line.line_total_jpy, int)
    assert isinstance(line.markup_jpy, int)
    assert isinstance(line.shipping_fee_jpy, int)
    # unit markup = round(333*0.1) = 33; *7 = 231
    assert line.markup_jpy == 231


def test_zero_weight_zero_shipping():
    line = price_line(base_price_jpy=500, qty=2, weight_grams=0, config=DEFAULT)
    assert line.shipping_fee_jpy == 0


def test_cart_aggregation_reconciles():
    l1 = price_line(base_price_jpy=1990, qty=1, weight_grams=200, config=DEFAULT)
    l2 = price_line(base_price_jpy=7990, qty=2, weight_grams=450, config=DEFAULT)
    cart = price_cart([l1, l2], fx_rate_jpy_mnt=22.5)

    assert cart.subtotal_jpy == l1.subtotal_jpy + l2.subtotal_jpy
    assert cart.markup_jpy == l1.markup_jpy + l2.markup_jpy
    assert cart.service_fee_jpy == l1.service_fee_jpy + l2.service_fee_jpy
    assert cart.shipping_fee_jpy == l1.shipping_fee_jpy + l2.shipping_fee_jpy
    assert cart.est_weight_grams == l1.weight_grams + l2.weight_grams
    expected_total = cart.subtotal_jpy + cart.markup_jpy + cart.service_fee_jpy + cart.shipping_fee_jpy
    assert cart.total_jpy == expected_total
    # MNT computed once on the JPY total (no compounding rounding)
    assert cart.total_mnt == round(cart.total_jpy * 22.5)


def test_mnt_computed_on_total_not_per_line():
    # Two lines whose per-line MNT rounding would differ from total rounding.
    l1 = price_line(base_price_jpy=101, qty=1, weight_grams=1, config=DEFAULT)
    l2 = price_line(base_price_jpy=103, qty=1, weight_grams=1, config=DEFAULT)
    cart = price_cart([l1, l2], fx_rate_jpy_mnt=22.5)
    assert cart.total_mnt == round(cart.total_jpy * 22.5)


def test_custom_rules_override_defaults():
    cfg = PricingConfig(
        markup_percent=0.25,
        service_fee_per_item_jpy=600,
        shipping_fee_per_kg_jpy=160,
        fx_rate_jpy_mnt=20.0,
    )
    line = price_line(base_price_jpy=2000, qty=1, weight_grams=1000, config=cfg)
    assert line.markup_jpy == 500          # 2000 * 0.25
    assert line.service_fee_jpy == 600
    assert line.shipping_fee_jpy == 160    # 1kg * 160
    assert line.line_total_jpy == 2000 + 500 + 600 + 160
    assert line.line_total_mnt == round((2000 + 500 + 600 + 160) * 20.0)


def test_invalid_qty_raises():
    import pytest

    with pytest.raises(ValueError):
        price_line(base_price_jpy=100, qty=0, weight_grams=100, config=DEFAULT)
