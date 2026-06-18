"""Public contact form — visitors send a message; staff handle it in admin."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user_optional
from app.database import get_db
from app.models import ContactMessage, User
from app.schemas import ContactIn, ContactOut

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactOut, status_code=201)
def submit_contact(
    body: ContactIn,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    contact = (body.contact or "").strip()
    message = (body.message or "").strip()
    if not contact or not message:
        raise HTTPException(400, "Холбоо барих мэдээлэл болон зурвасаа бөглөнө үү")
    msg = ContactMessage(
        user_id=user.id if user else None,
        name=(body.name or "").strip() or (user.name if user else None),
        contact=contact,
        message=message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
