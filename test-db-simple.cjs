/**
 * Simple PostgreSQL Connection Test (CommonJS version)
 *
 * Run: node test-db-simple.cjs
 */

const { Client } = require('pg');

// ⚠️ UPDATE THESE VALUES WITH YOUR CREDENTIALS
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'agenticsdlc_dev', // Now test with our application database
  user: 'postgres',
  password: 'Nttdata#123', // CHANGE THIS to your actual password
};

console.log('Testing PostgreSQL Connection...');
console.log('Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: '****' // Hide password in output
});
console.log('');

const client = new Client(dbConfig);

async function test() {
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const res = await client.query('SELECT NOW(), version()');
    console.log('✅ Database time:', res.rows[0].now);
    console.log('✅ PostgreSQL version:', res.rows[0].version.split(',')[0]);

    // List databases
    const dbRes = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('\n📋 Available databases:');
    dbRes.rows.forEach(row => console.log('  •', row.datname));

    console.log('\n✅ CONNECTION TEST PASSED!');

  } catch (err) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error('Error:', err.message);
    console.error('\nCommon fixes:');
    console.error('1. Check PostgreSQL is running: net start postgresql*');
    console.error('2. Verify password in this file');
    console.error('3. Check if database exists');

  } finally {
    await client.end();
  }
}

test();
