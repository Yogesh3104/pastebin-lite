import { customAlphabet } from 'nanoid'; 

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateId = customAlphabet(alphabet, 10);

export function generatePasteId(): string {
  return generateId();
}

export function calculateExpiry(ttlSeconds?: number): Date | null {
  if (!ttlSeconds) return null;
  const now = new Date();
  now.setSeconds(now.getSeconds() + ttlSeconds);
  return now;
}

export function isExpired(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return false;
  return now >= expiresAt;
}

export function isViewLimitExceeded(views: number, maxViews?: number): boolean {
  if (!maxViews) return false;
  return views >= maxViews;
}

export function getTestTime(req: any): Date {
  if (process.env.TEST_MODE === '1' && req.headers['x-test-now-ms']) {
    const testTimeMs = parseInt(req.headers['x-test-now-ms'] as string, 10);
    return new Date(testTimeMs);
  }
  return new Date();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
