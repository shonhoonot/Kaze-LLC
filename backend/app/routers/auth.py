"""Phone + OTP authentication (Mongolian numbers, +976)."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import create_access_token, generate_otp, generate_referral_code, get_current_user
from app.config import settings
from app.database import get_db
from app.models import OtpCode, User
from app.schemas import OtpRequest, OtpRequestResponse, OtpVerify, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("kaze.auth")

OTP_TTL_MINUTES = 5


def _normalize_phone(phone: str) -> str:
    p = phone.strip().replace(" ", "").replace("-", "")
    if not p.startswith("+"):
        # assume Mongolian local 8-digit number
        p = "+976" + p.lstrip("0")
    return p


@router.post("/otp/request", response_model=OtpRequestResponse)
def request_otp(body: OtpRequest, db: Session = Depends(get_db)):
    phone = _normalize_phone(body.phone)
    code = generate_otp()
    otp = OtpCode(
        phone=phone,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
    )
    db.add(otp)
    db.commit()

    # TODO: integrate real SMS provider when sms_provider != "stub"
    log.info("OTP for %s: %s", phone, code)
    return OtpRequestResponse(sent=True, dev_code=code if settings.otp_dev_mode else None)


@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(body: OtpVerify, db: Session = Depends(get_db)):
    phone = _normalize_phone(body.phone)
    otp = db.scalar(
        select(OtpCode)
        .where(OtpCode.phone == phone, OtpCode.code == body.code, OtpCode.consumed.is_(False))
        .order_by(OtpCode.created_at.desc())
    )
    if otp is None:
        raise HTTPException(400, "Код буруу байна")
    expires_at = otp.expires_at
    if expires_at.tzinfo is None:
        # Some backends (e.g. SQLite) return naive datetimes; treat as UTC.
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "Кодны хугацаа дууссан")

    otp.consumed = True

    user = db.scalar(select(User).where(User.phone == phone))
    if user is None:
        user = User(
            phone=phone,
            name=body.name,
            referral_code=generate_referral_code(),
            referred_by=body.referred_by,
        )
        db.add(user)
        db.flush()
        # referral credit for the referrer (service-fee credit, in JPY)
        if body.referred_by:
            referrer = db.scalar(select(User).where(User.referral_code == body.referred_by))
            if referrer:
                referrer.referral_credit_jpy += 400

    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
