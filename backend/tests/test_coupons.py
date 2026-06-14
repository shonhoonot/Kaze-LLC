"""Unit tests for coupon discount math (pure, no DB)."""
from app.models import Coupon, CouponType
from app.services.coupons import compute_discount


def _coupon(**kw) -> Coupon:
    base = dict(discount_type=CouponType.percent, value=10, max_discount_jpy=None)
    base.update(kw)
    return Coupon(**base)


def test_percent_discount():
    assert compute_discount(_coupon(value=10), 10000) == 1000


def test_percent_rounds():
    # 10% of 1995 = 199.5 -> 200
    assert compute_discount(_coupon(value=10), 1995) == 200


def test_percent_cap_applies():
    assert compute_discount(_coupon(value=20, max_discount_jpy=500), 10000) == 500


def test_fixed_discount():
    c = _coupon(discount_type=CouponType.fixed_jpy, value=800)
    assert compute_discount(c, 10000) == 800


def test_fixed_never_exceeds_subtotal():
    c = _coupon(discount_type=CouponType.fixed_jpy, value=5000)
    assert compute_discount(c, 3000) == 3000


def test_percent_discount_never_exceeds_subtotal():
    # pathological: 100% with no cap still floored at subtotal
    assert compute_discount(_coupon(value=100), 2500) == 2500
