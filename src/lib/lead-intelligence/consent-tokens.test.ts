import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createConsentToken, hashConsentToken } from './consent-tokens';

describe('consent tokens', () => {
  it('creates URL-safe 256-bit tokens without padding', () => {
    const token = createConsentToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  });

  it('does not reuse tokens across independent consent requests', () => {
    expect(new Set(Array.from({ length: 100 }, createConsentToken)).size).toBe(100);
  });

  it.each(['', 'consent-token', 'toestemming-é'])('hashes the exact UTF-8 input %j deterministically', (token) => {
    expect(hashConsentToken(token)).toBe(createHash('sha256').update(token, 'utf8').digest('hex'));
    expect(hashConsentToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('does not trim or case-fold secret tokens', () => {
    expect(hashConsentToken('Token')).not.toBe(hashConsentToken('token'));
    expect(hashConsentToken('token ')).not.toBe(hashConsentToken('token'));
  });
});
