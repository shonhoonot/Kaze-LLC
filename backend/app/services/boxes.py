"""Box-fill helpers — power the 'box X% full' urgency UX on home & cart."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Box, BoxStatus


def get_open_box(db: Session) -> Box | None:
    """The current box being filled (oldest OPEN box)."""
    return db.scalar(
        select(Box).where(Box.status == BoxStatus.OPEN).order_by(Box.created_at).limit(1)
    )


def box_fill_payload(box: Box | None) -> dict:
    capacity = box.capacity_grams if box else 25000
    current = box.current_weight_grams if box else 0
    remaining = max(capacity - current, 0)
    fill = round(current / capacity * 100, 1) if capacity else 0.0
    return {
        "current_weight_grams": current,
        "capacity_grams": capacity,
        "fill_percent": fill,
        "remaining_grams": remaining,
    }
