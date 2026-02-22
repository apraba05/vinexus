#!/bin/bash
# Run both backend and frontend dev servers

echo "Starting VM-IDE..."
echo ""

# Start backend in background
echo "[1/2] Starting backend on port 4000..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Small delay to let backend start
sleep 2

# Start frontend in background
echo "[2/2] Starting frontend on port 3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "VM-IDE is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
