from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.investment import Investment
from app.models.account import Account
from app.services.market_data import MarketDataService
from pydantic import BaseModel

router = APIRouter(prefix="/api/investments", tags=["investments"])


class InvestmentCreate(BaseModel):
    account_id: int
    symbol: str
    name: str | None = None
    asset_type: str  # stock, etf, mutual_fund, crypto
    exchange: str = "US"
    quantity: float
    purchase_price: float
    currency: str = "USD"
    purchase_date: datetime | None = None


class InvestmentUpdate(BaseModel):
    quantity: float | None = None
    purchase_price: float | None = None
    name: str | None = None


@router.get("")
async def get_investments(
    account_id: int | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all investments"""
    query = select(Investment)
    if account_id:
        query = query.where(Investment.account_id == account_id)

    result = await db.execute(query)
    investments = result.scalars().all()

    # Update current prices
    if investments:
        symbols = [{"symbol": inv.symbol, "exchange": inv.exchange} for inv in investments]
        prices = await MarketDataService.get_multiple_prices(symbols)

        for inv in investments:
            key = f"{inv.symbol}:{inv.exchange}"
            inv.current_price = prices.get(key, inv.current_price)

        await db.flush()

    return [inv.to_dict() for inv in investments]


@router.get("/{investment_id}")
async def get_investment(investment_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific investment"""
    result = await db.execute(select(Investment).where(Investment.id == investment_id))
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    # Update current price
    current_price = await MarketDataService.get_current_price(
        investment.symbol,
        investment.exchange
    )
    investment.current_price = current_price
    await db.flush()

    return investment.to_dict()


@router.post("")
async def create_investment(
    investment_data: InvestmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new investment"""
    # Verify account exists
    result = await db.execute(select(Account).where(Account.id == investment_data.account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Fetch current price and info if name not provided
    if not investment_data.name:
        info = await MarketDataService.get_ticker_info(
            investment_data.symbol,
            investment_data.exchange
        )
        investment_data.name = info["name"]

    investment = Investment(**investment_data.model_dump())

    # Set current price
    investment.current_price = await MarketDataService.get_current_price(
        investment.symbol,
        investment.exchange
    )

    db.add(investment)
    await db.flush()
    await db.refresh(investment)
    return investment.to_dict()


@router.put("/{investment_id}")
async def update_investment(
    investment_id: int,
    investment_data: InvestmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an investment"""
    result = await db.execute(select(Investment).where(Investment.id == investment_id))
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    for key, value in investment_data.model_dump(exclude_unset=True).items():
        setattr(investment, key, value)

    await db.flush()
    await db.refresh(investment)
    return investment.to_dict()


@router.delete("/{investment_id}")
async def delete_investment(investment_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an investment"""
    result = await db.execute(select(Investment).where(Investment.id == investment_id))
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    await db.delete(investment)
    return {"message": "Investment deleted successfully"}


@router.post("/{investment_id}/refresh-price")
async def refresh_investment_price(investment_id: int, db: AsyncSession = Depends(get_db)):
    """Manually refresh the current price of an investment"""
    result = await db.execute(select(Investment).where(Investment.id == investment_id))
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    current_price = await MarketDataService.get_current_price(
        investment.symbol,
        investment.exchange
    )
    investment.current_price = current_price
    await db.flush()
    await db.refresh(investment)

    return investment.to_dict()


@router.get("/portfolio/summary")
async def get_portfolio_summary(db: AsyncSession = Depends(get_db)):
    """Get portfolio summary with total value and gains/losses"""
    result = await db.execute(select(Investment))
    investments = result.scalars().all()

    if not investments:
        return {
            "total_value": 0.0,
            "total_cost": 0.0,
            "total_gain_loss": 0.0,
            "total_gain_loss_percentage": 0.0,
            "holdings_count": 0
        }

    # Update all prices
    symbols = [{"symbol": inv.symbol, "exchange": inv.exchange} for inv in investments]
    prices = await MarketDataService.get_multiple_prices(symbols)

    total_value = 0.0
    total_cost = 0.0

    for inv in investments:
        key = f"{inv.symbol}:{inv.exchange}"
        inv.current_price = prices.get(key, inv.current_price)
        await db.flush()

        cost = inv.quantity * inv.purchase_price
        value = inv.quantity * inv.current_price
        total_cost += cost
        total_value += value

    total_gain_loss = total_value - total_cost
    total_gain_loss_pct = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0

    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "total_gain_loss": total_gain_loss,
        "total_gain_loss_percentage": total_gain_loss_pct,
        "holdings_count": len(investments)
    }


@router.get("/search/{query}")
async def search_ticker(query: str):
    """Search for a ticker symbol"""
    results = await MarketDataService.search_ticker(query)
    return results
