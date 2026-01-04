from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.account import Account, AccountType
from pydantic import BaseModel

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class AccountCreate(BaseModel):
    name: str
    account_type: AccountType
    balance: float = 0.0
    currency: str = "USD"
    institution: str | None = None
    account_number: str | None = None
    notes: str | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    balance: float | None = None
    institution: str | None = None
    account_number: str | None = None
    notes: str | None = None
    is_active: bool | None = None


@router.get("")
async def get_accounts(db: AsyncSession = Depends(get_db)):
    """Get all accounts"""
    result = await db.execute(select(Account))
    accounts = result.scalars().all()
    return [account.to_dict() for account in accounts]


@router.get("/{account_id}")
async def get_account(account_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific account"""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account.to_dict()


@router.post("")
async def create_account(account_data: AccountCreate, db: AsyncSession = Depends(get_db)):
    """Create a new account"""
    account = Account(**account_data.model_dump())
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account.to_dict()


@router.put("/{account_id}")
async def update_account(
    account_id: int,
    account_data: AccountUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an account"""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    for key, value in account_data.model_dump(exclude_unset=True).items():
        if key == "is_active":
            setattr(account, key, 1 if value else 0)
        else:
            setattr(account, key, value)

    await db.flush()
    await db.refresh(account)
    return account.to_dict()


@router.delete("/{account_id}")
async def delete_account(account_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an account"""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    await db.delete(account)
    return {"message": "Account deleted successfully"}
