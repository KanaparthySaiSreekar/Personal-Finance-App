# Personal Finance Dashboard

A comprehensive, self-hosted personal finance management application built with Python/FastAPI (backend) and React/Vite (frontend). Track all your financial data - bank accounts, credit cards, investments, transactions, and budgets - in one unified dashboard with complete privacy and data ownership.

## Features

### Core Functionality
- **Unified Account Tracking**: Manage multiple accounts including checking, savings, credit cards, investments, crypto, and loans
- **Transaction Management**: Create, categorize, and filter income/expense transactions with tags and merchants
- **Budgeting**: Set category-based budgets and track spending against them in real-time
- **Investment Portfolio**: Track stocks, ETFs, mutual funds, and cryptocurrencies from both US and India markets (NSE, BSE)
- **Analytics & Reporting**:
  - Net worth calculation (assets vs liabilities)
  - Cash flow analysis (income vs expenses)
  - Spending trends by category
  - Monthly income/expense trends
  - Visual charts and graphs

### Investment Tracking
- **Multi-Market Support**: Track investments from:
  - US markets (NYSE, NASDAQ)
  - Indian markets (NSE, BSE)
  - Support for stocks, ETFs, mutual funds, and cryptocurrencies
- **Real-Time Pricing**: Automatic price updates using Yahoo Finance API
- **Portfolio Analytics**: Calculate total value, cost basis, gains/losses, and returns
- **Multi-Currency**: Support for USD, INR, EUR, and GBP

### Data Import/Export
- CSV import for accounts, transactions, and investments
- Downloadable CSV templates
- Bulk data operations

### Privacy & Security
- **100% Self-Hosted**: All data stays on your machine
- **No External Services**: No subscription fees or data sharing
- **SQLite Database**: Lightweight, file-based storage
- **Local-First**: Complete control over your financial data

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Uvicorn**: ASGI server
- **yfinance**: Stock market data fetching
- **SQLite**: Database (easily swappable for PostgreSQL)

### Frontend
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **date-fns**: Date utilities

## Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Quick Start (Recommended)

**Linux/macOS:**
```bash
./run.sh
```

**Windows:**
```bash
run.bat
```

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Getting Started

1. **Create Accounts**: Start by adding your bank accounts, credit cards, and investment accounts
2. **Add Transactions**: Record income and expenses, categorizing them appropriately
3. **Set Budgets**: Create monthly or yearly budgets for different spending categories
4. **Track Investments**: Add your stock holdings with purchase details
5. **Monitor Dashboard**: View your financial overview, charts, and analytics

### Account Types

- **Checking**: Day-to-day transaction accounts
- **Savings**: Savings accounts and emergency funds
- **Credit Card**: Credit card accounts (balances shown as liabilities)
- **Investment**: Brokerage and retirement accounts
- **Crypto**: Cryptocurrency wallets
- **Loan**: Loans and debts
- **Other**: Miscellaneous accounts

### Transaction Categories

Create custom categories for your transactions such as:
- Groceries
- Entertainment
- Transportation
- Utilities
- Healthcare
- Shopping
- Dining
- Travel

### Investment Tracking

#### Adding Investments

When adding investments, specify:
- **Symbol**: Ticker symbol (e.g., AAPL, RELIANCE)
- **Exchange**:
  - US: For US stocks and ETFs
  - NSE: For Indian stocks on National Stock Exchange
  - BSE: For Indian stocks on Bombay Stock Exchange
- **Asset Type**: Stock, ETF, Mutual Fund, or Crypto
- **Quantity**: Number of shares/units
- **Purchase Price**: Price per share when purchased
- **Currency**: USD, INR, EUR, or GBP

#### Examples

**US Stock:**
- Symbol: AAPL
- Exchange: US
- Asset Type: Stock

**Indian Stock (NSE):**
- Symbol: RELIANCE
- Exchange: NSE
- Asset Type: Stock

**Indian Stock (BSE):**
- Symbol: TCS
- Exchange: BSE
- Asset Type: Stock

**US ETF:**
- Symbol: SPY
- Exchange: US
- Asset Type: ETF

### CSV Import

#### Transaction Import
Download the template from the app and fill in:
```csv
date,amount,type,category,merchant,description,account_id,tags
2024-01-01,100.00,income,Salary,Employer,Monthly salary,1,
2024-01-02,50.00,expense,Groceries,Walmart,Weekly groceries,1,food,essential
```

#### Account Import
```csv
name,account_type,balance,currency,institution,account_number,notes
Checking Account,checking,5000.00,USD,Chase Bank,****1234,Primary account
```

#### Investment Import
```csv
symbol,name,asset_type,exchange,quantity,purchase_price,purchase_date,account_id,currency
AAPL,Apple Inc,stock,US,10,150.00,2024-01-01,2,USD
RELIANCE,Reliance Industries,stock,NSE,50,2500.00,2024-01-01,2,INR
```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Key Endpoints

#### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/{id}` - Update account
- `DELETE /api/accounts/{id}` - Delete account

#### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/{id}` - Delete transaction

#### Budgets
- `GET /api/budgets` - List all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/{id}` - Update budget

#### Investments
- `GET /api/investments` - List investments
- `POST /api/investments` - Create investment
- `POST /api/investments/{id}/refresh-price` - Refresh current price
- `GET /api/investments/portfolio/summary` - Portfolio summary

#### Analytics
- `GET /api/analytics/net-worth` - Calculate net worth
- `GET /api/analytics/cash-flow` - Cash flow analysis
- `GET /api/analytics/spending-by-category` - Category breakdown
- `GET /api/analytics/dashboard-summary` - Complete dashboard data

## Database

The application uses SQLite by default, storing data in `finance.db` in the backend directory.

### Switching to PostgreSQL

To use PostgreSQL instead:

1. Update `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/finance_db
```

2. Install asyncpg:
```bash
pip install asyncpg
```

## Development

### Project Structure

```
Personal-Finance-App/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database setup
│   │   └── main.py          # FastAPI application
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
├── run.sh                   # Linux/macOS launcher
├── run.bat                  # Windows launcher
└── README.md
```

### Adding Features

The application is designed to be extensible:

1. **New Models**: Add to `backend/app/models/`
2. **New API Endpoints**: Add to `backend/app/routes/`
3. **New Pages**: Add to `frontend/src/pages/`
4. **New Services**: Add to `backend/app/services/`

## Security Considerations

- **Local Hosting**: Keep the app on localhost or behind a firewall
- **No Authentication**: Designed for single-user, local use
- **Database Encryption**: Consider encrypting the SQLite file at rest
- **Backups**: Regularly backup your `finance.db` file
- **Sensitive Data**: Account numbers and notes are stored as-is

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in backend/.env
API_PORT=8001
```

**Database errors:**
```bash
# Delete and reinitialize database
rm finance.db
# Restart the backend server
```

### Frontend Issues

**CORS errors:**
- Ensure backend is running on port 8000
- Check `CORS_ORIGINS` in `backend/.env`

**API connection failed:**
- Verify backend is running
- Check `API_BASE_URL` in `frontend/src/services/api.js`

### Investment Price Updates

**Prices not updating:**
- Check internet connection
- Verify ticker symbols are correct
- Note: Some symbols may have delayed data
- Indian stocks: Use `.NS` for NSE, `.BO` for BSE (handled automatically)

## Roadmap

Future enhancements could include:

- [ ] Recurring transactions
- [ ] Financial goals tracking
- [ ] Bill reminders
- [ ] Multi-currency exchange rates
- [ ] Data export (PDF reports)
- [ ] Mobile responsive improvements
- [ ] Plaid integration for automatic bank syncing
- [ ] Docker deployment
- [ ] Advanced charts and visualizations
- [ ] Custom reporting

## Contributing

This is a personal project template. Feel free to fork and customize for your needs.

## License

MIT License - feel free to use and modify as needed.

## Acknowledgments

- Inspired by open-source personal finance tools like [Sure](https://github.com/we-promise/sure)
- Market data powered by [yfinance](https://github.com/ranaroussi/yfinance)
- Built with modern web technologies for maximum flexibility

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Examine browser console and backend logs

---

**Note**: This is a self-hosted application for personal use. Always backup your data and review code before using with real financial information.