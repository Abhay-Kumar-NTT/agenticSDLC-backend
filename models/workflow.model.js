/**
 * Workflow Model
 *
 * Handles all database operations for workflows, nodes, and edges.
 */

import { query, getClient } from '../db/connection.js';

export class WorkflowModel {
  /**
   * Create a new workflow with nodes and edges
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Created workflow
   */
  static async createWorkflow({ name, description, status, nodes, edges, createdBy, metadata }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Insert workflow
      const workflowResult = await client.query(
        `INSERT INTO workflows (name, description, status, created_by, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, description || null, status || 'draft', createdBy || null, JSON.stringify(metadata || {})]
      );

      const workflow = workflowResult.rows[0];

      // Insert nodes
      if (nodes && nodes.length > 0) {
        const nodeValues = nodes.map((node, index) => {
          const params = [
            workflow.id,
            node.id,
            node.type,
            node.label,
            node.category,
            node.color,
            node.x,
            node.y,
            JSON.stringify(node.config || {})
          ];
          const placeholders = params.map((_, i) => `$${index * 9 + i + 1}`).join(', ');
          return { params, placeholders };
        });

        const nodeInsertQuery = `
          INSERT INTO workflow_nodes
          (workflow_id, node_id, node_type, label, category, color, position_x, position_y, config)
          VALUES ${nodeValues.map(v => `(${v.placeholders})`).join(', ')}
        `;

        const allNodeParams = nodeValues.flatMap(v => v.params);
        await client.query(nodeInsertQuery, allNodeParams);
      }

      // Insert edges
      if (edges && edges.length > 0) {
        const edgeValues = edges.map((edge, index) => {
          const params = [
            workflow.id,
            edge.id,
            edge.fromId,
            edge.toId,
            edge.relationship,
            JSON.stringify(edge.config || {})
          ];
          const placeholders = params.map((_, i) => `$${index * 6 + i + 1}`).join(', ');
          return { params, placeholders };
        });

        const edgeInsertQuery = `
          INSERT INTO workflow_edges
          (workflow_id, edge_id, from_node_id, to_node_id, relationship, config)
          VALUES ${edgeValues.map(v => `(${v.placeholders})`).join(', ')}
        `;

        const allEdgeParams = edgeValues.flatMap(v => v.params);
        await client.query(edgeInsertQuery, allEdgeParams);
      }

      await client.query('COMMIT');

      // Return complete workflow with nodes and edges
      return await this.getWorkflowById(workflow.id);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating workflow:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get workflow by ID with nodes and edges
   * @param {string} workflowId - Workflow UUID
   * @returns {Promise<Object>} Workflow with nodes and edges
   */
  static async getWorkflowById(workflowId) {
    const workflowResult = await query(
      'SELECT * FROM workflows WHERE id = $1',
      [workflowId]
    );

    if (workflowResult.rows.length === 0) {
      return null;
    }

    const workflow = workflowResult.rows[0];

    // Get nodes
    const nodesResult = await query(
      `SELECT node_id as id, node_type as type, label, category, color,
              position_x as x, position_y as y, config
       FROM workflow_nodes
       WHERE workflow_id = $1
       ORDER BY created_at`,
      [workflowId]
    );

    // Get edges
    const edgesResult = await query(
      `SELECT edge_id as id, from_node_id as "fromId", to_node_id as "toId",
              relationship, config
       FROM workflow_edges
       WHERE workflow_id = $1
       ORDER BY created_at`,
      [workflowId]
    );

    return {
      ...workflow,
      nodes: nodesResult.rows,
      edges: edgesResult.rows,
    };
  }

  /**
   * Get all workflows (summary view)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of workflows
   */
  static async getAllWorkflows({ status, limit = 50, offset = 0 } = {}) {
    let queryText = `
      SELECT w.*,
             COUNT(DISTINCT wn.id) as node_count,
             COUNT(DISTINCT we.id) as edge_count
      FROM workflows w
      LEFT JOIN workflow_nodes wn ON w.id = wn.workflow_id
      LEFT JOIN workflow_edges we ON w.id = we.workflow_id
    `;

    const params = [];
    if (status) {
      queryText += ' WHERE w.status = $1';
      params.push(status);
    }

    queryText += ' GROUP BY w.id ORDER BY w.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Update workflow
   * @param {string} workflowId - Workflow UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated workflow
   */
  static async updateWorkflow(workflowId, { name, description, status, metadata }) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(JSON.stringify(metadata));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(workflowId);

    const result = await query(
      `UPDATE workflows SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0];
  }

  /**
   * Delete workflow (cascades to nodes and edges)
   * @param {string} workflowId - Workflow UUID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteWorkflow(workflowId) {
    const result = await query(
      'DELETE FROM workflows WHERE id = $1 RETURNING id',
      [workflowId]
    );

    return result.rowCount > 0;
  }

  /**
   * Update workflow nodes and edges
   * @param {string} workflowId - Workflow UUID
   * @param {Object} data - Nodes and edges data
   * @returns {Promise<Object>} Updated workflow
   */
  static async updateWorkflowContent(workflowId, { nodes, edges }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Delete existing nodes and edges (cascade will handle edges)
      await client.query('DELETE FROM workflow_nodes WHERE workflow_id = $1', [workflowId]);

      // Insert new nodes
      if (nodes && nodes.length > 0) {
        const nodeValues = nodes.map((node, index) => {
          const params = [
            workflowId,
            node.id,
            node.type,
            node.label,
            node.category,
            node.color,
            node.x,
            node.y,
            JSON.stringify(node.config || {})
          ];
          const placeholders = params.map((_, i) => `$${index * 9 + i + 1}`).join(', ');
          return { params, placeholders };
        });

        const nodeInsertQuery = `
          INSERT INTO workflow_nodes
          (workflow_id, node_id, node_type, label, category, color, position_x, position_y, config)
          VALUES ${nodeValues.map(v => `(${v.placeholders})`).join(', ')}
        `;

        const allNodeParams = nodeValues.flatMap(v => v.params);
        await client.query(nodeInsertQuery, allNodeParams);
      }

      // Insert new edges
      if (edges && edges.length > 0) {
        const edgeValues = edges.map((edge, index) => {
          const params = [
            workflowId,
            edge.id,
            edge.fromId,
            edge.toId,
            edge.relationship,
            JSON.stringify(edge.config || {})
          ];
          const placeholders = params.map((_, i) => `$${index * 6 + i + 1}`).join(', ');
          return { params, placeholders };
        });

        const edgeInsertQuery = `
          INSERT INTO workflow_edges
          (workflow_id, edge_id, from_node_id, to_node_id, relationship, config)
          VALUES ${edgeValues.map(v => `(${v.placeholders})`).join(', ')}
        `;

        const allEdgeParams = edgeValues.flatMap(v => v.params);
        await client.query(edgeInsertQuery, allEdgeParams);
      }

      await client.query('COMMIT');

      return await this.getWorkflowById(workflowId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating workflow content:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default WorkflowModel;
