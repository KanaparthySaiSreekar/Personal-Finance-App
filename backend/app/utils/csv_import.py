import pandas as pd
from datetime import datetime
from typing import List, Dict
import csv
from io import StringIO


class CSVImporter:
    """Utility for importing transactions and accounts from CSV files"""

    @staticmethod
    def parse_transaction_csv(csv_content: str) -> List[Dict]:
        """
        Parse transaction CSV. Expected columns:
        - date (YYYY-MM-DD)
        - amount (float)
        - type (income/expense/transfer)
        - category (optional)
        - merchant (optional)
        - description (optional)
        - account_id (int)
        """
        transactions = []
        reader = csv.DictReader(StringIO(csv_content))

        for row in reader:
            try:
                transaction = {
                    "transaction_date": datetime.fromisoformat(row["date"]),
                    "amount": float(row["amount"]),
                    "transaction_type": row["type"].lower(),
                    "account_id": int(row["account_id"]),
                    "category": row.get("category"),
                    "merchant": row.get("merchant"),
                    "description": row.get("description"),
                    "tags": row.get("tags", "").split(",") if row.get("tags") else []
                }
                transactions.append(transaction)
            except (KeyError, ValueError) as e:
                print(f"Error parsing row: {row}, error: {e}")
                continue

        return transactions

    @staticmethod
    def parse_account_csv(csv_content: str) -> List[Dict]:
        """
        Parse account CSV. Expected columns:
        - name
        - account_type (checking/savings/credit_card/investment/crypto/loan/other)
        - balance (float)
        - currency (optional, defaults to USD)
        - institution (optional)
        - account_number (optional)
        """
        accounts = []
        reader = csv.DictReader(StringIO(csv_content))

        for row in reader:
            try:
                account = {
                    "name": row["name"],
                    "account_type": row["account_type"].lower(),
                    "balance": float(row["balance"]),
                    "currency": row.get("currency", "USD"),
                    "institution": row.get("institution"),
                    "account_number": row.get("account_number"),
                    "notes": row.get("notes")
                }
                accounts.append(account)
            except (KeyError, ValueError) as e:
                print(f"Error parsing row: {row}, error: {e}")
                continue

        return accounts

    @staticmethod
    def parse_investment_csv(csv_content: str) -> List[Dict]:
        """
        Parse investment CSV. Expected columns:
        - symbol
        - name (optional)
        - asset_type (stock/etf/mutual_fund/crypto)
        - exchange (US/NSE/BSE)
        - quantity (float)
        - purchase_price (float)
        - purchase_date (YYYY-MM-DD, optional)
        - account_id (int)
        - currency (optional, defaults to USD)
        """
        investments = []
        reader = csv.DictReader(StringIO(csv_content))

        for row in reader:
            try:
                investment = {
                    "symbol": row["symbol"].upper(),
                    "name": row.get("name"),
                    "asset_type": row["asset_type"].lower(),
                    "exchange": row.get("exchange", "US").upper(),
                    "quantity": float(row["quantity"]),
                    "purchase_price": float(row["purchase_price"]),
                    "account_id": int(row["account_id"]),
                    "currency": row.get("currency", "USD"),
                }

                if row.get("purchase_date"):
                    investment["purchase_date"] = datetime.fromisoformat(row["purchase_date"])

                investments.append(investment)
            except (KeyError, ValueError) as e:
                print(f"Error parsing row: {row}, error: {e}")
                continue

        return investments

    @staticmethod
    def generate_transaction_template() -> str:
        """Generate a CSV template for transactions"""
        return """date,amount,type,category,merchant,description,account_id,tags
2024-01-01,100.00,income,Salary,Employer,Monthly salary,1,
2024-01-02,50.00,expense,Groceries,Walmart,Weekly groceries,1,food,essential
2024-01-03,30.00,expense,Transportation,Uber,Ride to work,1,transport"""

    @staticmethod
    def generate_account_template() -> str:
        """Generate a CSV template for accounts"""
        return """name,account_type,balance,currency,institution,account_number,notes
Checking Account,checking,5000.00,USD,Chase Bank,****1234,Primary account
Savings Account,savings,10000.00,USD,Chase Bank,****5678,Emergency fund
Credit Card,credit_card,-1500.00,USD,Amex,****9012,Main credit card"""

    @staticmethod
    def generate_investment_template() -> str:
        """Generate a CSV template for investments"""
        return """symbol,name,asset_type,exchange,quantity,purchase_price,purchase_date,account_id,currency
AAPL,Apple Inc,stock,US,10,150.00,2024-01-01,2,USD
RELIANCE,Reliance Industries,stock,NSE,50,2500.00,2024-01-01,2,INR
NIFTY,Nifty 50 ETF,etf,NSE,100,180.00,2024-01-01,2,INR"""
