/**
 * Database Configuration
 *
 * This file contains database connection settings for different environments.
 * Update these settings based on your PostgreSQL setup.
 */

import dotenv from 'dotenv';
dotenv.config();

const environments = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'agenticsdlc_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // How long to wait for a connection
  },

  staging: {
    host: process.env.DB_HOST || 'staging-db.example.com',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'agenticsdlc_staging',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false, // For staging
    },
  },

  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: true, // Enforce SSL in production
      ca: process.env.DB_SSL_CA, // SSL certificate
    },
  },
};

// Get current environment from NODE_ENV or default to development
const currentEnv = process.env.NODE_ENV || 'development';

// Validate required environment variables in production
if (currentEnv === 'production') {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Export the configuration for the current environment
export const dbConfig = environments[currentEnv];

// Export environment name for logging
export const environment = currentEnv;

// Export all environments for reference
export default environments;
