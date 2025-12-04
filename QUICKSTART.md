# Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ PostgreSQL 15+ installed and running
- ✅ npm installed (`npm --version`)

## 🚀 Quick Start (2 Options)

### Option 1: Using Start Script (Easiest)

```bash
# From project root, start both servers
./start.sh

# Backend: http://localhost:3000
# Frontend: http://localhost:5173

# View logs
tail -f backend.log
tail -f frontend.log

# Stop both servers
./stop.sh
```

### Option 2: Manual Setup (5 minutes)

```bash
# 1. Ensure PostgreSQL is running and create database
# Create database: fueleu_maritime

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
# Edit .env file with your PostgreSQL credentials

# 4. Generate Prisma Client
npx prisma generate

# 5. Run migrations and seed database
npx prisma migrate dev --name init
npm run prisma:seed

# 6. Start backend server
npm run dev
# Backend running on http://localhost:3000

# 7. In a new terminal, setup frontend
cd ../frontend
npm install

# 8. Start frontend
npm run dev
# Frontend running on http://localhost:5173
```

## 🧪 Verify Installation

### Test Backend
```bash
cd backend

# Run tests
npm test

# Check API health
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

# Get routes
curl http://localhost:3000/routes
# Should return array of 5 routes
```

### Test Frontend
```bash
# Open browser to http://localhost:3001
# You should see the FuelEU Maritime Dashboard
```

## 📋 Troubleshooting

### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Fix:**
- Ensure PostgreSQL is running on port 5432
- Check `backend/.env` for correct DATABASE_URL
- Verify database `fueleu_maritime` exists

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Fix:**
- Backend: Change PORT in `backend/.env`
- Frontend: React will auto-detect and suggest next available port

### Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```
**Fix:**
```bash
cd backend
npx prisma generate
```

### Missing Dependencies
```
Error: Cannot find module 'express'
```
**Fix:**
```bash
cd backend  # or frontend
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

1. **Explore the Dashboard**: Navigate through all 4 tabs (Routes, Compare, Banking, Pooling)
2. **Set a Baseline**: Go to Routes tab and click "Set Baseline" on any route
3. **View Comparisons**: Go to Compare tab to see baseline vs other routes
4. **Test Banking**: Go to Banking tab, select SHIP001 (has surplus), try banking
5. **Create Pool**: Go to Pooling tab, select multiple ships, create a pool

## 📚 API Examples

### Get All Routes
```bash
curl http://localhost:3000/routes
```

### Get Routes with Filters
```bash
curl "http://localhost:3000/routes?vesselType=Container&year=2024"
```

### Set Baseline
```bash
curl -X POST http://localhost:3000/routes/R001/baseline
```

### Get Comparisons
```bash
curl http://localhost:3000/routes/comparison
```

### Get Compliance Balance
```bash
curl "http://localhost:3000/compliance/cb?shipId=SHIP001&year=2024"
```

### Bank Surplus
```bash
curl -X POST http://localhost:3000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"SHIP001","year":2024,"amountGco2eq":5000}'
```

### Create Pool
```bash
curl -X POST http://localhost:3000/pools \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "members": [
      {"shipId":"SHIP001","cbBefore":15000},
      {"shipId":"SHIP002","cbBefore":-8000}
    ]
  }'
```

## 🔍 Database Exploration

### View Data with Prisma Studio
```bash
cd backend
npx prisma studio
# Opens GUI at http://localhost:5555
```

### SQL Queries
```sql
-- View all routes
SELECT * FROM routes;

-- View compliance balances
SELECT * FROM ship_compliance;

-- View bank entries
SELECT * FROM bank_entries;

-- View pools with members
SELECT p.*, pm.* 
FROM pools p 
LEFT JOIN pool_members pm ON p.id = pm.pool_id;
```

## 🎨 Customization

### Change API Port
Edit `backend/.env`:
```env
PORT=4000
```

Update `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:4000
```

### Add More Seed Data
Edit `backend/prisma/seed.ts` and run:
```bash
npm run prisma:seed
```

## 📊 Development Commands

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

### Frontend
```bash
npm start           # Start dev server
npm run build       # Build for production
npm test            # Run tests
```

## ✅ Success Indicators

You should see:
- ✅ Backend logs: "⚓ FuelEU Maritime API server running on port 3000"
- ✅ Frontend opens in browser with dashboard
- ✅ Routes table shows 5 routes
- ✅ Filters work correctly
- ✅ No console errors in browser
- ✅ API calls succeed (check Network tab in DevTools)

---

**Need Help?**
Check the main README.md for detailed documentation or AGENT_WORKFLOW.md for development insights.
