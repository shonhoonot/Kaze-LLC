"""In-app notification feed for the signed-in customer."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification, User
from app.schemas import NotificationListOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _unread(db: Session, user_id: int) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    ) or 0


@router.get("", response_model=NotificationListOut)
def list_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    ).all()
    return NotificationListOut(items=items, unread=_unread(db, user.id))


@router.post("/{notification_id}/read", response_model=NotificationListOut)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notif = db.get(Notification, notification_id)
    if notif is None or notif.user_id != user.id:
        raise HTTPException(404, "Мэдэгдэл олдсонгүй")
    notif.is_read = True
    db.commit()
    return list_notifications(db=db, user=user)


@router.post("/read-all", response_model=NotificationListOut)
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return list_notifications(db=db, user=user)
