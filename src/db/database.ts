import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Simple pool without SSL for local development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

let isInitialized = false;

export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        ttl_seconds INTEGER,
        max_views INTEGER,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expires_at 
      ON pastes(expires_at)
    `);

    client.release();
    isInitialized = true;
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.log('Continuing without database initialization...');
  }
}

export { pool };
