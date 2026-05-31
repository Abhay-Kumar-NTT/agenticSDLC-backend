-- AgenticSDLC Workflow Database Schema
-- PostgreSQL 12+

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Workflow nodes table
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- Client-side generated ID
    node_type VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    position_x NUMERIC(10, 2) NOT NULL,
    position_y NUMERIC(10, 2) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb, -- Additional node configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, node_id)
);

-- Workflow edges table
CREATE TABLE IF NOT EXISTS workflow_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    edge_id VARCHAR(100) NOT NULL, -- Client-side generated ID
    from_node_id VARCHAR(100) NOT NULL,
    to_node_id VARCHAR(100) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb, -- Additional edge configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, edge_id),
    FOREIGN KEY (workflow_id, from_node_id) REFERENCES workflow_nodes(workflow_id, node_id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id, to_node_id) REFERENCES workflow_nodes(workflow_id, node_id) ON DELETE CASCADE
);

-- Workflow execution history
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    result JSONB,
    error_message TEXT,
    triggered_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workflows table
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for testing)
-- INSERT INTO workflows (name, description, status, created_by)
-- VALUES ('Sample Workflow', 'Test workflow for development', 'draft', 'system');

-- View for workflow summary
CREATE OR REPLACE VIEW workflow_summary AS
SELECT
    w.id,
    w.name,
    w.status,
    w.created_at,
    w.updated_at,
    COUNT(DISTINCT wn.id) as node_count,
    COUNT(DISTINCT we.id) as edge_count,
    COUNT(DISTINCT wex.id) as execution_count
FROM workflows w
LEFT JOIN workflow_nodes wn ON w.id = wn.workflow_id
LEFT JOIN workflow_edges we ON w.id = we.workflow_id
LEFT JOIN workflow_executions wex ON w.id = wex.workflow_id
GROUP BY w.id, w.name, w.status, w.created_at, w.updated_at;

-- Grant permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
