import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(),
  update: vi.fn(), remove: vi.fn(), fetch: vi.fn(), lookup: vi.fn() }));
vi.mock('@/lib/supabase/server-new', () => ({ createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })) }));
vi.mock('@/lib/prisma', () => ({ prisma: { webhookEndpoint: { create: mocks.create, findMany: mocks.findMany,
  count: mocks.count, findUnique: mocks.findUnique, update: mocks.update, delete: mocks.remove } } }));
vi.mock('dns', () => ({ promises: { lookup: mocks.lookup } }));
import { GET, POST } from './route';
import { DELETE, PUT } from './[id]/route';
import { POST as testWebhook } from './[id]/test/route';

const webhook = { id: 'webhook-a', userId: 'user-a', name: 'Agency updates', url: 'https://hooks.example.com/events',
  secret: 'unit-test-secret', events: ['SCAN_COMPLETED'], active: true };
const context = () => ({ params: Promise.resolve({ id: 'webhook-a' }) });
function request(method = 'GET', body?: unknown, url = 'https://app.example.com/api/webhooks') {
  return new NextRequest(url, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }) });
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
  mocks.findUnique.mockResolvedValue(webhook);
  mocks.create.mockResolvedValue(webhook);
  mocks.update.mockResolvedValue(webhook);
  mocks.remove.mockResolvedValue(webhook);
  mocks.findMany.mockResolvedValue([webhook]);
  mocks.count.mockResolvedValue(1);
  mocks.lookup.mockResolvedValue([{ address: '93.184.216.34' }]);
  mocks.fetch.mockResolvedValue(new Response('OK', { status: 200, statusText: 'OK' }));
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('SSRF_GUARD_FORCE', '1');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('webhook authentication and ownership', () => {
  const handlers = [
    ['create', () => POST(request('POST', webhook))], ['list', () => GET(request())],
    ['update', () => PUT(request('PUT', { name: 'Changed' }), context())],
    ['delete', () => DELETE(request('DELETE'), context())], ['test', () => testWebhook(request('POST'), context())],
  ] as const;
  it.each(handlers)('requires authentication for %s', async (_name, call) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await call()).status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it.each(handlers)('rejects an invalid session for %s', async (_name, call) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: new Error('expired') });
    expect((await call()).status).toBe(401);
  });
  it.each(handlers.slice(2))('does not mutate or dispatch another user webhook via %s', async (_name, call) => {
    mocks.findUnique.mockResolvedValue({ ...webhook, userId: 'other-user' });
    expect((await call()).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it.each(handlers.slice(2))('returns 404 for missing webhook on %s', async (_name, call) => {
    mocks.findUnique.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it.each(handlers.slice(2))('returns a generic failure when ownership lookup fails on %s', async (_name, call) => {
    mocks.findUnique.mockRejectedValue(new Error('private database details'));
    const response = await call();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private database details');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

describe('webhook creation, listing and management', () => {
  it('uses authenticated ownership and a freshly generated secret, ignoring injected ownership/secret fields', async () => {
    const response = await POST(request('POST', { name: 'Events', url: webhook.url, events: ['SCAN_COMPLETED'], userId: 'attacker', secret: 'injected' }));
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({ data: { userId: 'user-a', name: 'Events', url: webhook.url, events: ['SCAN_COMPLETED'], secret: expect.stringMatching(/^[a-f0-9]{64}$/) } });
    expect((await response.json()).data.id).toBe('webhook-a');
  });
  it.each([{ name: '', url: webhook.url, events: ['SCAN_COMPLETED'] }, { name: 'A', url: 'not-a-url', events: ['SCAN_COMPLETED'] },
    { name: 'A', url: webhook.url, events: [] }, { name: 'A', url: webhook.url, events: ['UNSUPPORTED'] }])('validates creation input %j before writing', async (body) => {
    expect((await POST(request('POST', body))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('returns a controlled error if creation fails', async () => {
    mocks.create.mockRejectedValue(new Error('insert failed'));
    expect((await POST(request('POST', { name: 'A', url: webhook.url, events: ['SCAN_COMPLETED'] }))).status).toBe(500);
  });
  it('lists and counts only the current user webhooks with default pagination', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith({ where: { userId: 'user-a' }, orderBy: { createdAt: 'desc' }, skip: 0, take: 20 });
    expect(mocks.count).toHaveBeenCalledWith({ where: { userId: 'user-a' } });
    expect((await response.json()).data.pagination).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
  });
  it('applies active and pagination filters identically to user-scoped list and count', async () => {
    mocks.count.mockResolvedValue(11);
    const response = await GET(request('GET', undefined, 'https://app.example.com/api/webhooks?page=2&limit=5&active=true'));
    expect(mocks.findMany).toHaveBeenCalledWith({ where: { userId: 'user-a', active: true }, orderBy: { createdAt: 'desc' }, skip: 5, take: 5 });
    expect(mocks.count).toHaveBeenCalledWith({ where: { userId: 'user-a', active: true } });
    expect((await response.json()).data.pagination.pages).toBe(3);
  });
  it('returns a controlled error if list or count lookup fails', async () => {
    mocks.count.mockRejectedValue(new Error('count failed'));
    expect((await GET(request())).status).toBe(500);
  });
  it('updates only allowed webhook configuration fields after ownership verification', async () => {
    const response = await PUT(request('PUT', { name: 'Changed', active: false, url: 'https://hooks.example.com/new', events: ['SCAN_FAILED'],
      userId: 'attacker', secret: 'injected' }), context());
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'webhook-a' }, data: { name: 'Changed', active: false,
      url: 'https://hooks.example.com/new', events: ['SCAN_FAILED'] } });
  });
  it.each([{ name: '' }, { url: 'invalid' }, { events: [] }, { events: ['UNKNOWN'] }, { active: 'true' }])('rejects invalid update %j', async (body) => {
    expect((await PUT(request('PUT', body), context())).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('propagates update failure as an API error', async () => {
    mocks.update.mockRejectedValue(new Error('update failed'));
    expect((await PUT(request('PUT', { active: false }), context())).status).toBe(500);
  });
  it('deletes only the owned webhook and handles persistence failures', async () => {
    expect((await DELETE(request('DELETE'), context())).status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith({ where: { id: 'webhook-a' } });
    mocks.remove.mockRejectedValue(new Error('delete failed'));
    expect((await DELETE(request('DELETE'), context())).status).toBe(500);
  });
});

describe('webhook test dispatch SSRF boundary', () => {
  it.each(['http://localhost', 'http://10.0.0.1', 'http://169.254.169.254', 'http://[::ffff:127.0.0.1]',
    'http://[::ffff:7f00:1]', 'http://[febf::1]', 'https://metadata.internal', 'https://user:pass@example.com',
    'https://example.com:6379', 'file:///etc/passwd', 'ftp://example.com'])('rejects unsafe stored target %s without dispatch or statistics changes', async (url) => {
    mocks.findUnique.mockResolvedValue({ ...webhook, url });
    expect((await testWebhook(request('POST'), context())).status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('checks DNS at dispatch time and blocks mixed public/private answers before sending', async () => {
    mocks.lookup.mockResolvedValue([{ address: '93.184.216.34' }, { address: '10.0.0.1' }]);
    expect((await testWebhook(request('POST'), context())).status).toBe(400);
    expect(mocks.lookup).toHaveBeenCalledWith('hooks.example.com', { all: true, verbatim: true });
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('fails closed when target DNS cannot be resolved', async () => {
    mocks.lookup.mockRejectedValue(new Error('DNS unavailable'));
    expect((await testWebhook(request('POST'), context())).status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('signs a validated public request with redirects disabled and a bounded timeout', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const response = await testWebhook(request('POST'), context());
    expect(response.status).toBe(200);
    const [url, options] = mocks.fetch.mock.calls[0];
    expect(url).toBe(webhook.url);
    expect(options).toMatchObject({ method: 'POST', redirect: 'error', signal: expect.any(AbortSignal),
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'VexNexa-Webhook/1.0' } });
    expect(timeout).toHaveBeenCalledWith(10_000);
    const payload = JSON.parse(options.body);
    expect(payload).toEqual({ event: 'TEST', timestamp: '2026-09-10T12:00:00.000Z', data: { message: 'This is a test webhook from VexNexa',
      webhookId: 'webhook-a', webhookName: 'Agency updates' } });
    expect(options.headers['X-Webhook-Signature']).toBe(createHmac('sha256', webhook.secret).update(options.body).digest('hex'));
    expect(mocks.lookup.mock.invocationCallOrder[0]).toBeLessThan(mocks.fetch.mock.invocationCallOrder[0]);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'webhook-a' }, data: { lastTriggered: expect.any(Date), successCount: { increment: 1 } } });
    expect((await response.json()).data).toMatchObject({ success: true, statusCode: 200 });
  });
  it('records an endpoint HTTP error as a failed test, not successful delivery', async () => {
    mocks.fetch.mockResolvedValue(new Response('Unavailable', { status: 503, statusText: 'Unavailable' }));
    const response = await testWebhook(request('POST'), context());
    expect((await response.json()).data).toMatchObject({ success: false, statusCode: 503 });
    expect(mocks.update.mock.calls[0][0].data.failureCount).toEqual({ increment: 1 });
  });
  it.each(['redirect disallowed', 'request timed out', 'network unavailable'])('does not retry unsafe/failed dispatch: %s', async (message) => {
    mocks.fetch.mockRejectedValue(new Error(message));
    const response = await testWebhook(request('POST'), context());
    expect((await response.json()).data).toMatchObject({ success: false, error: message });
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.fetch.mock.calls[0][1].redirect).toBe('error');
    expect(mocks.update.mock.calls[0][0].data.failureCount).toEqual({ increment: 1 });
  });
});
