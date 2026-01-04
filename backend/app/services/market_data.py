import yfinance as yf
from typing import Dict, List
import asyncio
from functools import lru_cache


class MarketDataService:
    """Service for fetching stock market data from US and India markets"""

    @staticmethod
    def get_ticker_symbol(symbol: str, exchange: str = "US") -> str:
        """Format ticker symbol based on exchange"""
        if exchange.upper() in ["NSE", "INDIA"]:
            # Indian stocks on NSE
            return f"{symbol}.NS"
        elif exchange.upper() == "BSE":
            # Indian stocks on BSE
            return f"{symbol}.BO"
        else:
            # US stocks and ETFs
            return symbol

    @staticmethod
    async def get_current_price(symbol: str, exchange: str = "US") -> float:
        """Get current price for a single ticker"""
        try:
            ticker_symbol = MarketDataService.get_ticker_symbol(symbol, exchange)
            ticker = yf.Ticker(ticker_symbol)

            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, lambda: ticker.info)

            # Try different price fields
            price = (
                info.get("currentPrice") or
                info.get("regularMarketPrice") or
                info.get("previousClose") or
                0.0
            )
            return float(price)
        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")
            return 0.0

    @staticmethod
    async def get_multiple_prices(symbols: List[Dict[str, str]]) -> Dict[str, float]:
        """
        Get current prices for multiple tickers
        symbols: List of dicts with 'symbol' and 'exchange' keys
        """
        tasks = [
            MarketDataService.get_current_price(item["symbol"], item.get("exchange", "US"))
            for item in symbols
        ]
        prices = await asyncio.gather(*tasks)

        result = {}
        for item, price in zip(symbols, prices):
            key = f"{item['symbol']}:{item.get('exchange', 'US')}"
            result[key] = price

        return result

    @staticmethod
    async def get_ticker_info(symbol: str, exchange: str = "US") -> Dict:
        """Get detailed information about a ticker"""
        try:
            ticker_symbol = MarketDataService.get_ticker_symbol(symbol, exchange)
            ticker = yf.Ticker(ticker_symbol)

            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, lambda: ticker.info)

            return {
                "symbol": symbol,
                "name": info.get("longName") or info.get("shortName") or symbol,
                "exchange": exchange,
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice") or 0.0,
                "currency": info.get("currency", "USD"),
                "market_cap": info.get("marketCap"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
            }
        except Exception as e:
            print(f"Error fetching info for {symbol}: {e}")
            return {
                "symbol": symbol,
                "name": symbol,
                "exchange": exchange,
                "current_price": 0.0,
                "currency": "USD",
            }

    @staticmethod
    async def search_ticker(query: str) -> List[Dict]:
        """Search for tickers by name or symbol"""
        try:
            ticker = yf.Ticker(query)
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, lambda: ticker.info)

            if info:
                return [{
                    "symbol": query,
                    "name": info.get("longName") or info.get("shortName") or query,
                    "exchange": info.get("exchange", "US"),
                }]
        except:
            pass
        return []
