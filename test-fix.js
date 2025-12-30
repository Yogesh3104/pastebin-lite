const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing fixed connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for localhost
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Test if table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pastes'
      )
    `);
    
    console.log('✅ Table exists:', result.rows[0].exists);
    
    client.release();
    await pool.end();
    console.log('✅ Test passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
