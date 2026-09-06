import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('dns', () => ({ promises: { lookup: mocks.lookup } }));
import { assertPublicHttpUrl, isPrivateIP } from './ssrf-guard';

beforeEach(() => {
  mocks.lookup.mockReset();
  vi.stubEnv('SSRF_GUARD_FORCE', '1');
  vi.stubEnv('SSRF_GUARD_SKIP_DNS', '0');
});
afterEach(() => vi.unstubAllEnvs());

describe('private address classification', () => {
  it.each(['0.1.2.3', '10.1.2.3', '127.2.3.4', '169.254.169.254', '172.16.0.1', '172.31.255.255',
    '192.0.0.1', '192.168.1.1', '100.64.0.1', '100.127.255.255', '224.0.0.1', '255.255.255.255',
    '::', '::1', '0:0:0:0:0:0:0:1', 'fe80::1', 'fe90::1', 'febf::1', 'fe80::1%eth0',
    'fc00::1', 'fd12::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '0:0:0:0:0:ffff:a00:1',
    '::ffff:c0a8:101'])('blocks private/reserved %s', (ip) => {
    expect(isPrivateIP(ip)).toBe(true);
  });
  it.each(['8.8.8.8', '93.184.216.34', '172.15.255.255', '172.32.0.0', '100.63.255.255',
    '100.128.0.0', '192.1.1.1', '2001:4860:4860::8888', '2001:4860:4860:0:0:0:0:8888',
    '::ffff:8.8.8.8', '::ffff:808:808', 'not-an-ip'])('does not classify %s as private', (ip) => {
    expect(isPrivateIP(ip)).toBe(false);
  });
});

describe('outbound URL validation', () => {
  it.each([null, undefined, 42, {}, '', '  '])('rejects missing or non-string input %j', async (input) => {
    expect(await assertPublicHttpUrl(input)).toEqual({ ok: false, error: 'URL is required' });
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it.each([
    ['not a URL', 'Invalid URL'],
    ['ftp://example.com', 'Only http and https'],
    ['http://example.com:6379', 'Only standard web ports'],
    ['https://user:password@example.com', 'credentials'],
    ['http://localhost', 'Internal or private'],
    ['http://[::1]', 'Internal or private'],
    ['https://private.local', 'Internal or reserved'],
    ['https://metadata.internal', 'Internal or reserved'],
    ['https://device.lan', 'Internal or reserved'],
    ['https://host.test', 'Internal or reserved'],
    ['http://10.0.0.1', 'Internal or private'],
    ['http://169.254.169.254', 'Internal or private'],
    ['http://[::ffff:127.0.0.1]', 'Internal or private'],
    ['http://[::ffff:7f00:1]', 'Internal or private'],
    ['http://[0:0:0:0:0:ffff:a00:1]', 'Internal or private'],
    ['http://[febf::1]', 'Internal or private'],
  ])('rejects %s before DNS', async (input, message) => {
    expect(await assertPublicHttpUrl(input)).toEqual({ ok: false, error: expect.stringContaining(message) });
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it.each(['https://8.8.8.8', 'https://[2001:4860:4860::8888]', 'https://[::ffff:8.8.8.8]'])('accepts public literal %s without DNS', async (input) => {
    expect(await assertPublicHttpUrl(input)).toEqual({ ok: true, url: new URL(input) });
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it('requires all resolved addresses to be public, not only the first DNS result', async () => {
    mocks.lookup.mockResolvedValue([{ address: '93.184.216.34' }, { address: '127.0.0.1' }]);
    expect(await assertPublicHttpUrl('https://mixed.example.com')).toEqual({ ok: false, error: 'Hostname resolves to a private network address' });
    expect(mocks.lookup).toHaveBeenCalledWith('mixed.example.com', { all: true, verbatim: true });
  });
  it('accepts a resolved public hostname and preserves path/query', async () => {
    mocks.lookup.mockResolvedValue([{ address: '93.184.216.34' }, { address: '2001:4860:4860::8888' }]);
    expect(await assertPublicHttpUrl('  https://EXAMPLE.com/report?q=1  ')).toEqual({ ok: true, url: new URL('https://example.com/report?q=1') });
  });
  it.each(['empty', 'error'])('fails closed for %s DNS results', async (kind) => {
    if (kind === 'empty') mocks.lookup.mockResolvedValue([]);
    else mocks.lookup.mockRejectedValue(new Error('DNS unavailable'));
    expect(await assertPublicHttpUrl('https://example.com')).toEqual({ ok: false, error: 'Hostname could not be resolved' });
  });
  it('supports test-only DNS bypass but keeps string/IP restrictions active', async () => {
    vi.stubEnv('SSRF_GUARD_FORCE', '0');
    vi.stubEnv('NODE_ENV', 'test');
    expect((await assertPublicHttpUrl('https://example.com')).ok).toBe(true);
    expect((await assertPublicHttpUrl('http://127.0.0.1')).ok).toBe(false);
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it('force overrides an explicit DNS skip flag', async () => {
    vi.stubEnv('SSRF_GUARD_SKIP_DNS', '1');
    mocks.lookup.mockResolvedValue([{ address: '10.0.0.1' }]);
    expect((await assertPublicHttpUrl('https://example.com')).ok).toBe(false);
    expect(mocks.lookup).toHaveBeenCalledOnce();
  });
});
