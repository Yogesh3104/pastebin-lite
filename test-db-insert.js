const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('1. Connected to database');
    
    // Insert a test paste
    const id = 'test123';
    const content = 'Test content';
    const expiresAt = new Date(Date.now() + 300000); // 5 minutes from now
    
    const result = await client.query(
      `INSERT INTO pastes (id, content, expires_at, max_views) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, content`,
      [id, content, expiresAt, 5]
    );
    
    console.log('2. Inserted paste:', result.rows[0]);
    
    // Try to retrieve it
    const getResult = await client.query(
      'SELECT * FROM pastes WHERE id = $1',
      [id]
    );
    
    console.log('3. Retrieved paste:', getResult.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
