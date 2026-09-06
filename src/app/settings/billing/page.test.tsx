// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../../messages/en.json';
const auth = vi.hoisted(() => ({ auth: { getUser: vi.fn() } }));
vi.mock('@/lib/supabase/client-new', () => ({ createClient: () => auth }));
vi.mock('@/components/billing/ExtraSeatsCard', () => ({ ExtraSeatsCard: () => null }));
vi.mock('@/components/billing/WebsiteCapacityCard', () => ({ WebsiteCapacityCard: () => null }));
import BillingPage from './page';

const future = new Date(Date.now() + 20 * 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();
let root: Root;
let container: HTMLDivElement;
function billing(user = {}) {
  return { user: { id: 'u1', email: 'test@example.test', plan: 'PRO', subscriptionStatus: 'active', subscriptionCurrentPeriodEnd: future, subscriptionCanceledAt: null, ...user }, usage: null, entitlements: null, addOns: [], actualUsage: null };
}
async function show(data = billing(), cancelStatus = 200) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/api/billing') return { ok: true, json: async () => data };
    if (url === '/api/billing/cancel') return { ok: cancelStatus === 200, json: async () => ({ error: 'Failed to cancel subscription' }) };
    return { ok: true, json: async () => ({ hasSubscription: false }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  await act(async () => root.render(<NextIntlClientProvider locale="en" timeZone="UTC" messages={messages}><BillingPage /></NextIntlClientProvider>));
  return fetchMock;
}
const button = (name: string) => [...document.querySelectorAll('button')].find(element => element.textContent?.trim() === name);

describe('paid-period cancellation display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  it('shows a known paid-through date without inventing a next invoice', async () => {
    await show();
    expect(container.textContent).toContain('Paid through');
    expect(container.textContent).not.toContain('Next invoice');
    expect(container.textContent).toContain(messages.billingRenewal.cancelDescription);
  });
  it('keeps stopped renewal separate from current paid access and removes cancellation action', async () => {
    await show(billing({ subscriptionCanceledAt: past }));
    expect(container.textContent).toContain(messages.billingRenewal.stoppedTitle);
    expect(container.textContent).toContain('No further subscription renewals are scheduled');
    expect(button('Cancel Subscription')).toBeUndefined();
    expect(container.querySelector('a[href="/pricing#agency"]')).toBeTruthy();
  });
  it('does not claim active paid access after a canceled term ends', async () => {
    await show(billing({ subscriptionCanceledAt: past, subscriptionCurrentPeriodEnd: past }));
    expect(container.textContent).toContain(messages.billingRenewal.stoppedExpired);
    expect([...container.querySelectorAll('.capitalize')].map(element => element.textContent)).toContain('canceled');
    expect([...container.querySelectorAll('.capitalize')].map(element => element.textContent)).not.toContain('active');
  });
  it('restores the cancel action after a server error without claiming success', async () => {
    const fetchMock = await show(billing(), 500);
    await act(async () => button('Cancel Subscription')!.click());
    const confirm = button('Yes, cancel subscription')!;
    expect(confirm).toBeTruthy();
    await act(async () => confirm.click());
    expect(fetchMock).toHaveBeenCalledWith('/api/billing/cancel', { method: 'POST' });
    expect(confirm.disabled).toBe(false);
    expect(container.textContent).not.toContain(messages.billingRenewal.canceledSuccess);
  });
  it('does not label a known expired active period as active', async () => {
    await show(billing({ subscriptionCurrentPeriodEnd: past }));
    expect([...container.querySelectorAll('.capitalize')].map(element => element.textContent)).toContain('expired');
  });
});
