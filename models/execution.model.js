/**
 * Execution Model
 *
 * Drives sequential, graph-aware execution of workflow nodes.
 * Each node triggers its corresponding GitHub Actions workflow.
 * human-in-loop nodes pause execution until approved via API.
 */

import { query, getClient } from '../db/connection.js';
import { WorkflowModel } from './workflow.model.js';

// Ensure tables exist on first use (idempotent)
async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS workflow_node_executions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
      node_id VARCHAR(100) NOT NULL,
      node_type VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending','running','completed','failed','awaiting_approval','rejected')),
      github_run_id BIGINT,
      github_workflow_file VARCHAR(255),
      inputs JSONB DEFAULT '{}'::jsonb,
      outputs JSONB DEFAULT '{}'::jsonb,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(execution_id, node_id)
    )
  `);
  // Add columns to workflow_executions if missing
  await query(`ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS current_node_id VARCHAR(100)`);
  await query(`ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS triggered_nodes JSONB DEFAULT '[]'::jsonb`);
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN   = process.env.GITHUB_TOKEN  || process.env.VITE_GITHUB_TOKEN  || '';
const GITHUB_OWNER   = process.env.GITHUB_OWNER  || process.env.VITE_GITHUB_OWNER  || '';
const GITHUB_REPO    = process.env.GITHUB_REPO   || process.env.VITE_GITHUB_REPO   || '';

// Map canvas node types → GitHub workflow files + input key from node config
const NODE_WORKFLOW_MAP = {
  'product-vision':   { file: 'product-agent.yml',       inputKey: 'vision_document' },
  'prd':              { file: 'business-analyst.yml',     inputKey: 'vision_path' },
  'epic':             { file: 'product-strategist.yml',   inputKey: 'prd_path' },
  'user-story':       { file: 'product-strategist.yml',   inputKey: 'epic_path' },
  'code-analysis':    { file: 'code-analyst.yml',         inputKey: 'repository_url_or_path' },
  'design-analysis':  { file: 'design-analyst.yml',       inputKey: 'design_path' },
  'hld':              { file: 'solution-architect.yml',   inputKey: 'requirements_path' },
  'lld':              { file: 'architecture-agent.yml',   inputKey: 'hld_path' },
  'adr':              { file: 'solution-architect.yml',   inputKey: 'context_path' },
  'api-contract':     { file: 'solution-architect.yml',   inputKey: 'spec_path' },
  'ui-ux':            { file: 'design-analyst.yml',       inputKey: 'requirements_path' },
  'code-module':      { file: 'frontend-developer.yml',   inputKey: 'story_path' },
  'pull-request':     null, // auto-created by dev agent, no trigger
  'test-strategy':    { file: 'qa-agent.yml',             inputKey: 'requirements_path' },
  'test-cases':       { file: 'qa-engineer.yml',          inputKey: 'test_strategy_path' },
  'test-plan':        { file: 'qa-agent.yml',             inputKey: 'story_path' },
  'test-suite':       { file: 'qa-engineer.yml',          inputKey: 'test_cases_path' },
  'test-report':      { file: 'qa-engineer.yml',          inputKey: 'test_suite_path' },
  'ai-agent-reviewer':{ file: 'security-reviewer.yml',    inputKey: 'code_path' },
  'human-in-loop':    null, // PAUSE — requires human approval
  'deployment':       { file: 'devops-agent.yml',         inputKey: 'artifact_path' },
  'release':          { file: 'devops-agent.yml',         inputKey: 'deployment_path' },
  'incident':         { file: 'incident-analyzer.yml',    inputKey: 'incident_details' },
  'monitoring':       { file: 'sre-agent.yml',            inputKey: 'service_name' },
};

// ---------- GitHub helpers ----------

async function githubDispatch(workflowFile, inputs = {}) {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main', inputs }),
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `GitHub dispatch failed: ${res.status}`);
  }
}

async function getLatestGitHubRunId(workflowFile) {
  // Wait a few seconds for GitHub to register the run before fetching
  await new Promise(r => setTimeout(r, 4000));
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowFile}/runs?per_page=1`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.workflow_runs?.[0]?.id ?? null;
}

async function pollGitHubRunUntilDone(runId, timeoutMs = 30 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 15000));
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) continue;
    const run = await res.json();
    if (run.status === 'completed') {
      return run.conclusion === 'success' ? 'completed' : 'failed';
    }
  }
  return 'failed'; // timed out
}

// ---------- DB helpers ----------

async function updateNodeExecution(executionId, nodeId, fields) {
  const setClauses = Object.keys(fields).map((k, i) => `${k} = $${i + 3}`).join(', ');
  const values = Object.values(fields);
  await query(
    `UPDATE workflow_node_executions SET ${setClauses} WHERE execution_id = $1 AND node_id = $2`,
    [executionId, nodeId, ...values]
  );
}

async function updateExecution(executionId, fields) {
  const setClauses = Object.keys(fields).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = Object.values(fields);
  await query(
    `UPDATE workflow_executions SET ${setClauses} WHERE id = $1`,
    [executionId, ...values]
  );
}

// ---------- Topological sort ----------

function topoSort(nodes, edges) {
  const nodeIds = nodes.map(n => n.id);
  const inDegree = Object.fromEntries(nodeIds.map(id => [id, 0]));
  const adj = Object.fromEntries(nodeIds.map(id => [id, []]));

  for (const e of edges) {
    if (inDegree[e.toId] !== undefined) inDegree[e.toId]++;
    if (adj[e.fromId]) adj[e.fromId].push(e.toId);
  }

  const queue = nodeIds.filter(id => inDegree[id] === 0);
  const order = [];

  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of (adj[id] || [])) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  return order.map(id => nodes.find(n => n.id === id)).filter(Boolean);
}

// ---------- Execution Engine ----------

export class ExecutionModel {
  /**
   * Start a new execution for a workflow.
   * Spawns an async loop that drives nodes in topological order.
   */
  static async startExecution(workflowId) {
    await ensureSchema();
    const workflow = await WorkflowModel.getWorkflowById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    // Create execution record
    const execResult = await query(
      `INSERT INTO workflow_executions (workflow_id, status, triggered_by)
       VALUES ($1, 'running', 'user') RETURNING *`,
      [workflowId]
    );
    const execution = execResult.rows[0];

    // Create per-node execution records
    for (const node of workflow.nodes) {
      await query(
        `INSERT INTO workflow_node_executions
         (workflow_id, execution_id, node_id, node_type, status, inputs)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         ON CONFLICT (execution_id, node_id) DO NOTHING`,
        [workflowId, execution.id, node.id, node.type,
         JSON.stringify(node.config?.inputs || node.config || {})]
      );
    }

    // Update workflow status to active
    await query(`UPDATE workflows SET status = 'active' WHERE id = $1`, [workflowId]);

    // Drive execution asynchronously (fire and forget)
    setImmediate(() => ExecutionModel._drive(execution.id, workflow).catch(err => {
      console.error(`Execution ${execution.id} failed:`, err.message);
      query(`UPDATE workflow_executions SET status = 'failed', completed_at = NOW(),
             error_message = $2 WHERE id = $1`, [execution.id, err.message]);
    }));

    return execution;
  }

  /**
   * Internal: drives nodes in topological order.
   */
  static async _drive(executionId, workflow) {
    const orderedNodes = topoSort(workflow.nodes, workflow.edges);

    for (const node of orderedNodes) {
      // Check if execution was cancelled/rejected
      const execRow = await query(
        `SELECT status FROM workflow_executions WHERE id = $1`, [executionId]
      );
      if (!execRow.rows.length || ['failed', 'cancelled'].includes(execRow.rows[0].status)) break;

      // Mark node running
      await updateNodeExecution(executionId, node.id, {
        status: 'running',
        started_at: new Date(),
      });
      await updateExecution(executionId, { current_node_id: node.id });

      const mapping = NODE_WORKFLOW_MAP[node.type];

      // human-in-loop: pause until approved
      if (node.type === 'human-in-loop') {
        await updateNodeExecution(executionId, node.id, { status: 'awaiting_approval' });
        // Wait for approval (poll DB every 10s)
        const approved = await ExecutionModel._waitForApproval(executionId, node.id);
        if (!approved) {
          await updateNodeExecution(executionId, node.id, {
            status: 'rejected',
            completed_at: new Date(),
          });
          await updateExecution(executionId, {
            status: 'failed',
            completed_at: new Date(),
            error_message: 'Rejected at human review stage',
          });
          await query(`UPDATE workflows SET status = 'paused' WHERE id = $1`, [workflow.id]);
          return;
        }
        await updateNodeExecution(executionId, node.id, {
          status: 'completed',
          completed_at: new Date(),
        });
        continue;
      }

      // No GitHub workflow for this type (e.g. pull-request auto-created)
      if (!mapping) {
        await updateNodeExecution(executionId, node.id, {
          status: 'completed',
          completed_at: new Date(),
        });
        continue;
      }

      // Build inputs: use node's stored config, map to workflow input key
      const nodeInputs = node.config?.inputs || node.config || {};
      const primaryValue = nodeInputs[mapping.inputKey]
        || nodeInputs['repository_url_or_path']
        || nodeInputs['repoToAnalyse']
        || '';
      const githubInputs = { [mapping.inputKey]: primaryValue };

      try {
        // Trigger GitHub Actions
        await githubDispatch(mapping.file, githubInputs);

        // Capture the GitHub run ID
        const githubRunId = await getLatestGitHubRunId(mapping.file);
        if (githubRunId) {
          await updateNodeExecution(executionId, node.id, {
            github_run_id: githubRunId,
            github_workflow_file: mapping.file,
            inputs: JSON.stringify(githubInputs),
          });
        }

        // Poll until GitHub run finishes
        const result = githubRunId
          ? await pollGitHubRunUntilDone(githubRunId)
          : 'completed'; // no run ID — assume success if dispatch didn't throw

        await updateNodeExecution(executionId, node.id, {
          status: result,
          completed_at: new Date(),
        });

        if (result === 'failed') {
          await updateExecution(executionId, {
            status: 'failed',
            completed_at: new Date(),
            error_message: `Node "${node.label}" GitHub workflow failed`,
          });
          await query(`UPDATE workflows SET status = 'paused' WHERE id = $1`, [workflow.id]);
          return;
        }
      } catch (err) {
        await updateNodeExecution(executionId, node.id, {
          status: 'failed',
          completed_at: new Date(),
          error_message: err.message,
        });
        await updateExecution(executionId, {
          status: 'failed',
          completed_at: new Date(),
          error_message: err.message,
        });
        await query(`UPDATE workflows SET status = 'paused' WHERE id = $1`, [workflow.id]);
        return;
      }
    }

    // All nodes done
    await updateExecution(executionId, {
      status: 'completed',
      completed_at: new Date(),
      current_node_id: null,
    });
    await query(`UPDATE workflows SET status = 'archived' WHERE id = $1`, [workflow.id]);
  }

  /**
   * Poll the DB until a human-in-loop node is approved or rejected.
   * Returns true if approved, false if rejected or execution cancelled.
   */
  static async _waitForApproval(executionId, nodeId, timeoutMs = 4 * 60 * 60 * 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 10000));
      const row = await query(
        `SELECT status FROM workflow_node_executions
         WHERE execution_id = $1 AND node_id = $2`,
        [executionId, nodeId]
      );
      const status = row.rows[0]?.status;
      if (status === 'completed') return true;
      if (status === 'rejected') return false;
    }
    return false; // timed out
  }

  /**
   * Get full execution state for a workflow (latest execution + all node statuses).
   */
  static async getExecutionState(workflowId) {
    await ensureSchema();
    const execRow = await query(
      `SELECT * FROM workflow_executions
       WHERE workflow_id = $1
       ORDER BY started_at DESC LIMIT 1`,
      [workflowId]
    );
    if (!execRow.rows.length) return null;
    const execution = execRow.rows[0];

    const nodeRows = await query(
      `SELECT node_id, node_type, status, github_run_id, github_workflow_file,
              inputs, outputs, started_at, completed_at, error_message
       FROM workflow_node_executions
       WHERE execution_id = $1
       ORDER BY created_at`,
      [execution.id]
    );

    return {
      ...execution,
      nodeExecutions: nodeRows.rows,
    };
  }

  /**
   * Approve a human-in-loop node — resumes execution.
   */
  static async approveNode(workflowId, nodeId) {
    const execRow = await query(
      `SELECT id FROM workflow_executions
       WHERE workflow_id = $1 AND status = 'running'
       ORDER BY started_at DESC LIMIT 1`,
      [workflowId]
    );
    if (!execRow.rows.length) throw new Error('No running execution found');
    const executionId = execRow.rows[0].id;

    await updateNodeExecution(executionId, nodeId, { status: 'completed' });
    return { approved: true, executionId };
  }

  /**
   * Reject a human-in-loop node — stops execution.
   */
  static async rejectNode(workflowId, nodeId) {
    const execRow = await query(
      `SELECT id FROM workflow_executions
       WHERE workflow_id = $1 AND status = 'running'
       ORDER BY started_at DESC LIMIT 1`,
      [workflowId]
    );
    if (!execRow.rows.length) throw new Error('No running execution found');
    const executionId = execRow.rows[0].id;

    await updateNodeExecution(executionId, nodeId, { status: 'rejected' });
    return { rejected: true, executionId };
  }
}

export default ExecutionModel;
