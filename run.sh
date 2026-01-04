#!/bin/bash

# Personal Finance Dashboard - Run Script

echo "Starting Personal Finance Dashboard..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/installed" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/installed
fi

# Start backend server
python -m app.main &
BACKEND_PID=$!

cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend server
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "========================================"
echo "Personal Finance Dashboard is running!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for processes
wait
