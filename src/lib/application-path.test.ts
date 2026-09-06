import { describe, expect, it } from 'vitest';
import { isApplicationPath } from './application-path';

describe('isApplicationPath', () => {
  it.each([
    '/', '/nl', '/nl/', '/de/pricing', '/fr/for-agencies', '/free-scan',
    '/sample-report', '/founding-agencies', '/blog/article', '/auth/login',
    '/auth/reset-password', '/checkout/return', '/dashboard-preview', null,
  ])('keeps application services off public path %s', (path) => {
    expect(isApplicationPath(path)).toBe(false);
  });

  it.each([
    '/dashboard', '/dashboard/leads', '/sites/123/structure',
    '/scans/123/report', '/settings/billing', '/teams', '/report/example/123',
    '/admin/users', '/analytics', '/advanced-analytics', '/onboarding',
    '/nl/dashboard',
  ])('enables application services on %s', (path) => {
    expect(isApplicationPath(path)).toBe(true);
  });
});
