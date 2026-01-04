@echo off
echo Starting Personal Finance Dashboard...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.10 or higher.
    pause
    exit /b 1
)

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

REM Start backend
echo Starting backend server...
cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat

if not exist "venv\installed" (
    echo Installing backend dependencies...
    pip install -r requirements.txt
    echo installed > venv\installed
)

REM Start backend in new window
start "Backend Server" cmd /k "venv\Scripts\activate.bat && python -m app.main"

cd ..

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend server...
cd frontend

REM Install dependencies if needed
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

REM Start frontend in new window
start "Frontend Server" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo Personal Finance Dashboard is running!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Close the server windows to stop the application
echo.
pause
