/**
 * Workflow API Routes
 */

import express from 'express';
import { WorkflowModel } from '../models/workflow.model.js';

const router = express.Router();

/**
 * POST /api/workflows
 * Create a new workflow
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, status, nodes, edges, createdBy, metadata } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Nodes array is required' });
    }

    const workflow = await WorkflowModel.createWorkflow({
      name,
      description,
      status,
      nodes,
      edges: edges || [],
      createdBy,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: workflow,
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      message: error.message,
    });
  }
});

/**
 * GET /api/workflows
 * Get all workflows
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const workflows = await WorkflowModel.getAllWorkflows({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json({
      success: true,
      data: workflows,
      count: workflows.length,
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows',
      message: error.message,
    });
  }
});

/**
 * GET /api/workflows/:id
 * Get workflow by ID with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowModel.getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow',
      message: error.message,
    });
  }
});

/**
 * PUT /api/workflows/:id
 * Update workflow metadata
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, metadata } = req.body;

    const workflow = await WorkflowModel.updateWorkflow(id, {
      name,
      description,
      status,
      metadata,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: workflow,
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      message: error.message,
    });
  }
});

/**
 * PUT /api/workflows/:id/content
 * Update workflow nodes and edges
 */
router.put('/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const { nodes, edges } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Nodes array is required' });
    }

    const workflow = await WorkflowModel.updateWorkflowContent(id, {
      nodes,
      edges: edges || [],
    });

    res.json({
      success: true,
      message: 'Workflow content updated successfully',
      data: workflow,
    });
  } catch (error) {
    console.error('Update workflow content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow content',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await WorkflowModel.deleteWorkflow(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      message: error.message,
    });
  }
});

export default router;
