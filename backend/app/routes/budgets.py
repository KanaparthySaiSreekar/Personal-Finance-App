from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionType
from pydantic import BaseModel

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


class BudgetCreate(BaseModel):
    category: str
    amount: float
    period: str = "monthly"


class BudgetUpdate(BaseModel):
    amount: float | None = None
    period: str | None = None


@router.get("")
async def get_budgets(db: AsyncSession = Depends(get_db)):
    """Get all budgets with current spending"""
    result = await db.execute(select(Budget))
    budgets = result.scalars().all()

    # Update spent amounts based on current period
    for budget in budgets:
        spent = await calculate_budget_spent(db, budget.category, budget.period)
        budget.spent = spent

    await db.flush()
    return [budget.to_dict() for budget in budgets]


@router.get("/{budget_id}")
async def get_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific budget"""
    result = await db.execute(select(Budget).where(Budget.id == budget_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Update spent amount
    spent = await calculate_budget_spent(db, budget.category, budget.period)
    budget.spent = spent
    await db.flush()

    return budget.to_dict()


@router.post("")
async def create_budget(budget_data: BudgetCreate, db: AsyncSession = Depends(get_db)):
    """Create a new budget"""
    # Check if budget for this category already exists
    result = await db.execute(select(Budget).where(Budget.category == budget_data.category))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this category already exists")

    budget = Budget(**budget_data.model_dump())
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return budget.to_dict()


@router.put("/{budget_id}")
async def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a budget"""
    result = await db.execute(select(Budget).where(Budget.id == budget_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    for key, value in budget_data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)

    await db.flush()
    await db.refresh(budget)
    return budget.to_dict()


@router.delete("/{budget_id}")
async def delete_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a budget"""
    result = await db.execute(select(Budget).where(Budget.id == budget_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    await db.delete(budget)
    return {"message": "Budget deleted successfully"}


async def calculate_budget_spent(db: AsyncSession, category: str, period: str) -> float:
    """Calculate total spending for a budget category in the current period"""
    now = datetime.now()

    if period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "yearly":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = now - timedelta(days=30)  # Default to 30 days

    result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(
            and_(
                Transaction.category == category,
                Transaction.transaction_type == TransactionType.EXPENSE,
                Transaction.transaction_date >= start_date
            )
        )
    )
    spent = result.scalar() or 0.0
    return float(spent)
