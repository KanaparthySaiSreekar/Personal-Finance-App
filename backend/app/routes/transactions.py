from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.account import Account
from pydantic import BaseModel

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    account_id: int
    transaction_type: TransactionType
    amount: float
    category: str | None = None
    merchant: str | None = None
    description: str | None = None
    tags: List[str] = []
    transaction_date: datetime


class TransactionUpdate(BaseModel):
    amount: float | None = None
    category: str | None = None
    merchant: str | None = None
    description: str | None = None
    tags: List[str] | None = None
    transaction_date: datetime | None = None


@router.get("")
async def get_transactions(
    account_id: int | None = None,
    category: str | None = None,
    transaction_type: TransactionType | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get transactions with optional filters"""
    query = select(Transaction)

    filters = []
    if account_id:
        filters.append(Transaction.account_id == account_id)
    if category:
        filters.append(Transaction.category == category)
    if transaction_type:
        filters.append(Transaction.transaction_type == transaction_type)
    if start_date:
        filters.append(Transaction.transaction_date >= start_date)
    if end_date:
        filters.append(Transaction.transaction_date <= end_date)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(Transaction.transaction_date.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    transactions = result.scalars().all()
    return [txn.to_dict() for txn in transactions]


@router.get("/{transaction_id}")
async def get_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific transaction"""
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction.to_dict()


@router.post("")
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    # Verify account exists
    result = await db.execute(select(Account).where(Account.id == transaction_data.account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Create transaction
    txn_dict = transaction_data.model_dump()
    txn_dict["tags"] = ",".join(transaction_data.tags) if transaction_data.tags else ""

    transaction = Transaction(**txn_dict)
    db.add(transaction)

    # Update account balance
    if transaction_data.transaction_type == TransactionType.INCOME:
        account.balance += transaction_data.amount
    elif transaction_data.transaction_type == TransactionType.EXPENSE:
        account.balance -= transaction_data.amount

    await db.flush()
    await db.refresh(transaction)
    return transaction.to_dict()


@router.put("/{transaction_id}")
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction"""
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_dict = transaction_data.model_dump(exclude_unset=True)
    if "tags" in update_dict and update_dict["tags"]:
        update_dict["tags"] = ",".join(update_dict["tags"])

    for key, value in update_dict.items():
        setattr(transaction, key, value)

    await db.flush()
    await db.refresh(transaction)
    return transaction.to_dict()


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a transaction"""
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Reverse the balance change
    result = await db.execute(select(Account).where(Account.id == transaction.account_id))
    account = result.scalar_one_or_none()
    if account:
        if transaction.transaction_type == TransactionType.INCOME:
            account.balance -= transaction.amount
        elif transaction.transaction_type == TransactionType.EXPENSE:
            account.balance += transaction.amount

    await db.delete(transaction)
    return {"message": "Transaction deleted successfully"}


@router.get("/categories/list")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all unique categories"""
    result = await db.execute(
        select(Transaction.category)
        .where(Transaction.category.isnot(None))
        .distinct()
    )
    categories = [row[0] for row in result.all()]
    return categories
