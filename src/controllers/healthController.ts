import { Request, Response } from 'express';
import { pool } from '../db/database';

export async function healthCheck(req: Request, res: Response) {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Health check failed:', error);
    
    let errorMessage = 'Database connection failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      ok: false, 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
