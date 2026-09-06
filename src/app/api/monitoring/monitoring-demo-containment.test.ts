import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireAuth: mocks.auth }));
let rules: typeof import('./alerts/rules/route');
let editRule: typeof import('./alerts/rules/[ruleId]/route');
let resolveAlert: typeof import('./alerts/[alertId]/resolve/route');
let testAlert: typeof import('./alerts/test/[ruleId]/route');
let editRegression: typeof import('./regressions/[regressionId]/route');
const request = (method: string, body?: unknown) => new NextRequest('https://app.example.com/api/monitoring/alerts', {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
});
const ruleContext = () => ({ params: Promise.resolve({ ruleId: 'default-critical' }) });
const alertContext = () => ({ params: Promise.resolve({ alertId: 'alert-a' }) });
const handlers = [
  ['list demo rules', () => rules.GET(request('GET'))],
  ['create demo rule', () => rules.POST(request('POST', { name: 'Private user configuration', recipients: { emails: ['private@example.com'] } }))],
  ['update demo rule', () => editRule.PATCH(request('PATCH', { enabled: false }), ruleContext())],
  ['delete demo rule', () => editRule.DELETE(request('DELETE'), ruleContext())],
  ['resolve demo alert', () => resolveAlert.POST(request('POST'), alertContext())],
  ['simulate demo notification', () => testAlert.POST(request('POST'), ruleContext())],
  ['acknowledge demo regression', () => editRegression.PATCH(request('PATCH', { status: 'resolved', notes: 'private note' }),
    { params: Promise.resolve({ regressionId: 'regression-a' }) })],
] as const;

beforeEach(async () => {
  vi.resetModules();
  mocks.auth.mockReset().mockResolvedValue({ id: 'user-a' });
  vi.stubEnv('NODE_ENV', 'production');
  for (const level of ['log', 'error'] as const) vi.spyOn(console, level).mockImplementation(() => {});
  rules = await import('./alerts/rules/route');
  editRule = await import('./alerts/rules/[ruleId]/route');
  resolveAlert = await import('./alerts/[alertId]/resolve/route');
  testAlert = await import('./alerts/test/[ruleId]/route');
  editRegression = await import('./regressions/[regressionId]/route');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('non-persistent monitoring demo containment', () => {
  it.each(handlers)('production cannot %s, expose shared user data, or acknowledge fake persistence', async (_name, invoke) => {
    const response = await invoke();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not Found' });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
  it('keeps explicit in-memory demo creation available in development only', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await rules.POST(request('POST', { name: 'Local demonstration', recipients: { emails: [] } }));
    const data = await (await rules.GET(request('GET'))).json();
    expect(data.rules.some((rule: any) => rule.name === 'Local demonstration')).toBe(true);
    vi.stubEnv('NODE_ENV', 'production');
    expect((await rules.GET(request('GET'))).status).toBe(404);
  });
  it('does not claim a nonexistent development rule was changed or deleted', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect((await editRule.PATCH(request('PATCH', { enabled: false }), ruleContext())).status).toBe(404);
    expect((await editRule.DELETE(request('DELETE'), ruleContext())).status).toBe(404);
  });
  it('retains the development-only demonstration response without making it a production contract', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect((await resolveAlert.POST(request('POST'), alertContext())).status).toBe(200);
    vi.stubEnv('NODE_ENV', 'production');
    expect((await resolveAlert.POST(request('POST'), alertContext())).status).toBe(404);
  });
  it.each([undefined, 'Local demonstration note'])('keeps regression acknowledgement demos available only outside production', async (notes) => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = await editRegression.PATCH(request('PATCH', { status: 'investigating', notes }), { params: Promise.resolve({ regressionId: 'regression-a' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).auditLog).toMatchObject({ regressionId: 'regression-a', userId: 'user-a', newStatus: 'investigating' });
    vi.stubEnv('NODE_ENV', 'production');
    expect((await editRegression.PATCH(request('PATCH', { status: 'resolved' }), { params: Promise.resolve({ regressionId: 'regression-a' }) })).status).toBe(404);
  });
  it.each(handlers)('auth failures in development cannot make %s succeed', async (_name, invoke) => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.auth.mockRejectedValue(new Error('Authentication required'));
    expect((await invoke()).status).toBeGreaterThanOrEqual(400);
  });
  it('does not expose internal errors through the development rule list', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.auth.mockRejectedValue(new Error('private internal details'));
    const response = await rules.GET(request('GET'));
    expect(response.status).toBe(500); expect(await response.text()).not.toContain('private internal details');
  });
  it.each([0, 1])('simulated notification outcomes remain behind the development gate (random=%s)', async (random) => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(random);
    const pending = testAlert.POST(request('POST'), ruleContext());
    await vi.runAllTimersAsync();
    const data = await (await pending).json();
    expect(data.testResults.inApp).toBe(true);
    expect(data.testResults.email).toBe(random === 1);
    expect(data.message).toContain(random === 1 ? 'all configured channels' : 'some failures');
    vi.stubEnv('NODE_ENV', 'production');
    expect((await testAlert.POST(request('POST'), ruleContext())).status).toBe(404);
  });
});
