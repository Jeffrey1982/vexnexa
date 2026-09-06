// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePWA } from './usePWA';

function Probe({ enabled }: { enabled: boolean }) {
  usePWA(enabled);
  return null;
}

describe('usePWA enabled lifecycle', () => {
  let root: Root;
  let container: HTMLDivElement;
  let registration: EventTarget & { update: ReturnType<typeof vi.fn>; scope: string; installing: null };
  let serviceWorker: EventTarget & { register: ReturnType<typeof vi.fn>; controller: ServiceWorker | null };
  let removeListener: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    registration = Object.assign(new EventTarget(), {
      update: vi.fn().mockResolvedValue(undefined), scope: '/', installing: null,
    });
    serviceWorker = Object.assign(new EventTarget(), {
      register: vi.fn().mockResolvedValue(registration), controller: null,
    });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    removeListener = vi.spyOn(serviceWorker, 'removeEventListener');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    Reflect.deleteProperty(navigator, 'serviceWorker');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not register or update a service worker while disabled', async () => {
    await act(async () => root.render(<Probe enabled={false} />));
    expect(serviceWorker.register).not.toHaveBeenCalled();
    expect(registration.update).not.toHaveBeenCalled();
  });

  it('registers when entering the app and removes reload listeners when leaving', async () => {
    await act(async () => root.render(<Probe enabled={false} />));
    await act(async () => root.render(<Probe enabled />));
    expect(serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(registration.update).toHaveBeenCalledTimes(1);

    await act(async () => root.render(<Probe enabled={false} />));
    expect(removeListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
    expect(serviceWorker.register).toHaveBeenCalledTimes(1);
  });

  it('does not attach app update behavior when registration completes after leaving', async () => {
    let finish: (value: unknown) => void = () => undefined;
    serviceWorker.register.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const addListener = vi.spyOn(serviceWorker, 'addEventListener');
    await act(async () => root.render(<Probe enabled />));
    await act(async () => root.render(<Probe enabled={false} />));
    await act(async () => finish(registration));
    expect(registration.update).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalledWith('controllerchange', expect.any(Function));
  });

  it('does not reload or interrupt form state when the first worker claims the app', async () => {
    await act(async () => root.render(<Probe enabled />));
    const reload = vi.fn();
    const actualWindow = window;
    serviceWorker.controller = {} as ServiceWorker;

    // JSDOM's real location.reload is non-configurable; replace only the global
    // window during synchronous event dispatch, then restore it before React work.
    vi.stubGlobal('window', { location: { reload } });
    try {
      serviceWorker.dispatchEvent(new Event('controllerchange'));
    } finally {
      vi.stubGlobal('window', actualWindow);
    }
    expect(reload).not.toHaveBeenCalled();
  });

  it('still reloads once when an already-controlled app page receives a worker update', async () => {
    serviceWorker.controller = {} as ServiceWorker;
    await act(async () => root.render(<Probe enabled />));
    const reload = vi.fn();
    const actualWindow = window;

    vi.stubGlobal('window', { location: { reload } });
    try {
      serviceWorker.dispatchEvent(new Event('controllerchange'));
      serviceWorker.dispatchEvent(new Event('controllerchange'));
    } finally {
      vi.stubGlobal('window', actualWindow);
    }
    expect(reload).toHaveBeenCalledOnce();
  });
});
