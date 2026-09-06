// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MarketingLink from './MarketingLink';

const { capture } = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick, ref, ...props }: {
    href: string | { pathname?: string }, children: React.ReactNode,
    className?: string, onClick?: React.MouseEventHandler<HTMLAnchorElement>,
    ref?: React.Ref<HTMLAnchorElement>,
  }) => {
    capture({ href, ...props });
    return <a href={typeof href === 'string' ? href : href.pathname} className={className} onClick={onClick} ref={ref}>{children}</a>;
  },
}));

describe('MarketingLink', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('uses the active language while forwarding refs, interaction, and Next link options', () => {
    const ref = createRef<HTMLAnchorElement>();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    act(() => root.render(
      <NextIntlClientProvider locale="nl" messages={{}}>
        <MarketingLink href="/pricing#plans" ref={ref} className="existing-style" onClick={onClick} prefetch={false} scroll={false}>Pricing</MarketingLink>
      </NextIntlClientProvider>
    ));
    const link = container.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/nl/pricing#plans');
    expect(link.className).toBe('existing-style');
    expect(ref.current).toBe(link);
    expect(capture).toHaveBeenLastCalledWith(expect.objectContaining({ prefetch: false, scroll: false }));
    act(() => link.click());
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('preserves query and hash fields in URL objects', () => {
    act(() => root.render(
      <NextIntlClientProvider locale="de" messages={{}}>
        <MarketingLink href={{ pathname: '/free-scan', query: { url: 'https://example.com' }, hash: 'results' }}>Scan</MarketingLink>
      </NextIntlClientProvider>
    ));
    expect(capture).toHaveBeenLastCalledWith(expect.objectContaining({
      href: { pathname: '/de/free-scan', query: { url: 'https://example.com' }, hash: 'results' },
    }));
  });

  it('does not change an external URL object', () => {
    const href = { protocol: 'https:', hostname: 'example.com', pathname: '/pricing' };
    act(() => root.render(
      <NextIntlClientProvider locale="nl" messages={{}}><MarketingLink href={href}>External</MarketingLink></NextIntlClientProvider>
    ));
    expect(capture).toHaveBeenLastCalledWith(expect.objectContaining({ href }));
  });
});
