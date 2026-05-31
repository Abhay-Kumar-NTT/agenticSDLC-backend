# AgenticSDLC Backend API

Backend API server for the AgenticSDLC workflow orchestration platform.

## Overview

This is a Node.js/Express REST API that provides backend services for managing workflows, nodes, edges, and workflow executions. It connects to a PostgreSQL database and provides endpoints for the frontend application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Environment**: dotenv

## Features

- RESTful API for workflow management
- PostgreSQL database integration
- Environment-based configuration (dev/staging/production)
- CORS enabled for frontend integration
- Connection pooling for database efficiency
- Comprehensive error handling

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <your-backend-repo-url>
cd agenticSDLC-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
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

5. Set up the database:
```bash
npm run setup-db
```

## Database Setup

The database schema includes:

- **workflows** - Workflow definitions
- **workflow_nodes** - Nodes in workflows
- **workflow_edges** - Connections between nodes
- **workflow_executions** - Runtime execution tracking

Run the setup script to create all tables:
```bash
npm run setup-db
```

Or manually run the SQL schema:
```bash
psql -U postgres -d agenticsdlc -f db/schema.sql
```

## Running the Server

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3001` with auto-reload enabled.

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID (includes nodes and edges)
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

## Project Structure

```
agenticSDLC-backend/
├── config/
│   └── database.config.js    # Database configuration per environment
├── db/
│   ├── connection.js          # Database connection pool
│   └── schema.sql             # Database schema
├── models/
│   └── workflow.model.js      # Workflow data access layer
├── routes/
│   └── workflow.routes.js     # API route definitions
├── .env                       # Environment variables (not in git)
├── .env.example              # Example environment variables
├── package.json              # Dependencies and scripts
├── server.js                 # Express server entry point
├── setup-database.cjs        # Database setup script
└── test-db-simple.cjs        # Simple database test
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run setup-db` - Set up database schema
- `npm run test-db` - Test database connection

## Related Repositories

- Frontend: [agenticSDLC-UI-Code](link-to-frontend-repo)
- Agents: [agenticsdlc-agents](link-to-agents-repo)
