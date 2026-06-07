/**
 * Execution API Routes
 *
 * POST   /api/workflows/:id/execute           — start execution
 * GET    /api/workflows/:id/execution         — get current execution state
 * POST   /api/workflows/:id/execution/approve/:nodeId  — approve human-in-loop
 * POST   /api/workflows/:id/execution/reject/:nodeId   — reject human-in-loop
 */

import express from 'express';
import { ExecutionModel } from '../models/execution.model.js';

const router = express.Router({ mergeParams: true });

/**
 * POST /api/workflows/:id/execute
 * Start execution of a saved workflow
 */
router.post('/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const execution = await ExecutionModel.startExecution(id);
    res.status(201).json({
      success: true,
      message: 'Workflow execution started',
      data: execution,
    });
  } catch (error) {
    console.error('Start execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start execution',
    });
  }
});

/**
 * GET /api/workflows/:id/execution
 * Get current execution state (all node statuses)
 */
router.get('/execution', async (req, res) => {
  try {
    const { id } = req.params;
    const state = await ExecutionModel.getExecutionState(id);
    if (!state) {
      return res.status(404).json({ success: false, error: 'No execution found for this workflow' });
    }
    res.json({ success: true, data: state });
  } catch (error) {
    console.error('Get execution state error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch execution state',
    });
  }
});

/**
 * POST /api/workflows/:id/execution/approve/:nodeId
 * Approve a human-in-loop node and resume execution
 */
router.post('/execution/approve/:nodeId', async (req, res) => {
  try {
    const { id, nodeId } = req.params;
    const result = await ExecutionModel.approveNode(id, nodeId);
    res.json({ success: true, message: 'Node approved, execution resuming', data: result });
  } catch (error) {
    console.error('Approve node error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve node',
    });
  }
});

/**
 * POST /api/workflows/:id/execution/reject/:nodeId
 * Reject a human-in-loop node and stop execution
 */
router.post('/execution/reject/:nodeId', async (req, res) => {
  try {
    const { id, nodeId } = req.params;
    const result = await ExecutionModel.rejectNode(id, nodeId);
    res.json({ success: true, message: 'Node rejected, execution halted', data: result });
  } catch (error) {
    console.error('Reject node error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject node',
    });
  }
});

export default router;
