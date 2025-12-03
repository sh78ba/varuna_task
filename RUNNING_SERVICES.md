# Running Services

## ✅ Project Successfully Started

Both backend and frontend are now running!

### 🔧 Backend Server
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Process ID**: Check with `ps aux | grep "npm run dev" | grep backend`

#### Available API Endpoints:
- `GET /health` - Health check
- `GET /routes` - Get all routes
- `GET /routes?year=2024` - Filter routes by year
- `POST /routes/baseline` - Set baseline route
- `GET /routes/comparison` - Compare routes
- `GET /compliance/cb?shipId=SHIP001&year=2025` - Get compliance balance
- `GET /compliance/adjusted-cb?shipId=SHIP001&year=2025` - Get adjusted CB
- `GET /banking/records?shipId=SHIP001` - Get bank entries
- `POST /banking/bank` - Bank surplus
- `POST /banking/apply` - Apply banked surplus
- `GET /pools?year=2025` - Get pools by year
- `POST /pools` - Create new pool

### 🎨 Frontend Application
- **Status**: ✅ Running
- **URL**: http://localhost:5173
- **Framework**: React 18 + Vite + TypeScript + TailwindCSS

#### Features:
- **Routes Tab**: View and manage routes, set baselines
- **Compare Tab**: Compare route GHG intensities vs targets
- **Banking Tab**: Manage compliance balance banking
- **Pooling Tab**: Create and view compliance pools

---

## 🚀 Quick Commands

### Check Status
```bash
# Check backend
curl http://localhost:3000/health

# Check frontend (in browser)
open http://localhost:5173
```

### View Logs
```bash
# Backend logs
tail -f /tmp/backend.log

# Frontend logs
tail -f /tmp/frontend.log
```

### Stop Services
```bash
# Find and stop processes
ps aux | grep "npm run dev"
kill <PID>

# Or use pkill
pkill -f "npm run dev"
```

### Restart Services
```bash
# Backend
cd /Users/shantanubasumatary/Projects/varuna_task/backend
npm run dev > /tmp/backend.log 2>&1 &

# Frontend
cd /Users/shantanubasumatary/Projects/varuna_task/frontend
npm run dev > /tmp/frontend.log 2>&1 &
```

---

## 📊 Database Status

- **Database**: fueleu_maritime
- **Host**: localhost:5432
- **Connection**: ✅ Connected
- **Migrations**: ✅ Applied (20251203175134_init)
- **Seed Data**: ✅ Loaded (5 routes, 4 ships)

### Test Database Connection
```bash
cd backend
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

---

## 🧪 Test the Application

### 1. Test Backend API
```bash
# Get all routes
curl http://localhost:3000/routes

# Get routes for 2024
curl "http://localhost:3000/routes?year=2024"

# Health check
curl http://localhost:3000/health
```

### 2. Test Frontend
1. Open browser: http://localhost:5173
2. Navigate through tabs:
   - Routes: View seeded routes (R001-R005)
   - Compare: Select year to see compliance comparison
   - Banking: View ship banking status
   - Pooling: Create compliance pools

### 3. End-to-End Flow
1. **Routes Tab**: Set R001 as baseline
2. **Compare Tab**: View comparison with target (89.34 gCO₂e/MJ)
3. **Banking Tab**: Bank surplus if compliant
4. **Pooling Tab**: Create pool with multiple ships

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i:3000)

# Restart backend
cd backend && npm run dev
```

### Frontend Won't Start
```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill process if needed
kill -9 $(lsof -t -i:5173)

# Restart frontend
cd frontend && npm run dev
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
psql -U postgres -d fueleu_maritime -c "SELECT version();"

# Regenerate Prisma Client
cd backend
npx prisma generate
```

### TypeScript Compilation Errors
```bash
cd backend
npm run build
# Fix any errors shown
```

---

## 📝 Notes

- Backend runs on TypeScript with ts-node in development mode
- Frontend uses Vite for fast HMR (Hot Module Replacement)
- Both services auto-reload on file changes
- Logs are stored in `/tmp/backend.log` and `/tmp/frontend.log`
- Database schema is managed by Prisma migrations

## 🎯 Next Steps

1. ✅ Backend running successfully
2. ✅ Frontend running successfully
3. ✅ Database connected and seeded
4. 📋 Test all features in the UI
5. 📋 Run unit tests: `cd backend && npm test`
6. 📋 Review documentation: See README.md, QUICKSTART.md

---

**Project**: FuelEU Maritime Compliance Platform  
**Version**: 1.0.0  
**Last Updated**: 2025-12-03
