import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queueSupabase, type QueryResult } from './__tests__/supabase-mock';
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: mocks.from, rpc: mocks.rpc } }));
vi.mock('@/lib/email', () => ({ sendLeadNurtureEmail: mocks.send }));
import { runLeadNurtureBatch, unsubscribeLeadNurture } from './nurture-service';
import { hashConsentToken } from './consent-tokens';

const consent = { id: 'consent-1', workspace_id: 'workspace-a', organization_id: 'org-a', contact_id: 'contact-a',
  occurred_at: '2026-09-01T00:00:00.000Z', evidence: { locale: 'nl' } };
function batchResults(): QueryResult[] {
  return [{}, { data: [consent] }, { data: { id: 'contact-a', email: 'recipient@example.com' } },
    { data: { id: 'lead-a', status: 'opted_in' } }, { data: { normalized_domain: 'example.com' } },
    { data: { accessibility_score: 72, critical_issues: 1, serious_issues: 2, moderate_issues: 3, minor_issues: 4 } },
    { data: [] }, { data: { id: 'delivery-a' } }, {}, {}, {}, {}];
}
function batch(overrides: Record<number, QueryResult> = {}) {
  const results = batchResults();
  for (const [index, result] of Object.entries(overrides)) results[Number(index)] = result;
  return queueSupabase(mocks.from, results);
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  mocks.send.mockResolvedValue({ data: { id: 'provider-message' }, error: null });
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z'));
  vi.stubEnv('CRON_SECRET', 'unit-test-secret');
  vi.stubEnv('CRON_TOKEN', 'unit-test-fallback');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('nurture batch consent and delivery safety', () => {
  it('sends only after current server-side eligibility, with tenant-scoped evidence and idempotency', async () => {
    const calls = batch();
    expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'sent', step: 1 }]);
    expect(calls[1].query.eq).toHaveBeenCalledWith('consent_type', 'commercial_outreach');
    expect(calls[1].query.eq).toHaveBeenCalledWith('status', 'active');
    expect(calls[1].query.not).toHaveBeenCalledWith('contact_id', 'is', null);
    for (const index of [3, 5, 6]) expect(calls[index].query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
    expect(mocks.rpc).toHaveBeenCalledWith('can_send_commercial_email', {
      target_workspace_id: 'workspace-a', target_lead_id: 'lead-a', target_contact_id: 'contact-a',
    });
    const token = createHmac('sha256', 'unit-test-secret').update('lead-nurture:delivery-a').digest('base64url');
    expect(calls[8].query.update).toHaveBeenCalledWith(expect.objectContaining({ unsubscribe_token_hash: hashConsentToken(token) }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'recipient@example.com', idempotencyKey: 'lead-nurture/delivery-a',
      unsubscribeUrl: `https://app.example.com/api/lead-intelligence/unsubscribe?token=${token}`,
      body: expect.stringContaining('72/100 met 10 gevonden problemen') }));
    expect(calls[9].query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent', provider_message_id: 'provider-message' }));
    expect(calls[10].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', lead_id: 'lead-a' }));
    expect(calls[11].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', entity_id: 'lead-a' }));
  });
  it('recovers only stale reservations before looking for active consents', async () => {
    const calls = batch({ 1: { data: null } });
    expect(await runLeadNurtureBatch({ limit: 7 })).toEqual([]);
    expect(calls[0].query.eq).toHaveBeenCalledWith('status', 'reserved');
    expect(calls[0].query.lt).toHaveBeenCalledWith('reserved_at', '2026-09-10T11:30:00.000Z');
    expect(calls[1].query.limit).toHaveBeenCalledWith(21);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('honors the requested batch limit', async () => {
    batch({ 1: { data: [consent, { ...consent, contact_id: 'second-contact' }] } });
    expect(await runLeadNurtureBatch({ limit: 1 })).toHaveLength(1);
    expect(mocks.send).toHaveBeenCalledOnce();
  });
  it('propagates a consent query failure without sending', async () => {
    batch({ 1: { error: new Error('consent lookup failed') } });
    await expect(runLeadNurtureBatch()).rejects.toThrow('consent lookup failed');
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([2, 3, 4, 5, 6])('does not send after lookup %s fails', async (index) => {
    batch({ [index]: { error: new Error('lookup unavailable') } });
    expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'lookup_failed' }]);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([2, 3, 4])('does not send when required lookup %s is missing', async (index) => {
    batch({ [index]: { data: null } });
    expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'lookup_failed' }]);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('never repeats completed sequence steps', async () => {
    const calls = batch({ 6: { data: [1, 2, 3].map((sequence_step) => ({ sequence_step, status: 'sent' })) } });
    expect(await runLeadNurtureBatch()).toEqual([]);
    expect(calls).toHaveLength(7);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([{ data: false }, { data: null }, { data: 'true' }, { data: true, error: new Error('eligibility unavailable') }])(
    'fails closed on missing consent, suppression, or unreliable eligibility', async (result) => {
      const calls = batch();
      mocks.rpc.mockResolvedValue(result);
      expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'blocked', step: 1 }]);
      expect(calls).toHaveLength(7);
      expect(mocks.send).not.toHaveBeenCalled();
    });
  it('sends no invented score when no completed scan exists and defaults locale safely', async () => {
    batch({ 1: { data: [{ ...consent, evidence: null }] }, 5: { data: null } });
    await runLeadNurtureBatch();
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Your example.com scan: the first priority' }));
    expect(mocks.send.mock.calls[0][0].body).not.toContain('/100');
  });
  it('can retry only a previously failed reservation, keeping the same delivery idempotency key', async () => {
    const results = batchResults();
    results.splice(7, 1, { error: { code: '23505' } }, { data: { id: 'delivery-a' } });
    const calls = queueSupabase(mocks.from, results);
    expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'sent', step: 1 }]);
    expect(calls[8].query.eq.mock.calls).toEqual([['workspace_id', 'workspace-a'], ['contact_id', 'contact-a'], ['sequence_step', 1], ['status', 'failed']]);
    expect(mocks.send.mock.calls[0][0].idempotencyKey).toBe('lead-nurture/delivery-a');
  });
  it.each([{ error: new Error('insert failed') }, { data: null }])('does not send without a successful reservation', async (result) => {
    batch({ 7: result });
    expect(await runLeadNurtureBatch()).toEqual([]);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('does not duplicate a delivery already reserved by another worker', async () => {
    const results = batchResults();
    results.splice(7, 1, { error: { code: '23505' } }, { data: null });
    queueSupabase(mocks.from, results);
    expect(await runLeadNurtureBatch()).toEqual([]);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('refuses to send if the unsubscribe token cannot be stored', async () => {
    batch({ 8: { error: new Error('token write failed') } });
    expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'reservation_failed', step: 1 }]);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('refuses to send without an unsubscribe signing secret', async () => {
    batch();
    vi.stubEnv('CRON_SECRET', undefined);
    vi.stubEnv('CRON_TOKEN', undefined);
    await expect(runLeadNurtureBatch()).rejects.toThrow('Cron secret is required');
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('supports the existing fallback secret and app URL', async () => {
    batch({ 5: { data: {} } });
    vi.stubEnv('CRON_SECRET', undefined);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    await runLeadNurtureBatch();
    expect(mocks.send.mock.calls[0][0].unsubscribeUrl).toMatch(/^https:\/\/vexnexa.com\//);
  });
  it.each(['provider', 'throw', 'sent-state'])('records failures for %s errors without reporting success', async (kind) => {
    const calls = batch(kind === 'sent-state' ? { 9: { error: new Error('sent-state failed') } } : {});
    if (kind === 'provider') mocks.send.mockResolvedValue({ error: { message: 'x'.repeat(600) } });
    if (kind === 'throw') mocks.send.mockRejectedValue('non-Error failure');
    expect(await runLeadNurtureBatch()).toEqual([{ contactId: 'contact-a', status: 'failed', step: 1 }]);
    const failure = calls.at(-1)!.query.update.mock.calls[0][0];
    expect(failure.status).toBe('failed');
    expect(failure.error_message.length).toBeLessThanOrEqual(500);
  });
});

describe('one-click unsubscribe persistence', () => {
  const delivery = { workspace_id: 'workspace-a', organization_id: 'org-a', lead_id: 'lead-a', contact_id: 'contact-a' };
  function unsubscribeResults(): QueryResult[] { return [{ data: delivery }, { data: { email: 'recipient@example.com' } }, {}, {}, {}, {}, {}]; }
  it('stores suppression, withdrawal, cancelled pending deliveries and an audit within the delivery tenant', async () => {
    const calls = queueSupabase(mocks.from, unsubscribeResults());
    expect(await unsubscribeLeadNurture('opaque-token')).toBe(true);
    expect(calls[0].query.eq).toHaveBeenCalledWith('unsubscribe_token_hash', hashConsentToken('opaque-token'));
    expect(calls[2].query.upsert).toHaveBeenCalledWith({ workspace_id: 'workspace-a', normalized_email: 'recipient@example.com',
      reason: 'unsubscribe', source: 'lead_nurture_unsubscribe' }, { onConflict: 'workspace_id,normalized_email' });
    expect(calls[3].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', contact_id: 'contact-a',
      status: 'withdrawn', consent_type: 'commercial_outreach' }));
    expect(calls[4].query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'unsubscribed' }));
    expect(calls[5].query.eq.mock.calls).toEqual([['workspace_id', 'workspace-a'], ['contact_id', 'contact-a']]);
    expect(calls[5].query.in).toHaveBeenCalledWith('status', ['reserved', 'failed']);
    expect(calls[6].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', event_type: 'lead_unsubscribed' }));
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('invalid tokens return false and cannot mutate suppression state', async () => {
    const calls = queueSupabase(mocks.from, [{ data: null }]);
    expect(await unsubscribeLeadNurture('unknown-token')).toBe(false);
    expect(calls).toHaveLength(1);
  });
  it.each([0, 1])('propagates lookup failure %s without acknowledging unsubscribe', async (index) => {
    const results = unsubscribeResults();
    results[index] = { error: new Error('lookup failed') };
    const calls = queueSupabase(mocks.from, results);
    await expect(unsubscribeLeadNurture('token')).rejects.toThrow('lookup failed');
    expect(calls).toHaveLength(index + 1);
  });
  it.each([2, 3, 4, 5, 6])('does not falsely acknowledge failed persistence operation %s', async (index) => {
    const results = unsubscribeResults();
    results[index] = { error: new Error('persistence failed') };
    const calls = queueSupabase(mocks.from, results);
    await expect(unsubscribeLeadNurture('token')).rejects.toThrow('persistence failed');
    // All blocking writes are attempted even if an individual result fails.
    expect(calls).toHaveLength(7);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
