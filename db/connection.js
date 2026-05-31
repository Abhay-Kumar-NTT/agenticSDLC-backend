/**
 * Database Connection Pool
 *
 * This file manages the PostgreSQL connection pool using pg library.
 */

import pkg from 'pg';
const { Pool } = pkg;
import { dbConfig, environment } from '../config/database.config.js';

// Create connection pool
const pool = new Pool(dbConfig);

// Log pool creation
console.log(`🔌 Database pool created for environment: ${environment}`);
console.log(`📍 Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text, duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Client connection
 */
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Set a timeout to release client after 30 seconds
  const timeout = setTimeout(() => {
    console.warn('⚠️ Client has been checked out for more than 30 seconds!');
  }, 30000);

  // Override release to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    client.removeAllListeners('error');
    release();
  };

  return client;
};

/**
 * Gracefully close the pool
 */
export const close = async () => {
  await pool.end();
  console.log('🔌 Database pool closed');
};

// Handle process termination
process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await close();
  process.exit(0);
});

export default { query, getClient, close };
