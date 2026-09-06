import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const createClient = vi.hoisted(() => vi.fn());
vi.mock('@mollie/api-client', () => ({ createMollieClient: createClient }));

describe('Mollie deployment isolation', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.stubEnv('VERCEL_ENV', 'production'); createClient.mockReturnValue({ payments: {} }); });
  afterEach(() => vi.unstubAllEnvs());
  it.each(['live_example_not_a_real_key', 'organization_example'])('blocks non-test credentials in preview without contacting Mollie', async key => {
    vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('MOLLIE_API_KEY', key);
    const { getMollieClient } = await import('./mollie');
    expect(() => getMollieClient()).toThrow('test-mode API key');
    expect(createClient).not.toHaveBeenCalled();
  });
  it('allows test credentials in preview and trims accidental whitespace', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('MOLLIE_API_KEY', ' test_example_not_a_real_key\r\n');
    const { getMollieClient } = await import('./mollie');
    getMollieClient();
    expect(createClient).toHaveBeenCalledWith({ apiKey: 'test_example_not_a_real_key' });
  });
  it('preserves configured production mode and reuses the client', async () => {
    vi.stubEnv('MOLLIE_API_KEY', 'live_example_not_a_real_key');
    const { getMollieClient } = await import('./mollie');
    expect(getMollieClient()).toBe(getMollieClient());
    expect(createClient).toHaveBeenCalledOnce();
  });
  it('rejects missing credentials before constructing a provider client', async () => {
    vi.stubEnv('MOLLIE_API_KEY', '');
    const { getMollieClient } = await import('./mollie');
    expect(() => getMollieClient()).toThrow('required');
    expect(createClient).not.toHaveBeenCalled();
  });
});
