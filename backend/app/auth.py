"""Authentication: JWT issuance/verification and FastAPI dependencies.

Auth flow is phone + OTP (see routers/auth.py). Once verified we issue a JWT.
"""
from __future__ import annotations

import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def generate_referral_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Нэвтрэх шаардлагатай")
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Хүчингүй токен")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Хэрэглэгч олдсонгүй")
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Like get_current_user but returns None instead of raising when anonymous."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        return db.get(User, int(payload["sub"]))
    except (JWTError, KeyError, ValueError):
        return None


def require_staff(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.admin, UserRole.staff):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Зөвшөөрөлгүй")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Зөвшөөрөлгүй")
    return user
