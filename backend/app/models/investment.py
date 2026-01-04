from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Investment(Base):
    """Tracks individual investment holdings (stocks, ETFs, mutual funds, crypto)"""
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    symbol = Column(String, nullable=False)  # Ticker symbol
    name = Column(String, nullable=True)
    asset_type = Column(String, nullable=False)  # stock, etf, mutual_fund, crypto
    exchange = Column(String, nullable=True)  # US, NSE, BSE, etc.
    quantity = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=False)
    current_price = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        cost_basis = self.quantity * self.purchase_price
        current_value = self.quantity * self.current_price
        gain_loss = current_value - cost_basis
        gain_loss_pct = (gain_loss / cost_basis * 100) if cost_basis > 0 else 0

        return {
            "id": self.id,
            "account_id": self.account_id,
            "symbol": self.symbol,
            "name": self.name,
            "asset_type": self.asset_type,
            "exchange": self.exchange,
            "quantity": self.quantity,
            "purchase_price": self.purchase_price,
            "current_price": self.current_price,
            "currency": self.currency,
            "cost_basis": cost_basis,
            "current_value": current_value,
            "gain_loss": gain_loss,
            "gain_loss_percentage": gain_loss_pct,
            "purchase_date": self.purchase_date.isoformat() if self.purchase_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class InvestmentHolding(Base):
    """Aggregated view of holdings by symbol"""
    __tablename__ = "investment_holdings"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, nullable=False)
    total_quantity = Column(Float, default=0.0)
    average_price = Column(Float, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
