import { pool } from '../db/database';
import { generatePasteId, calculateExpiry } from '../utils/helpers';

export interface CreatePasteData {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

export interface Paste {
  id: string;
  content: string;
  ttl_seconds?: number;
  max_views?: number;
  views: number;
  created_at: Date;
  expires_at?: Date;
}

export async function createPaste(data: CreatePasteData): Promise<Paste> {
  console.log('Creating paste with data:', data);
  
  const id = generatePasteId();
  const expiresAt = calculateExpiry(data.ttl_seconds);

  console.log('Generated ID:', id);
  console.log('Expires at:', expiresAt);

  try {
    const result = await pool.query(
      `INSERT INTO pastes (id, content, ttl_seconds, max_views, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content, ttl_seconds, max_views, views, created_at, expires_at`,
      [id, data.content, data.ttl_seconds || null, data.max_views || null, expiresAt]
    );

    console.log('Insert successful:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createPaste:', error);
    throw error;
  }
}

export async function getPaste(id: string, now: Date): Promise<Paste | null> {
  console.log('Getting paste:', id, 'at time:', now);
  
  try {
    // First get the paste
    const result = await pool.query(
      `SELECT id, content, ttl_seconds, max_views, views, created_at, expires_at
       FROM pastes WHERE id = $1`,
      [id]
    );

    console.log('Query result rows:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('Paste not found');
      return null;
    }

    const paste = result.rows[0];
    console.log('Found paste:', paste);

    // Check if expired by time
    if (paste.expires_at && new Date(paste.expires_at) <= now) {
      console.log('Paste expired by time');
      return null;
    }

    // Check if expired by views
    if (paste.max_views && paste.views >= paste.max_views) {
      console.log('Paste expired by views');
      return null;
    }

    // Increment view count
    await pool.query(
      `UPDATE pastes SET views = views + 1 WHERE id = $1`,
      [id]
    );

    console.log('Returning paste with updated views');
    return {
      ...paste,
      views: paste.views + 1
    };
  } catch (error) {
    console.error('Error in getPaste:', error);
    return null;
  }
}

export async function deleteExpiredPastes(): Promise<void> {
  await pool.query(
    `DELETE FROM pastes 
     WHERE (expires_at IS NOT NULL AND expires_at <= NOW())
     OR (max_views IS NOT NULL AND views >= max_views)`
  );
}

export async function getStats(): Promise<{ total: number; active: number }> {
  const totalResult = await pool.query('SELECT COUNT(*) FROM pastes');
  const activeResult = await pool.query(`
    SELECT COUNT(*) FROM pastes 
    WHERE (expires_at IS NULL OR expires_at > NOW())
    AND (max_views IS NULL OR views < max_views)
  `);

  return {
    total: parseInt(totalResult.rows[0].count),
    active: parseInt(activeResult.rows[0].count)
  };
}
