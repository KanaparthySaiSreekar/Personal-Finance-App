from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.investment import Investment
from app.utils.csv_import import CSVImporter

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/transactions/csv")
async def import_transactions_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Import transactions from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    csv_content = content.decode('utf-8')

    transactions_data = CSVImporter.parse_transaction_csv(csv_content)

    imported = 0
    errors = []

    for txn_data in transactions_data:
        try:
            # Convert tags list to comma-separated string
            if "tags" in txn_data:
                txn_data["tags"] = ",".join(txn_data["tags"])

            transaction = Transaction(**txn_data)
            db.add(transaction)
            imported += 1
        except Exception as e:
            errors.append(f"Error importing transaction: {str(e)}")

    await db.flush()

    return {
        "imported": imported,
        "errors": errors,
        "total_rows": len(transactions_data)
    }


@router.post("/accounts/csv")
async def import_accounts_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Import accounts from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    csv_content = content.decode('utf-8')

    accounts_data = CSVImporter.parse_account_csv(csv_content)

    imported = 0
    errors = []

    for acc_data in accounts_data:
        try:
            account = Account(**acc_data)
            db.add(account)
            imported += 1
        except Exception as e:
            errors.append(f"Error importing account: {str(e)}")

    await db.flush()

    return {
        "imported": imported,
        "errors": errors,
        "total_rows": len(accounts_data)
    }


@router.post("/investments/csv")
async def import_investments_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Import investments from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    csv_content = content.decode('utf-8')

    investments_data = CSVImporter.parse_investment_csv(csv_content)

    imported = 0
    errors = []

    for inv_data in investments_data:
        try:
            investment = Investment(**inv_data)
            db.add(investment)
            imported += 1
        except Exception as e:
            errors.append(f"Error importing investment: {str(e)}")

    await db.flush()

    return {
        "imported": imported,
        "errors": errors,
        "total_rows": len(investments_data)
    }


@router.get("/templates/transactions")
async def get_transaction_template():
    """Get CSV template for transactions"""
    return {
        "template": CSVImporter.generate_transaction_template()
    }


@router.get("/templates/accounts")
async def get_account_template():
    """Get CSV template for accounts"""
    return {
        "template": CSVImporter.generate_account_template()
    }


@router.get("/templates/investments")
async def get_investment_template():
    """Get CSV template for investments"""
    return {
        "template": CSVImporter.generate_investment_template()
    }
