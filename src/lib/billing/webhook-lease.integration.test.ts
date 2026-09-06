import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.unmock('@/lib/prisma');
import { prisma } from '@/lib/prisma';
import { claimWebhookLease, finishWebhookLease, WEBHOOK_LEASE_MS } from './webhook-lease';

// Explicit opt-in, loopback-only disposable CI database. No .env loading here.
const enabled = process.env.BILLING_DATABASE_TESTS === 'true';
const prefix = `billing-lease-test-${randomUUID()}-`;
let safe = false;

describe.runIf(enabled)('billing lease database concurrency', () => {
  beforeAll(() => {
    if (process.env.CI !== 'true' || process.env.CI_SCRATCH_DATABASE_IS_SAFE !== 'true' ||
        ['production', 'prod'].includes(process.env.NODE_ENV ?? '') ||
        ['production', 'prod'].includes(process.env.VERCEL_ENV ?? '')) {
      throw new Error('Billing database tests require explicit safe CI scratch configuration');
    }
    for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
      const url = new URL(process.env[name] ?? '');
      if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
          !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
          url.pathname !== '/vexnexa_ci_scratch' || url.hash ||
          [...url.searchParams].some(([key, value]) => key !== 'schema' || value !== 'public')) {
        throw new Error('Refusing a non-scratch database');
      }
    }
    if (process.env.DATABASE_URL !== process.env.DIRECT_URL) throw new Error('Scratch URLs must match');
    safe = true;
  });
  afterAll(async () => {
    if (safe) await prisma.processedWebhook.deleteMany({ where: { webhookId: { startsWith: prefix }, webhookType: 'lease_integration_test' } });
  });
  const key = (name: string) => ({ webhookId: prefix + name, webhookType: 'lease_integration_test' });

  it('grants exactly one live owner among concurrent first deliveries', async () => {
    const claims = await Promise.all(Array.from({ length: 8 }, () => claimWebhookLease(key('concurrent'))));
    expect(claims.filter(claim => claim.state === 'acquired')).toHaveLength(1);
    expect(claims.filter(claim => claim.state === 'busy')).toHaveLength(7);
  });
  it('persists completion so later delivery cannot acquire the payment', async () => {
    const claim = await claimWebhookLease(key('completed'));
    if (claim.state !== 'acquired') throw new Error('Expected owner');
    await finishWebhookLease(claim.lease, 'processed');
    expect(await claimWebhookLease(key('completed'))).toEqual({ state: 'processed' });
  });
  it('reclaims a crashed expired worker and fences the old completion', async () => {
    const claim = await claimWebhookLease(key('expired'));
    if (claim.state !== 'acquired') throw new Error('Expected owner');
    await prisma.processedWebhook.update({ where: { webhookId_webhookType: key('expired') }, data: { processingStartedAt: new Date(Date.now() - WEBHOOK_LEASE_MS - 1000) } });
    const replacement = await claimWebhookLease(key('expired'));
    expect(replacement.state).toBe('acquired');
    await expect(finishWebhookLease(claim.lease, 'processed')).rejects.toThrow('lease lost');
    if (replacement.state !== 'acquired') throw new Error('Expected replacement');
    await finishWebhookLease(replacement.lease, 'processed');
  });
  it('permits retry after failure and pending payment status', async () => {
    for (const status of ['failed', 'pending'] as const) {
      const claim = await claimWebhookLease(key(status));
      if (claim.state !== 'acquired') throw new Error('Expected owner');
      await finishWebhookLease(claim.lease, status);
      expect((await claimWebhookLease(key(status))).state).toBe('acquired');
    }
  });
});
