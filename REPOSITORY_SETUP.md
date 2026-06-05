# Repository Connection Setup

This guide explains how to set up the database and backend for the GitHub repository connection feature.

## Prerequisites

- PostgreSQL database running
- Backend server configured (see SETUP.md)
- Node.js and npm installed

## Database Migration

Run the migration to create the `repositories` table:

```bash
cd agenticSDLC-backend
node db/run-migration.cjs 002_create_repositories_table.sql
```

You should see:
```
✅ Migration completed successfully!
```

## Database Schema

The `repositories` table stores connected GitHub repositories with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique repository identifier |
| name | VARCHAR(255) | Repository name |
| owner | VARCHAR(255) | Repository owner/organization |
| full_name | VARCHAR(512) | Full repository name (owner/repo) |
| language | VARCHAR(100) | Primary programming language |
| stars | INTEGER | Number of GitHub stars |
| branches | INTEGER | Number of branches |
| description | TEXT | Repository description |
| url | TEXT | GitHub repository URL |
| status | VARCHAR(50) | Connection status (active/inactive) |
| connected_at | TIMESTAMP | When repository was connected |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last update timestamp |

## API Endpoints

### GET /api/repositories
Get all connected repositories

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "claude-code",
      "owner": "anthropics",
      "fullName": "anthropics/claude-code",
      "language": "TypeScript",
      "stars": 1234,
      "branches": 5,
      "description": "Claude Code CLI tool",
      "url": "https://github.com/anthropics/claude-code",
      "status": "active",
      "connectedAt": "2024-06-05T10:00:00Z",
      "created_at": "2024-06-05T10:00:00Z",
      "updated_at": "2024-06-05T10:00:00Z"
    }
  ]
}
```

### POST /api/repositories
Connect a new repository

**Request:**
```json
{
  "name": "claude-code",
  "owner": "anthropics",
  "fullName": "anthropics/claude-code",
  "language": "TypeScript",
  "stars": 1234,
  "branches": 5,
  "description": "Claude Code CLI tool",
  "url": "https://github.com/anthropics/claude-code",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* repository object */ },
  "message": "Repository connected successfully"
}
```

### PUT /api/repositories/:id
Update repository details

**Request:**
```json
{
  "stars": 1500,
  "branches": 8
}
```

### DELETE /api/repositories/:id
Disconnect a repository

**Response:**
```json
{
  "success": true,
  "message": "Repository disconnected successfully"
}
```

## Testing

### 1. Check Backend is Running
```bash
curl http://localhost:3001/health
```

### 2. Connect a Repository (via frontend)
- Go to GitHub Operations → Repositories
- Click "Connect Repository"
- Enter owner: `anthropics`
- Enter name: `claude-code`
- Click "Connect"

### 3. Verify Database
```bash
psql -U agenticsdlc_user -d agenticsdlc -c "SELECT * FROM repositories;"
```

## Troubleshooting

### Migration fails
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U agenticsdlc_user -l`

### API returns 500 error
- Check backend logs for errors
- Verify database connection in `config/database.config.js`
- Ensure migration ran successfully

### Repository already exists error
- Each repository can only be connected once
- Use full_name (owner/repo) to identify unique repositories
- Delete existing entry to reconnect

## Features

✅ **Connect Repository** - Link any public GitHub repository  
✅ **Save to Database** - Persistent storage of repository details  
✅ **Load on Startup** - Automatically load connected repos  
✅ **Disconnect** - Remove repository connections  
✅ **Real-time Updates** - Fetch live data from GitHub API  
✅ **Empty State** - Clean UI when no repos connected  

## Next Steps

- Add repository sync to update stars/branches
- Show commit activity graphs
- Display GitHub Actions workflows
- Add webhook integration for real-time updates
