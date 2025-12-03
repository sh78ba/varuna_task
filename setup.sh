#!/bin/bash

echo "🚀 FuelEU Maritime - Project Setup"
echo "=================================="
echo ""

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL connection..."
if ! psql -U postgres -h localhost -c '\q' 2>/dev/null; then
    echo "⚠️  PostgreSQL is not accessible with default credentials."
    echo "Please ensure PostgreSQL is running and update the DATABASE_URL in backend/.env"
    echo ""
    echo "Your DATABASE_URL should look like:"
    echo "postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/fueleu_maritime?schema=public"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit and configure..."
fi

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Creating database and running migrations..."
npx prisma migrate dev --name init

echo "Seeding database with test data..."
npm run prisma:seed

echo ""
echo "✅ Backend setup complete!"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../frontend

echo "Installing dependencies..."
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend (in backend folder):"
echo "   cd backend && npm run dev"
echo ""
echo "2. Start Frontend (in new terminal, from frontend folder):"
echo "   cd frontend && npm start"
echo ""
echo "3. Open browser to: http://localhost:3001"
echo ""
