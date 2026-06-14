"""Box-fill helpers — power the 'box X% full' urgency UX on home & cart,
plus an estimated ship/arrival date projection."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Box, BoxStatus


def get_open_box(db: Session) -> Box | None:
    """The current box being filled (oldest OPEN box)."""
    return db.scalar(
        select(Box).where(Box.status == BoxStatus.OPEN).order_by(Box.created_at).limit(1)
    )


def estimate_dates(remaining_grams: int) -> dict:
    """Project when the current box ships and arrives in Mongolia.

    Heuristic (no historical velocity needed): days-to-full = remaining /
    avg fill-per-day, then add JP handling + sea transit. Purely indicative.
    """
    per_day = max(settings.box_fill_grams_per_day, 1)
    days_to_full = max(round(remaining_grams / per_day), 0)
    now = datetime.now(timezone.utc)
    ship_date = now + timedelta(days=days_to_full + settings.jp_handling_days)
    arrival_date = ship_date + timedelta(days=settings.sea_transit_days)
    return {
        "est_days_to_full": days_to_full,
        "est_ship_date": ship_date.date().isoformat(),
        "est_arrival_date": arrival_date.date().isoformat(),
    }


def box_fill_payload(box: Box | None, *, extra_grams: int = 0) -> dict:
    """Box-fill snapshot. `extra_grams` projects the user's cart on top."""
    capacity = box.capacity_grams if box else 25000
    current = (box.current_weight_grams if box else 0) + extra_grams
    remaining = max(capacity - current, 0)
    fill = round(min(current / capacity * 100, 100), 1) if capacity else 0.0
    payload = {
        "current_weight_grams": current,
        "capacity_grams": capacity,
        "fill_percent": fill,
        "remaining_grams": remaining,
    }
    payload.update(estimate_dates(remaining))
    return payload
