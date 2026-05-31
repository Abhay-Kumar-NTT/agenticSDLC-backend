# Quick Start Guide

Get the backend running in 3 minutes.

## Prerequisites
- Node.js installed
- PostgreSQL installed and running
- Database credentials ready

## Steps

### 1. Install Dependencies (30 seconds)
```bash
npm install
```

### 2. Configure Environment (1 minute)
```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_PASSWORD="YourActualPassword"
```

### 3. Setup Database (30 seconds)
```bash
npm run setup-db
```

### 4. Start Server (10 seconds)
```bash
npm run dev
```

## Verify

Open browser: http://localhost:3001/health

Should see:
```json
{"status":"ok","timestamp":"..."}
```

## Done! ✅

Backend is now running on port 3001.

## Next

- Read [SETUP.md](SETUP.md) for detailed instructions
- Check [API.md](API.md) for API documentation
- See [README.md](README.md) for complete guide

## Troubleshooting

**Can't connect to database?**
```bash
npm run test-db
```

**Port 3001 already in use?**
```bash
# Windows
netstat -ano | findstr :3001
# Kill the process using that port
```

**Need help?**
Check [SETUP.md](SETUP.md) troubleshooting section.
