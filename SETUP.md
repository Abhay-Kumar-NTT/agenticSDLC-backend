# Setup Guide - AgenticSDLC Backend

Quick setup guide to get the backend API running.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenticsdlc
DB_USER=postgres
DB_PASSWORD="YourPassword"

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Important**: Quote passwords with special characters!

## Step 3: Set Up Database

### Option A: Automated Setup (Recommended)
```bash
npm run setup-db
```

This will:
- Create the database if it doesn't exist
- Create all required tables
- Set up indexes and constraints

### Option B: Manual Setup
```bash
# Create database
createdb -U postgres agenticsdlc

# Run schema
psql -U postgres -d agenticsdlc -f db/schema.sql
```

## Step 4: Test Database Connection

```bash
npm run test-db
```

Expected output:
```
✅ Database connection successful
```

## Step 5: Start Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will start at: `http://localhost:3001`

## Step 6: Verify Installation

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-05-31T00:00:00.000Z"
}
```

### Test Workflows Endpoint
```bash
curl http://localhost:3001/api/workflows
```

Expected response:
```json
{
  "success": true,
  "data": []
}
```

## Troubleshooting

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

**Linux/Mac:**
```bash
lsof -i :3001
kill -9 <pid>
```

### Database Connection Failed

1. Check PostgreSQL is running:
```bash
# Windows
net start postgresql-x64-<version>

# Linux/Mac
sudo systemctl status postgresql
```

2. Verify credentials in `.env`
3. Ensure database exists
4. Quote special characters in password

### Common Errors

**"ECONNREFUSED"**
- PostgreSQL not running
- Wrong host/port

**"password authentication failed"**
- Wrong credentials
- Password needs quotes

**"database does not exist"**
- Run: `createdb -U postgres agenticsdlc`

## Next Steps

Once the backend is running:

1. Keep the terminal open (server must run continuously)
2. Start the frontend application
3. Access the workflow designer at `http://localhost:5173`

## Scripts Reference

- `npm start` - Start server (production)
- `npm run dev` - Start with auto-reload (development)
- `npm run setup-db` - Initialize database
- `npm run test-db` - Test database connection

## Need Help?

Check the main [README.md](README.md) for detailed documentation.
