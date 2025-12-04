#!/bin/bash

# FuelEU Maritime - Stop Script
# Stops both backend and frontend servers

echo "🛑 Stopping FuelEU Maritime Application..."
echo ""

if [ -f .backend.pid ]; then
  BACKEND_PID=$(cat .backend.pid)
  if ps -p $BACKEND_PID > /dev/null 2>&1; then
    kill $BACKEND_PID
    echo "✅ Backend stopped (PID: $BACKEND_PID)"
  else
    echo "⚠️  Backend already stopped"
  fi
  rm .backend.pid
fi

if [ -f .frontend.pid ]; then
  FRONTEND_PID=$(cat .frontend.pid)
  if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    kill $FRONTEND_PID
    echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
  else
    echo "⚠️  Frontend already stopped"
  fi
  rm .frontend.pid
fi

# Kill any remaining node/vite processes on ports 3000 and 5173
echo ""
echo "🔍 Checking for remaining processes..."

# Kill processes on port 3000 (backend)
BACKEND_PORT_PID=$(lsof -ti:3000)
if [ ! -z "$BACKEND_PORT_PID" ]; then
  kill -9 $BACKEND_PORT_PID
  echo "✅ Killed process on port 3000"
fi

# Kill processes on port 5173 (frontend)
FRONTEND_PORT_PID=$(lsof -ti:5173)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
  kill -9 $FRONTEND_PORT_PID
  echo "✅ Killed process on port 5173"
fi

echo ""
echo "🧹 Cleaning up log files..."
rm -f backend.log frontend.log

echo "✅ Application stopped successfully!"
