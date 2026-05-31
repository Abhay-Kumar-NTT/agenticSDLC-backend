/**
 * Database Setup Script
 *
 * Creates database and runs schema
 * Run: node setup-database.cjs
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_PASSWORD = 'Nttdata#123';

// Step 1: Create database
async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default database first
    user: 'postgres',
    password: DB_PASSWORD,
  });

  try {
    console.log('📦 Step 1: Creating database...');
    await client.connect();

    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'agenticsdlc_dev'"
    );

    if (checkDb.rows.length > 0) {
      console.log('ℹ️  Database "agenticsdlc_dev" already exists');
    } else {
      await client.query('CREATE DATABASE agenticsdlc_dev');
      console.log('✅ Database "agenticsdlc_dev" created successfully!');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    await client.end();
    throw error;
  }
}

// Step 2: Run schema
async function runSchema() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'agenticsdlc_dev', // Now connect to our new database
    user: 'postgres',
    password: DB_PASSWORD,
  });

  try {
    console.log('\n📋 Step 2: Running database schema...');
    await client.connect();

    // Read schema file
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await client.query(schema);
    console.log('✅ Schema executed successfully!');

    // Verify tables created
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    await client.end();
  } catch (error) {
    console.error('❌ Error running schema:', error.message);
    await client.end();
    throw error;
  }
}

// Step 3: Verify setup
async function verifySetup() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'agenticsdlc_dev',
    user: 'postgres',
    password: DB_PASSWORD,
  });

  try {
    console.log('\n✔️  Step 3: Verifying setup...');
    await client.connect();

    // Check tables
    const tableCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log(`✓ Found ${tableCount.rows[0].count} tables`);

    // Check views
    const viewCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_schema = 'public'
    `);

    console.log(`✓ Found ${viewCount.rows[0].count} views`);

    await client.end();

    console.log('\n═══════════════════════════════════════');
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Update .env with your credentials');
    console.log('3. Run: npm run dev');
    console.log('');

  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
    await client.end();
    throw error;
  }
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Database Setup for AgenticSDLC      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    await createDatabase();
    await runSchema();
    await verifySetup();
  } catch (error) {
    console.log('\n❌ Setup failed!');
    console.log('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('• Check PostgreSQL is running');
    console.log('• Verify password in this script');
    console.log('• Ensure you have CREATE DATABASE permissions');
    process.exit(1);
  }
}

main();
