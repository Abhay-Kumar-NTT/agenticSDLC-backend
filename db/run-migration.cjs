/**
 * Run Database Migration
 *
 * Executes SQL migration files against the PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration from environment
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'agenticsdlc',
  user: process.env.DB_USER || 'agenticsdlc_user',
  password: process.env.DB_PASSWORD || 'dev_password_123',
};

console.log('📦 Migration Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User: ${config.user}`);
console.log('');

async function runMigration(migrationFile) {
  const pool = new Pool(config);

  try {
    console.log(`🚀 Running migration: ${migrationFile}`);

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('   Executing SQL...');

    // Execute migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(`   ${error.message}`);
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Please specify a migration file');
  console.log('');
  console.log('Usage: node db/run-migration.cjs <migration-file>');
  console.log('Example: node db/run-migration.cjs 002_create_repositories_table.sql');
  console.log('');
  process.exit(1);
}

runMigration(migrationFile);
