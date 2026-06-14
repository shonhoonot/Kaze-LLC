"""Address book — saved delivery addresses for faster checkout."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Address, User
from app.schemas import AddressIn, AddressOut, AddressUpdate

router = APIRouter(prefix="/addresses", tags=["addresses"])


def _list(db: Session, user: User) -> list[Address]:
    return db.scalars(
        select(Address)
        .where(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    ).all()


def _clear_defaults(db: Session, user: User, keep_id: int | None = None) -> None:
    for addr in db.scalars(
        select(Address).where(Address.user_id == user.id, Address.is_default.is_(True))
    ):
        if addr.id != keep_id:
            addr.is_default = False


@router.get("", response_model=list[AddressOut])
def list_addresses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _list(db, user)


@router.post("", response_model=AddressOut, status_code=201)
def create_address(body: AddressIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = _list(db, user)
    address = Address(user_id=user.id, **body.model_dump())
    # first address is always the default; honour an explicit default request too
    if body.is_default or not existing:
        _clear_defaults(db, user)
        address.is_default = True
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.patch("/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    body: AddressUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    address = db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(404, "Хаяг олдсонгүй")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_default"):
        _clear_defaults(db, user, keep_id=address.id)
    for field, value in data.items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=204)
def delete_address(address_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    address = db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(404, "Хаяг олдсонгүй")
    was_default = address.is_default
    db.delete(address)
    db.flush()
    # promote the most recent remaining address to default
    if was_default:
        nxt = db.scalar(
            select(Address)
            .where(Address.user_id == user.id)
            .order_by(Address.created_at.desc())
        )
        if nxt:
            nxt.is_default = True
    db.commit()
