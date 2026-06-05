/**
 * Repository Model
 *
 * Handles all database operations for connected GitHub repositories
 */

import { query } from '../db/connection.js';

export class Repository {
  /**
   * Find all repositories
   * @returns {Promise<Array>} List of repositories
   */
  static async findAll() {
    const result = await query(
      `SELECT
        id,
        name,
        owner,
        full_name as "fullName",
        language,
        stars,
        branches,
        description,
        url,
        status,
        connected_at as "connectedAt",
        created_at,
        updated_at
      FROM repositories
      ORDER BY created_at DESC`
    );

    return result.rows;
  }

  /**
   * Find repository by ID
   * @param {string} id - Repository ID
   * @returns {Promise<Object|null>} Repository or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT
        id,
        name,
        owner,
        full_name as "fullName",
        language,
        stars,
        branches,
        description,
        url,
        status,
        connected_at as "connectedAt",
        created_at,
        updated_at
      FROM repositories
      WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find repository by full name (owner/repo)
   * @param {string} fullName - Repository full name (e.g., "owner/repo")
   * @returns {Promise<Object|null>} Repository or null
   */
  static async findByFullName(fullName) {
    const result = await query(
      `SELECT
        id,
        name,
        owner,
        full_name as "fullName",
        language,
        stars,
        branches,
        description,
        url,
        status,
        connected_at as "connectedAt",
        created_at,
        updated_at
      FROM repositories
      WHERE full_name = $1`,
      [fullName]
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new repository
   * @param {Object} data - Repository data
   * @returns {Promise<Object>} Created repository
   */
  static async create(data) {
    const {
      name,
      owner,
      full_name,
      language,
      stars,
      branches,
      description,
      url,
      status,
      connected_at
    } = data;

    const result = await query(
      `INSERT INTO repositories (
        name,
        owner,
        full_name,
        language,
        stars,
        branches,
        description,
        url,
        status,
        connected_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id,
        name,
        owner,
        full_name as "fullName",
        language,
        stars,
        branches,
        description,
        url,
        status,
        connected_at as "connectedAt",
        created_at,
        updated_at`,
      [
        name,
        owner,
        full_name,
        language || 'Unknown',
        stars || 0,
        branches || 0,
        description || null,
        url,
        status || 'active',
        connected_at || new Date().toISOString()
      ]
    );

    return result.rows[0];
  }

  /**
   * Update a repository
   * @param {string} id - Repository ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated repository
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    // Add id for WHERE clause
    values.push(id);

    const result = await query(
      `UPDATE repositories
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING
        id,
        name,
        owner,
        full_name as "fullName",
        language,
        stars,
        branches,
        description,
        url,
        status,
        connected_at as "connectedAt",
        created_at,
        updated_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete a repository
   * @param {string} id - Repository ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const result = await query(
      `DELETE FROM repositories WHERE id = $1`,
      [id]
    );

    return result.rowCount > 0;
  }
}

export default Repository;
