import crypto from 'crypto';

const UNSUBSCRIBE_SECRET: string =
  process.env.OUTREACH_UNSUBSCRIBE_SECRET || process.env.ADMIN_DASH_SECRET || 'vexnexa-unsub-fallback';

/**
 * Generate an HMAC token for an email address so unsubscribe links can't be forged.
 */
export function generateUnsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Verify an HMAC token for an email address.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/**
 * Build a full unsubscribe URL for a given email.
 */
export function buildUnsubscribeUrl(email: string): string {
  const base: string = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vexnexa.com';
  const token = generateUnsubscribeToken(email);
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
