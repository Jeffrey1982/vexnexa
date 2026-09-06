// @vitest-environment jsdom

import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientLayout from './ClientLayout';
import { useWhiteLabel } from '@/lib/white-label/context';

const { navigation, usePWAMock } = vi.hoisted(() => ({
  navigation: { pathname: '/' },
  usePWAMock: vi.fn(() => ({ isSupported: false, isRegistered: false, error: null })),
}));

vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));
vi.mock('@/hooks/usePWA', () => ({ usePWA: usePWAMock }));
vi.mock('@/components/SkipToContent', () => ({ SkipToContent: () => null }));
vi.mock('@/components/pwa/OfflineIndicator', () => ({ OfflineIndicator: () => null }));

const whiteLabel = {
  companyName: 'Example Agency',
  primaryColor: '#ab4521',
  secondaryColor: '#243b45',
  accentColor: '#ece2cd',
  faviconUrl: '/agency-favicon.svg',
  showPoweredBy: true,
};

function Probe() {
  const [count, setCount] = useState(0);
  const { settings, isLoading, refresh } = useWhiteLabel();
  return (
    <>
      <button id="count" onClick={() => setCount((value) => value + 1)}>{count}</button>
      <button id="refresh" onClick={() => void refresh()}>Refresh</button>
      <output>{isLoading ? 'loading' : settings?.companyName ?? 'default'}</output>
    </>
  );
}

describe('ClientLayout application services', () => {
  let root: Root;
  let container: HTMLDivElement;
  let fetchMock: ReturnType<typeof vi.fn>;

  async function navigate(pathname: string) {
    navigation.pathname = pathname;
    await act(async () => root.render(<ClientLayout><Probe /></ClientLayout>));
  }

  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, hasAccess: true, whiteLabel }),
    });
    vi.stubGlobal('fetch', fetchMock);
    document.title = 'VexNexa';
    document.documentElement.removeAttribute('style');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(['/', '/nl', '/nl/pricing', '/de/for-agencies', '/auth/login'])(
    'does not fetch app settings or enable PWA on %s', async (pathname) => {
      await navigate(pathname);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(usePWAMock).toHaveBeenLastCalledWith(false);
      expect(container.querySelector('output')?.textContent).toBe('default');
      await act(async () => (container.querySelector('#refresh') as HTMLButtonElement).click());
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('enables app services across navigation without remounting children', async () => {
    await navigate('/nl');
    act(() => (container.querySelector('#count') as HTMLButtonElement).click());
    await navigate('/dashboard');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(usePWAMock).toHaveBeenLastCalledWith(true);
    expect(container.querySelector('#count')?.textContent).toBe('1');
    expect(container.querySelector('output')?.textContent).toBe('Example Agency');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#ab4521');

    await navigate('/sites/123/structure');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#count')?.textContent).toBe('1');

    await navigate('/fr/pricing');
    expect(usePWAMock).toHaveBeenLastCalledWith(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#count')?.textContent).toBe('1');
    expect(container.querySelector('output')?.textContent).toBe('default');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');
    expect(document.querySelector('link[href="/agency-favicon.svg"]')).toBeNull();
    expect(document.title).toBe('VexNexa');
  });

  it('aborts a pending settings request and ignores its late response after leaving the app', async () => {
    let finish: (value: unknown) => void = () => undefined;
    fetchMock.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await navigate('/dashboard');
    const options = fetchMock.mock.calls[0][1] as { signal: AbortSignal };
    await navigate('/de');
    expect(options.signal.aborted).toBe(true);

    await act(async () => finish({
      ok: true,
      json: async () => ({ success: true, hasAccess: true, whiteLabel }),
    }));
    expect(container.querySelector('output')?.textContent).toBe('default');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');
  });
});
