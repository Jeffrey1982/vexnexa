import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { processedWebhook: db } }));
import { claimWebhookLease, finishWebhookLease, withBillingOperationLock, WEBHOOK_LEASE_MS } from './webhook-lease';
const key = { webhookId: 'tr_one', webhookType: 'payment' };

describe('durable billing operation leases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.upsert.mockResolvedValue({});
    db.updateMany.mockResolvedValue({ count: 1 });
    db.findUnique.mockResolvedValue({ status: 'processing' });
  });
  it('claims through a conditional database update, without resetting an existing row', async () => {
    const claim = await claimWebhookLease(key);
    expect(claim.state).toBe('acquired');
    expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
    const query = db.updateMany.mock.calls[0][0];
    expect(query.where).toMatchObject(key);
    expect(query.where.OR[0].status.in).not.toContain('processed');
    expect(query.data.processingToken).toMatch(/^[a-f0-9-]{36}$/);
    expect(query.data.processingStartedAt.getTime() - query.where.OR[1].processingStartedAt.lt.getTime()).toBe(WEBHOOK_LEASE_MS);
  });
  it('allows only one of two concurrent claims to execute', async () => {
    db.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const claims = await Promise.all([claimWebhookLease(key), claimWebhookLease(key)]);
    expect(claims.map(claim => claim.state).sort()).toEqual(['acquired', 'busy']);
  });
  it('reports durable completion when no claim is permitted', async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    db.findUnique.mockResolvedValue({ status: 'processed' });
    expect(await claimWebhookLease(key)).toEqual({ state: 'processed' });
  });
  it('tolerates a concurrent insert only when the exact webhook key now exists', async () => {
    db.upsert.mockRejectedValue({ code: 'P2002' });
    db.findUnique.mockResolvedValue({ id: 'winner' });
    expect((await claimWebhookLease(key)).state).toBe('acquired');
    db.findUnique.mockResolvedValue(null);
    await expect(claimWebhookLease(key)).rejects.toMatchObject({ code: 'P2002' });
  });
  it('can reuse a customer serialization key after completion', async () => {
    await claimWebhookLease(key, true);
    expect(db.updateMany.mock.calls[0][0].where.OR[0].status.in).toContain('processed');
  });
  it('fences completion with the exact owner token and clears its lease', async () => {
    await finishWebhookLease({ ...key, token: 'owner1' }, 'processed');
    expect(db.updateMany).toHaveBeenCalledWith({
      where: { ...key, status: 'processing', processingToken: 'owner1' },
      data: { status: 'processed', processingToken: null, processingStartedAt: null, errorMessage: null, processedAt: expect.any(Date) },
    });
  });
  it('does not let an expired owner overwrite its replacement', async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    await expect(finishWebhookLease({ ...key, token: 'old-owner' }, 'processed')).rejects.toThrow('lease lost');
  });
  it('bounds stored failure text', async () => {
    await finishWebhookLease({ ...key, token: 'owner' }, 'failed', 'x'.repeat(2000));
    expect(db.updateMany.mock.calls[0][0].data.errorMessage).toHaveLength(1000);
  });
  it('releases the per-user lock after successful work', async () => {
    const work = vi.fn().mockResolvedValue('subscription');
    expect(await withBillingOperationLock('u1', work)).toBe('subscription');
    expect(db.upsert.mock.calls[0][0].where.webhookId_webhookType).toEqual({ webhookId: 'u1', webhookType: 'subscription_provisioning' });
    expect(db.updateMany.mock.calls[1][0].data.status).toBe('released');
  });
  it('does not start provider operations when the customer is busy', async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    const work = vi.fn();
    await expect(withBillingOperationLock('u1', work)).rejects.toThrow('in progress');
    expect(work).not.toHaveBeenCalled();
  });
  it('records failures and rethrows the original provider error', async () => {
    await expect(withBillingOperationLock('u1', async () => { throw new Error('provider unavailable'); })).rejects.toThrow('provider unavailable');
    expect(db.updateMany.mock.calls[1][0].data.status).toBe('failed');
  });
});
