#!/bin/bash

# FuelEU Maritime - Start Script
# Starts both backend and frontend servers

echo "🚀 Starting FuelEU Maritime Application..."
echo ""

# Seed database
echo "🌱 Seeding database..."
cd backend
npx ts-node prisma/seed.ts > /dev/null 2>&1
echo "✅ Database seeded"
echo ""

# Start backend in background
echo "📦 Starting Backend (Port 3000)..."
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting Frontend (Port 5173)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Application started successfully!"
echo ""
echo "📍 URLs:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📋 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📄 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or run: ./stop.sh"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
