from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import List, Dict

from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction, TransactionType
from app.models.investment import Investment
from app.services.market_data import MarketDataService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/net-worth")
async def get_net_worth(db: AsyncSession = Depends(get_db)):
    """Calculate total net worth (all accounts + investments)"""
    # Get all accounts
    result = await db.execute(select(Account))
    accounts = result.scalars().all()

    assets = 0.0
    liabilities = 0.0

    for account in accounts:
        if account.account_type.value in ["checking", "savings", "investment", "crypto"]:
            assets += account.balance
        elif account.account_type.value in ["credit_card", "loan"]:
            liabilities += abs(account.balance)

    # Get investment portfolio value
    inv_result = await db.execute(select(Investment))
    investments = inv_result.scalars().all()

    if investments:
        symbols = [{"symbol": inv.symbol, "exchange": inv.exchange} for inv in investments]
        prices = await MarketDataService.get_multiple_prices(symbols)

        for inv in investments:
            key = f"{inv.symbol}:{inv.exchange}"
            current_price = prices.get(key, inv.current_price)
            assets += inv.quantity * current_price

    net_worth = assets - liabilities

    return {
        "net_worth": net_worth,
        "total_assets": assets,
        "total_liabilities": liabilities,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/cash-flow")
async def get_cash_flow(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Calculate cash flow (income vs expenses) for a period"""
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()

    # Get income
    income_result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(
            and_(
                Transaction.transaction_type == TransactionType.INCOME,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            )
        )
    )
    total_income = income_result.scalar() or 0.0

    # Get expenses
    expense_result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(
            and_(
                Transaction.transaction_type == TransactionType.EXPENSE,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            )
        )
    )
    total_expenses = expense_result.scalar() or 0.0

    net_cash_flow = total_income - total_expenses

    return {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "net_cash_flow": float(net_cash_flow),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }


@router.get("/spending-by-category")
async def get_spending_by_category(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Get spending breakdown by category"""
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()

    result = await db.execute(
        select(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        )
        .where(
            and_(
                Transaction.transaction_type == TransactionType.EXPENSE,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.category.isnot(None)
            )
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    )

    categories = []
    for row in result:
        categories.append({
            "category": row.category,
            "amount": float(row.total)
        })

    total = sum(cat["amount"] for cat in categories)

    # Add percentage
    for cat in categories:
        cat["percentage"] = (cat["amount"] / total * 100) if total > 0 else 0

    return {
        "categories": categories,
        "total_spending": total,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }


@router.get("/income-vs-expenses-trend")
async def get_income_vs_expenses_trend(
    months: int = Query(default=6, ge=1, le=24),
    db: AsyncSession = Depends(get_db)
):
    """Get monthly income vs expenses trend"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)

    # Get all transactions in the period
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            )
        )
        .order_by(Transaction.transaction_date)
    )
    transactions = result.scalars().all()

    # Group by month
    monthly_data: Dict[str, Dict] = {}

    for txn in transactions:
        month_key = txn.transaction_date.strftime("%Y-%m")

        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": month_key,
                "income": 0.0,
                "expenses": 0.0
            }

        if txn.transaction_type == TransactionType.INCOME:
            monthly_data[month_key]["income"] += txn.amount
        elif txn.transaction_type == TransactionType.EXPENSE:
            monthly_data[month_key]["expenses"] += txn.amount

    # Convert to list and calculate net
    trend = []
    for month_key in sorted(monthly_data.keys()):
        data = monthly_data[month_key]
        data["net"] = data["income"] - data["expenses"]
        trend.append(data)

    return {
        "trend": trend,
        "months": months
    }


@router.get("/account-balances")
async def get_account_balances(db: AsyncSession = Depends(get_db)):
    """Get balances for all accounts"""
    result = await db.execute(select(Account).where(Account.is_active == 1))
    accounts = result.scalars().all()

    balances = []
    for account in accounts:
        balances.append({
            "id": account.id,
            "name": account.name,
            "type": account.account_type.value,
            "balance": account.balance,
            "currency": account.currency
        })

    # Sort by balance descending
    balances.sort(key=lambda x: abs(x["balance"]), reverse=True)

    return balances


@router.get("/dashboard-summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Get comprehensive dashboard summary"""
    # Get net worth
    net_worth_data = await get_net_worth(db)

    # Get cash flow for current month
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    cash_flow_data = await get_cash_flow(month_start, now, db)

    # Get spending by category for current month
    spending_data = await get_spending_by_category(month_start, now, db)

    # Get account count
    account_result = await db.execute(select(func.count(Account.id)).where(Account.is_active == 1))
    account_count = account_result.scalar() or 0

    # Get transaction count for current month
    txn_result = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.transaction_date >= month_start)
    )
    transaction_count = txn_result.scalar() or 0

    return {
        "net_worth": net_worth_data,
        "current_month_cash_flow": cash_flow_data,
        "current_month_spending": spending_data,
        "account_count": account_count,
        "current_month_transaction_count": transaction_count,
        "timestamp": datetime.now().isoformat()
    }
