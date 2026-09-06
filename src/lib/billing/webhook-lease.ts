import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';

// Longer than the webhook route's 60-second execution limit. A crashed worker
// can be retried, but two live workers must not provision the same subscription.
export const WEBHOOK_LEASE_MS = 5 * 60 * 1000;

type WebhookKey = { webhookId: string; webhookType: string };
export type WebhookLease = WebhookKey & { token: string };
type Claim = { state: 'processed' } | { state: 'busy' } | { state: 'acquired'; lease: WebhookLease };

export async function claimWebhookLease(key: WebhookKey, reusable = false): Promise<Claim> {
  const where = { webhookId_webhookType: key };
  // The unique constraint serializes first delivery. Never reset another
  // worker's state in this upsert; only the conditional claim may change it.
  try {
    await prisma.processedWebhook.upsert({
      where, create: { ...key, status: 'received', attempts: 0 }, update: {},
    });
  } catch (error) {
    // Some Prisma versions implement an empty-update upsert with a preliminary
    // read. A concurrent insert may win; only tolerate that exact existing key.
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002') ||
        !await prisma.processedWebhook.findUnique({ where, select: { id: true } })) throw error;
  }
  const now = new Date();
  const token = randomUUID();
  const claimed = await prisma.processedWebhook.updateMany({
    where: {
      ...key,
      OR: [
        { status: { in: ['received', 'pending', 'failed', 'released', ...(reusable ? ['processed'] : [])] } },
        { status: 'processing', processingStartedAt: { lt: new Date(now.getTime() - WEBHOOK_LEASE_MS) } },
        { status: 'processing', processingStartedAt: null },
      ],
    },
    data: {
      status: 'processing', processingToken: token, processingStartedAt: now,
      errorMessage: null, attempts: { increment: 1 },
    },
  });
  if (claimed.count === 1) return { state: 'acquired', lease: { ...key, token } };
  const existing = await prisma.processedWebhook.findUnique({ where, select: { status: true } });
  return { state: existing?.status === 'processed' && !reusable ? 'processed' : 'busy' };
}

export async function finishWebhookLease(
  lease: WebhookLease,
  status: 'processed' | 'pending' | 'failed' | 'released',
  errorMessage?: string,
): Promise<void> {
  const result = await prisma.processedWebhook.updateMany({
    where: {
      webhookId: lease.webhookId, webhookType: lease.webhookType,
      status: 'processing', processingToken: lease.token,
    },
    data: {
      status, processingToken: null, processingStartedAt: null,
      errorMessage: errorMessage?.slice(0, 1000) ?? null,
      ...(status === 'processed' ? { processedAt: new Date() } : {}),
    },
  });
  if (result.count !== 1) throw new Error('Billing operation lease lost; retry required');
}

/** Serialize different first-payment webhooks for the same customer as well. */
export async function withBillingOperationLock<T>(userId: string, work: () => Promise<T>): Promise<T> {
  const claim = await claimWebhookLease({ webhookId: userId, webhookType: 'subscription_provisioning' }, true);
  if (claim.state !== 'acquired') throw new Error('Another billing operation is in progress; retry required');
  try {
    const result = await work();
    await finishWebhookLease(claim.lease, 'released');
    return result;
  } catch (error) {
    await finishWebhookLease(claim.lease, 'failed', error instanceof Error ? error.message : 'Billing operation failed').catch(() => undefined);
    throw error;
  }
}
