import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), findUnique: vi.fn(), sync: vi.fn(), redirect: vi.fn() }));
vi.mock('@/lib/supabase/server-new', () => ({ createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })) }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock('@/lib/user-sync', () => ({ ensureUserInDatabase: mocks.sync }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import { getCurrentUser, getUserFromRequest, isAdmin, requireAdmin, requireAdminAPI, requireAuth } from '../auth';

const sessionUser = (overrides = {}) => ({ id: 'session-user', email: 'person@example.com', created_at: '2026-01-01T00:00:00.000Z',
  user_metadata: { first_name: 'Session', last_name: 'Person' }, ...overrides });
const dbUser = (overrides = {}) => ({ id: 'db-user', email: 'person@example.com', firstName: 'Database', lastName: 'Person',
  company: 'Agency', plan: 'BUSINESS', subscriptionStatus: 'active', profileCompleted: true, marketingEmails: false,
  productUpdates: true, isAdmin: false, createdAt: new Date('2025-01-01'), updatedAt: new Date('2026-01-01'), ...overrides });

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.getUser.mockResolvedValue({ data: { user: sessionUser() }, error: null });
  mocks.findUnique.mockResolvedValue(dbUser());
  mocks.sync.mockResolvedValue(undefined);
  mocks.redirect.mockImplementation((path: string) => { throw new Error(`REDIRECT:${path}`); });
  vi.stubEnv('ADMIN_EMAILS', '');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('authenticated user resolution', () => {
  it.each([{ data: { user: null }, error: null }, { data: { user: sessionUser() }, error: new Error('expired session') }])(
    'rejects absent or invalid sessions before database access', async (result) => {
      mocks.getUser.mockResolvedValue(result);
      await expect(getCurrentUser()).rejects.toThrow('Authentication required');
      expect(mocks.findUnique).not.toHaveBeenCalled();
    });
  it('uses database plan/profile values instead of user-controlled metadata', async () => {
    const result = await getCurrentUser();
    expect(result).toMatchObject(dbUser());
    expect(result.supabaseUser.id).toBe('session-user');
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'session-user' } }));
    expect(mocks.sync).not.toHaveBeenCalled();
  });
  it('syncs missing users then resolves the existing database identity by email', async () => {
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(dbUser({ id: 'existing-id' }));
    expect((await getCurrentUser()).id).toBe('existing-id');
    expect(mocks.sync).toHaveBeenCalledWith(sessionUser());
    expect(mocks.findUnique.mock.calls[1][0].where).toEqual({ email: 'person@example.com' });
  });
  it('handles an initial database failure through the same controlled sync path', async () => {
    mocks.findUnique.mockRejectedValueOnce(new Error('temporary error')).mockResolvedValueOnce(dbUser());
    expect((await getCurrentUser()).plan).toBe('BUSINESS');
    expect(mocks.sync).toHaveBeenCalledOnce();
  });
  it('falls back to free access and safe preferences if synchronization fails', async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.sync.mockRejectedValue(new Error('sync unavailable'));
    expect(await getCurrentUser()).toMatchObject({ id: 'session-user', firstName: 'Session', lastName: 'Person',
      company: null, plan: 'FREE', subscriptionStatus: 'active', profileCompleted: true,
      marketingEmails: true, productUpdates: true, isAdmin: false });
  });
  it('preserves explicit email preferences and incomplete profiles in fallback data', async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.getUser.mockResolvedValue({ data: { user: sessionUser({ user_metadata: { marketing_emails: false, product_updates: false } }) }, error: null });
    expect(await getCurrentUser()).toMatchObject({ firstName: null, lastName: null, profileCompleted: false, marketingEmails: false, productUpdates: false });
  });
  it('does not issue an email lookup when the session has no email', async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.getUser.mockResolvedValue({ data: { user: sessionUser({ email: undefined, user_metadata: undefined }) }, error: null });
    expect(await getCurrentUser()).toMatchObject({ id: 'session-user', isAdmin: false, plan: 'FREE' });
    expect(mocks.findUnique).toHaveBeenCalledOnce();
  });
  it('wraps authentication failures consistently and exposes the authenticated request user', async () => {
    expect((await requireAuth()).id).toBe('db-user');
    expect((await getUserFromRequest()).id).toBe('db-user');
    mocks.getUser.mockRejectedValue(new Error('upstream details'));
    await expect(requireAuth()).rejects.toThrow('Authentication required');
  });
});

describe('admin authorization boundary', () => {
  it.each([true, false])('does not trust self-editable metadata with database present=%s', async (databasePresent) => {
    mocks.getUser.mockResolvedValue({ data: { user: sessionUser({ user_metadata: { is_admin: true } }) }, error: null });
    mocks.findUnique.mockResolvedValue(databasePresent ? dbUser() : null);
    expect((await getCurrentUser()).isAdmin).toBe(false);
    await expect(requireAdminAPI()).rejects.toThrow('Unauthorized: Admin access required');
    expect(await isAdmin()).toBe(false);
  });
  it('still accepts a trusted database admin role', async () => {
    mocks.findUnique.mockResolvedValue(dbUser({ isAdmin: true }));
    expect((await requireAdminAPI()).isAdmin).toBe(true);
    expect((await requireAdmin()).isAdmin).toBe(true);
    expect(await isAdmin()).toBe(true);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it.each([' person@example.com, ,another@example.com ', undefined])('preserves the configured or existing owner allowlist', async (allowlist) => {
    vi.stubEnv('ADMIN_EMAILS', allowlist);
    if (allowlist === undefined) mocks.findUnique.mockResolvedValue(dbUser({ email: 'jeffrey.aay@gmail.com' }));
    expect(await requireAdminAPI()).toBeTruthy();
    expect(await requireAdmin()).toBeTruthy();
    expect(await isAdmin()).toBe(true);
  });
  it('redirects signed-in non-admins and rejects their API access', async () => {
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/unauthorized');
    await expect(requireAdminAPI()).rejects.toThrow('Unauthorized: Admin access required');
    expect(await isAdmin()).toBe(false);
  });
  it('redirects absent sessions to login, denies the API, and returns false for conditional UI', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/auth/login?redirect=/admin');
    await expect(requireAdminAPI()).rejects.toThrow('Authentication required');
    expect(await isAdmin()).toBe(false);
  });
});
