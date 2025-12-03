# Local PostgreSQL Setup Guide

## Step 1: Configure Database Connection

1. **Find your PostgreSQL credentials:**
   - Username (usually `postgres` or your macOS username)
   - Password (set during PostgreSQL installation)
   - Port (default: 5432)

2. **Update `backend/.env` file:**
   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/fueleu_maritime?schema=public"
   ```
   Replace `USERNAME` and `PASSWORD` with your actual credentials.

## Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed database with test data
npm run prisma:seed

# Start backend server
npm run dev
```

Backend will start on http://localhost:3000

## Step 3: Setup Frontend (in new terminal)

```bash
cd frontend

# Install dependencies (already done)
# npm install

# Start frontend
npm start
```

Frontend will open on http://localhost:3001

## Troubleshooting

### "Can't reach database server"

**Option 1: Check PostgreSQL is running**
```bash
# On macOS
brew services list | grep postgresql
# Should show "started"

# If not running:
brew services start postgresql@15
```

**Option 2: Check your credentials**
```bash
# Test connection
psql -U postgres -h localhost

# If this fails, try with your username:
psql -U $(whoami) -h localhost
```

**Option 3: Update DATABASE_URL**
If you connect successfully with a different username, update `backend/.env`:
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/fueleu_maritime?schema=public"
```

### "Database does not exist"

The migration will create it automatically. If you get this error:
```bash
createdb -U postgres fueleu_maritime
# Then run migrations again
```

### "Password authentication failed"

Update the password in `backend/.env` to match your PostgreSQL password.

## Quick Test

Once backend is running, test the API:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

curl http://localhost:3000/routes
# Should return array of 5 routes
```
