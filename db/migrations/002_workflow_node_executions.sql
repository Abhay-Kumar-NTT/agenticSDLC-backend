-- Migration 002: Add workflow node executions table for per-node execution tracking

CREATE TABLE IF NOT EXISTS workflow_node_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'awaiting_approval', 'rejected')),
    github_run_id BIGINT,                  -- GitHub Actions run ID once triggered
    github_workflow_file VARCHAR(255),     -- e.g. code-analyst.yml
    inputs JSONB DEFAULT '{}'::jsonb,      -- inputs passed to the GitHub workflow
    outputs JSONB DEFAULT '{}'::jsonb,     -- any outputs captured
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(execution_id, node_id)
);

-- Extend workflow_executions to carry current executing node
ALTER TABLE workflow_executions
    ADD COLUMN IF NOT EXISTS current_node_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS triggered_nodes JSONB DEFAULT '[]'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wne_workflow_id   ON workflow_node_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wne_execution_id  ON workflow_node_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_wne_status        ON workflow_node_executions(status);
CREATE INDEX IF NOT EXISTS idx_wne_github_run_id ON workflow_node_executions(github_run_id);
