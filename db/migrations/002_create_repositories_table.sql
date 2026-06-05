-- Migration: Create repositories table
-- Description: Stores connected GitHub repositories
-- Date: 2024-06-05

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) NOT NULL UNIQUE,
  language VARCHAR(100),
  stars INTEGER DEFAULT 0,
  branches INTEGER DEFAULT 0,
  description TEXT,
  url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repositories_owner ON repositories(owner);
CREATE INDEX IF NOT EXISTS idx_repositories_status ON repositories(status);
CREATE INDEX IF NOT EXISTS idx_repositories_created_at ON repositories(created_at DESC);

-- Add comments
COMMENT ON TABLE repositories IS 'Connected GitHub repositories';
COMMENT ON COLUMN repositories.id IS 'Unique repository identifier';
COMMENT ON COLUMN repositories.name IS 'Repository name';
COMMENT ON COLUMN repositories.owner IS 'Repository owner/organization';
COMMENT ON COLUMN repositories.full_name IS 'Full repository name (owner/repo)';
COMMENT ON COLUMN repositories.language IS 'Primary programming language';
COMMENT ON COLUMN repositories.stars IS 'Number of GitHub stars';
COMMENT ON COLUMN repositories.branches IS 'Number of branches';
COMMENT ON COLUMN repositories.description IS 'Repository description';
COMMENT ON COLUMN repositories.url IS 'GitHub repository URL';
COMMENT ON COLUMN repositories.status IS 'Connection status (active/inactive)';
COMMENT ON COLUMN repositories.connected_at IS 'When repository was connected';
COMMENT ON COLUMN repositories.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN repositories.updated_at IS 'Record last update timestamp';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: 002_create_repositories_table';
END $$;
