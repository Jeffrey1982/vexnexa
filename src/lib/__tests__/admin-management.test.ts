import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique, findMany: mocks.findMany }, $transaction: mocks.transaction } }));
import { getAllAdminUsers, grantAdminRole, isAdmin, isUserAdmin, revokeAdminRole } from '../admin';

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.transaction.mockImplementation((callback) => callback({ user: { update: mocks.update }, userAdminEvent: { create: mocks.create } }));
  vi.stubEnv('ADMIN_EMAILS', ' allowed@example.com, ,second@example.com ');
});
afterEach(() => vi.unstubAllEnvs());

describe('admin management', () => {
  it.each([
    [null, false],
    [{ email: 'person@example.com', isAdmin: false }, false],
    [{ email: 'person@example.com', isAdmin: true }, true],
    [{ email: 'allowed@example.com', isAdmin: false }, true],
    [{ email: 'jeffrey.aay@gmail.com', isAdmin: false }, true],
  ])('checks database role or exact allowlist membership', async (user, allowed) => {
    mocks.findUnique.mockResolvedValue(user);
    expect(await isUserAdmin('user-1')).toBe(allowed);
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { email: true, isAdmin: true } });
    expect(isAdmin).toBe(isUserAdmin);
  });
  it('does not hide database authorization lookup failures', async () => {
    mocks.findUnique.mockRejectedValue(new Error('database unavailable'));
    await expect(isUserAdmin('user-1')).rejects.toThrow('database unavailable');
  });
  it.each([[grantAdminRole, true, 'grant_admin', 'MANUAL_ACTIVATION'], [revokeAdminRole, false, 'revoke_admin', 'MANUAL_SUSPENSION']] as const)(
    'updates role and audit in a single transaction', async (operation, enabled, action, eventType) => {
      await operation('target-user', 'acting-admin');
      expect(mocks.transaction).toHaveBeenCalledOnce();
      expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'target-user' }, data: { isAdmin: enabled } });
      expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'target-user', adminId: 'acting-admin', eventType,
        metadata: { action, timestamp: expect.any(String) } }) });
    });
  it('propagates audit failures from the transaction', async () => {
    mocks.create.mockRejectedValue(new Error('audit insert failed'));
    await expect(grantAdminRole('target-user', 'acting-admin')).rejects.toThrow('audit insert failed');
  });
  it('lists only database admins in a stable order without secret fields', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'admin' }]);
    expect(await getAllAdminUsers()).toEqual([{ id: 'admin' }]);
    expect(mocks.findMany).toHaveBeenCalledWith({ where: { isAdmin: true }, select: { id: true, email: true, firstName: true,
      lastName: true, createdAt: true, updatedAt: true }, orderBy: { email: 'asc' } });
  });
});
