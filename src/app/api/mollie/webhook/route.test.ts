import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createHmac } from 'node:crypto';

const mocks = vi.hoisted(() => ({ claim: vi.fn(), finish: vi.fn(), payment: vi.fn(), subscription: vi.fn() }));
vi.mock('@/lib/billing/webhook-lease', () => ({ claimWebhookLease: mocks.claim, finishWebhookLease: mocks.finish }));
vi.mock('@/lib/billing/mollie-flows', () => ({ processWebhookPayment: mocks.payment, processSubscriptionWebhook: mocks.subscription }));
import { POST } from './route';

const lease = { webhookId: 'tr_payment1', webhookType: 'payment', token: 'owner1' };
function request(body = 'id=tr_payment1', headers: Record<string, string> = {}) {
  return new NextRequest('https://example.test/api/mollie/webhook', { method: 'POST', body, headers });
}

describe('Mollie webhook delivery safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('MOLLIE_WEBHOOK_REQUIRE_SIGNATURE', 'false');
    vi.stubEnv('MOLLIE_WEBHOOK_SECRET', '');
    mocks.claim.mockResolvedValue({ state: 'acquired', lease });
    mocks.finish.mockResolvedValue(undefined);
    mocks.payment.mockResolvedValue('processed');
    mocks.subscription.mockResolvedValue(undefined);
  });

  it.each(['', 'id=test', 'id=hook.ping'])('acknowledges dashboard ping %s without financial work', async body => {
    const response = await POST(request(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, ping: true });
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it('processes a provider payment under an atomic lease and persists completion', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.claim).toHaveBeenCalledWith({ webhookId: 'tr_payment1', webhookType: 'payment' }, false);
    expect(mocks.payment).toHaveBeenCalledWith('tr_payment1');
    expect(mocks.finish).toHaveBeenCalledWith(lease, 'processed');
  });
  it('does not repeat a completed payment', async () => {
    mocks.claim.mockResolvedValue({ state: 'processed' });
    expect(await (await POST(request())).json()).toEqual({ success: true, idempotent: true });
    expect(mocks.payment).not.toHaveBeenCalled();
  });
  it('requests redelivery while another worker owns the payment', async () => {
    mocks.claim.mockResolvedValue({ state: 'busy' });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(mocks.payment).not.toHaveBeenCalled();
  });
  it('keeps pending status eligible for the later paid notification', async () => {
    mocks.payment.mockResolvedValue('pending');
    expect(await (await POST(request())).json()).toEqual({ success: true, pending: true });
    expect(mocks.finish).toHaveBeenCalledWith(lease, 'pending');
  });
  it('does not acknowledge a transient worker failure or leak its details', async () => {
    mocks.payment.mockRejectedValue(new Error('private database connection detail'));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
    expect(mocks.finish).toHaveBeenCalledWith(lease, 'failed', 'private database connection detail');
  });
  it('requests redelivery if completion could not be persisted', async () => {
    mocks.finish.mockRejectedValue(new Error('db unavailable'));
    expect((await POST(request())).status).toBe(503);
  });
  it('requests redelivery when the initial claim database is unavailable', async () => {
    mocks.claim.mockRejectedValue(new Error('db unavailable'));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.payment).not.toHaveBeenCalled();
  });
  it('re-fetches subscription state on later lifecycle notifications', async () => {
    expect((await POST(request('id=sub_subscription1&type=subscription'))).status).toBe(200);
    expect(mocks.claim).toHaveBeenCalledWith({ webhookId: 'sub_subscription1', webhookType: 'subscription' }, true);
    expect(mocks.subscription).toHaveBeenCalledWith('sub_subscription1');
  });
  it('rejects unknown notification types without consuming the payment', async () => {
    expect((await POST(request('id=tr_payment1&type=other'))).status).toBe(400);
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it('fails closed when required signing is misconfigured, even with a header', async () => {
    vi.stubEnv('MOLLIE_WEBHOOK_REQUIRE_SIGNATURE', 'true');
    expect((await POST(request(undefined, { 'mollie-signature': 'abc' }))).status).toBe(503);
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it('requires a signature only when explicitly configured', async () => {
    vi.stubEnv('MOLLIE_WEBHOOK_REQUIRE_SIGNATURE', 'true');
    vi.stubEnv('MOLLIE_WEBHOOK_SECRET', 'test-secret');
    expect((await POST(request())).status).toBe(401);
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it.each(['invalid', '00'.repeat(32), '00'.repeat(32) + 'junk'])('rejects invalid signature %s', async signature => {
    vi.stubEnv('MOLLIE_WEBHOOK_SECRET', 'test-secret');
    expect((await POST(request(undefined, { 'mollie-signature': signature }))).status).toBe(401);
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it('accepts a valid configured signature', async () => {
    vi.stubEnv('MOLLIE_WEBHOOK_SECRET', 'test-secret');
    const signature = createHmac('sha256', 'test-secret').update('id=tr_payment1').digest('hex');
    expect((await POST(request(undefined, { 'x-mollie-signature': signature }))).status).toBe(200);
  });
});
