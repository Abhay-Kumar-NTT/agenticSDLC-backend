/**
 * Repository Routes
 *
 * Handles API routes for connected GitHub repositories
 */

import express from 'express';
import { Repository } from '../models/Repository.js';

const router = express.Router();

/**
 * GET /api/repositories
 * Get all connected repositories
 */
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all connected repositories');
    const repositories = await Repository.findAll();

    console.log(`Found ${repositories.length} repositories`);
    res.json({
      success: true,
      data: repositories
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repositories'
    });
  }
});

/**
 * GET /api/repositories/:id
 * Get a single repository by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching repository: ${id}`);

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    res.json({
      success: true,
      data: repository
    });
  } catch (error) {
    console.error('Error fetching repository:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repository'
    });
  }
});

/**
 * POST /api/repositories
 * Connect a new repository
 */
router.post('/', async (req, res) => {
  try {
    const { name, owner, fullName, language, stars, branches, description, url, status } = req.body;

    // Validate required fields
    if (!name || !owner || !fullName || !url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, owner, fullName, url'
      });
    }

    console.log(`Connecting repository: ${fullName}`);

    // Check if repository already exists
    const existingRepo = await Repository.findByFullName(fullName);
    if (existingRepo) {
      return res.status(409).json({
        success: false,
        error: `Repository "${fullName}" is already connected`
      });
    }

    // Create repository
    const repositoryData = {
      name,
      owner,
      full_name: fullName,
      language: language || 'Unknown',
      stars: stars || 0,
      branches: branches || 0,
      description: description || null,
      url,
      status: status || 'active',
      connected_at: new Date().toISOString()
    };

    const repository = await Repository.create(repositoryData);

    console.log(`Repository connected successfully: ${repository.id}`);
    res.status(201).json({
      success: true,
      data: repository,
      message: 'Repository connected successfully'
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect repository'
    });
  }
});

/**
 * PUT /api/repositories/:id
 * Update a repository
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`Updating repository: ${id}`);

    // Check if repository exists
    const existingRepo = await Repository.findById(id);
    if (!existingRepo) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    // Map camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.owner !== undefined) dbUpdates.owner = updates.owner;
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.stars !== undefined) dbUpdates.stars = updates.stars;
    if (updates.branches !== undefined) dbUpdates.branches = updates.branches;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const repository = await Repository.update(id, dbUpdates);

    console.log(`Repository updated successfully: ${id}`);
    res.json({
      success: true,
      data: repository,
      message: 'Repository updated successfully'
    });
  } catch (error) {
    console.error('Error updating repository:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update repository'
    });
  }
});

/**
 * DELETE /api/repositories/:id
 * Disconnect a repository
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Disconnecting repository: ${id}`);

    // Check if repository exists
    const existingRepo = await Repository.findById(id);
    if (!existingRepo) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found'
      });
    }

    await Repository.delete(id);

    console.log(`Repository disconnected successfully: ${id}`);
    res.json({
      success: true,
      message: 'Repository disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disconnect repository'
    });
  }
});

export default router;
