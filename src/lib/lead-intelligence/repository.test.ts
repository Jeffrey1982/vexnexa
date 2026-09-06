import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queueSupabase, type QueryResult } from './__tests__/supabase-mock';
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: mocks.from } }));
import { confirmLeadConsentToken, createFreeScanConsentRequest, getAuditEvents, getFreeScanLeadCaptureDigestStats,
  getLeadCaptureStorageHealth, getLeadDetail, getLeadOverviewRows, getOrCreateLeadWorkspace, getSuppressionEntries,
  recordFreeScanLeadCapture } from './repository';
import { hashConsentToken } from './consent-tokens';

const now = '2026-09-10T12:00:00.000Z';
const actor = { id: 'user-a', email: 'user@example.com', company: 'Example Agency' };
beforeEach(() => { mocks.from.mockReset(); vi.useFakeTimers(); vi.setSystemTime(new Date(now)); vi.stubEnv('LEAD_CAPTURE_WORKSPACE_ID', ' workspace-a '); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('workspace lookup and tenant-scoped reads', () => {
  it('reuses the authenticated user membership without creating another workspace', async () => {
    const calls = queueSupabase(mocks.from, [{ data: { lead_workspaces: { id: 'workspace-a', name: 'Existing' } } }]);
    expect(await getOrCreateLeadWorkspace(actor)).toEqual({ id: 'workspace-a', name: 'Existing' });
    expect(calls[0].query.eq).toHaveBeenCalledWith('user_id', 'user-a');
    expect(calls).toHaveLength(1);
  });
  it.each(['Agency', null])('creates an owned workspace with company name %j', async (company) => {
    const name = company || 'VexNexa Lead Workspace';
    const calls = queueSupabase(mocks.from, [{}, { data: { id: 'workspace-a', name } }, {}]);
    expect(await getOrCreateLeadWorkspace({ ...actor, company })).toEqual({ id: 'workspace-a', name });
    expect(calls[1].query.insert).toHaveBeenCalledWith({ name, owner_user_id: 'user-a' });
    expect(calls[2].query.insert).toHaveBeenCalledWith({ workspace_id: 'workspace-a', user_id: 'user-a', role: 'owner' });
  });
  it.each([0, 1, 2])('propagates workspace persistence failure %s', async (index) => {
    const results: QueryResult[] = [{}, { data: { id: 'workspace-a', name: 'A' } }, {}];
    results[index] = { error: new Error('workspace failed') };
    const calls = queueSupabase(mocks.from, results);
    await expect(getOrCreateLeadWorkspace(actor)).rejects.toThrow('workspace failed');
    expect(calls).toHaveLength(index + 1);
  });
  it.each([null, [], [{ id: 'lead-without-org', organizations: null }]])('returns leads without issuing an unscoped scan query when no organization exists', async (data) => {
    const calls = queueSupabase(mocks.from, [{ data }]);
    expect(await getLeadOverviewRows('workspace-a')).toEqual(data ?? []);
    expect(calls[0].query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
    expect(calls).toHaveLength(1);
  });
  it('attaches only the newest scan of each organization within the requested workspace', async () => {
    const rows = [{ id: 'lead-a', organizations: { id: 'org-a' } }, { id: 'lead-b', organizations: { id: 'org-b' } }, { id: 'lead-c', organizations: null }];
    const latest = { organization_id: 'org-a', accessibility_score: 80 };
    const calls = queueSupabase(mocks.from, [{ data: rows }, { data: [latest, { organization_id: 'org-a', accessibility_score: 20 }] }]);
    expect(await getLeadOverviewRows('workspace-a')).toEqual([{ ...rows[0], latest_scan: latest }, { ...rows[1], latest_scan: null }, { ...rows[2], latest_scan: null }]);
    expect(calls[1].query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
    expect(calls[1].query.in).toHaveBeenCalledWith('organization_id', ['org-a', 'org-b']);
    expect(calls[1].query.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
  it.each([0, 1])('does not hide overview lookup failures at stage %s', async (index) => {
    const results: QueryResult[] = [{ data: [{ organizations: { id: 'org-a' } }] }, {}];
    results[index] = { error: new Error('overview failed') };
    queueSupabase(mocks.from, results);
    await expect(getLeadOverviewRows('workspace-a')).rejects.toThrow('overview failed');
  });

  function detailResults(): QueryResult[] {
    return [{ data: { id: 'lead-a', organization_id: 'org-a', organizations: { normalized_domain: 'example.com' } } }, {}, {}, {}, {}, {}, {}];
  }
  it('scopes every related detail query to the tenant and filters suppression to matching domain/email', async () => {
    const results = detailResults();
    results[1] = { data: [{ email: 'contact@example.com' }] };
    const byDomain = { normalized_domain: 'example.com' };
    const byEmail = { normalized_email: 'contact@example.com' };
    results[6] = { data: [byDomain, byEmail, { normalized_domain: 'other.com' }, { normalized_email: 'other@example.com' }] };
    const calls = queueSupabase(mocks.from, results);
    const detail = await getLeadDetail('workspace-a', 'lead-a');
    expect(detail.suppressions).toEqual([byDomain, byEmail]);
    expect(detail.consents).toEqual([]);
    expect(detail.scans).toEqual([]);
    expect(detail.drafts).toEqual([]);
    expect(detail.auditEvents).toEqual([]);
    expect(calls).toHaveLength(7);
    for (const call of calls) expect(call.query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
    expect(calls[0].query.eq).toHaveBeenCalledWith('id', 'lead-a');
    for (const index of [1, 2, 3, 4]) expect(calls[index].query.eq).toHaveBeenCalledWith('organization_id', 'org-a');
    expect(calls[5].query.or).toHaveBeenCalledWith('entity_id.eq.lead-a,entity_id.eq.org-a');
  });
  it('returns empty related collections safely', async () => {
    queueSupabase(mocks.from, detailResults());
    expect(await getLeadDetail('workspace-a', 'lead-a')).toMatchObject({ contacts: [], consents: [], scans: [], drafts: [], auditEvents: [], suppressions: [] });
  });
  it.each([0, 1, 2, 3, 4, 5, 6])('rejects detail query failure %s rather than returning incomplete security context', async (index) => {
    const results = detailResults();
    results[index] = { error: new Error('detail lookup failed') };
    queueSupabase(mocks.from, results);
    await expect(getLeadDetail('workspace-a', 'lead-a')).rejects.toThrow('detail lookup failed');
  });
  it.each([[getSuppressionEntries, 'suppression_entries'], [getAuditEvents, 'audit_events']] as const)(
    'scopes bounded security event lists and propagates errors', async (read, table) => {
      const calls = queueSupabase(mocks.from, [{ data: [{ id: 'record-a' }] }, {}, { error: new Error('read failed') }]);
      expect(await read('workspace-a')).toEqual([{ id: 'record-a' }]);
      expect(await read('workspace-b')).toEqual([]);
      await expect(read('workspace-c')).rejects.toThrow('read failed');
      expect(calls[0].table).toBe(table);
      expect(calls[0].query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
      expect(calls[1].query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-b');
      expect(calls[0].query.limit).toHaveBeenCalledWith(100);
    });
});

describe('lead capture storage and digest', () => {
  const dates = { weekAgo: new Date('2026-09-03'), twoWeeksAgo: new Date('2026-08-27') };
  it('does no database work when capture storage is unconfigured', async () => {
    vi.stubEnv('LEAD_CAPTURE_WORKSPACE_ID', '  ');
    expect(await getLeadCaptureStorageHealth()).toEqual({ configured: false, reachable: false });
    expect(await getFreeScanLeadCaptureDigestStats(dates)).toEqual({ freeScanLeads: 0, freeScanLeadsPrev: 0, recentFreeScanLeads: [] });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([null, new Error('unreachable')])('reports configured storage health without throwing on query errors', async (error) => {
    const calls = queueSupabase(mocks.from, [{ error }]);
    expect(await getLeadCaptureStorageHealth()).toEqual({ configured: true, reachable: !error });
    expect(calls[0].query.eq).toHaveBeenCalledWith('id', 'workspace-a');
  });
  it('builds the digest from tenant/source-scoped counts and evidence, retaining missing-score semantics', async () => {
    const calls = queueSupabase(mocks.from, [{ count: 3 }, { count: 2 }, { data: [
      { organizations: { normalized_domain: 'example.com' }, accessibility_score: 80, critical_issues: 1, serious_issues: 2, moderate_issues: 3, minor_issues: 4, created_at: now },
      { created_at: now },
    ] }]);
    expect(await getFreeScanLeadCaptureDigestStats(dates)).toEqual({ freeScanLeads: 3, freeScanLeadsPrev: 2,
      recentFreeScanLeads: [{ domain: 'example.com', score: 80, issues: 10, createdAt: now }, { domain: 'unknown', score: null, issues: 0, createdAt: now }] });
    for (const call of calls) expect(call.query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
    expect(calls[0].query.eq).toHaveBeenCalledWith('source_type', 'free_scan_lead');
    expect(calls[1].query.lt).toHaveBeenCalledWith('created_at', dates.weekAgo.toISOString());
    expect(calls[2].query.eq).toHaveBeenCalledWith('organizations.source_type', 'free_scan_lead');
  });
  it('handles empty digest query data without fabricated leads', async () => {
    queueSupabase(mocks.from, [{}, {}, {}]);
    expect(await getFreeScanLeadCaptureDigestStats(dates)).toEqual({ freeScanLeads: 0, freeScanLeadsPrev: 0, recentFreeScanLeads: [] });
  });
  it.each([0, 1, 2])('propagates digest lookup failure %s', async (index) => {
    const results: QueryResult[] = [{}, {}, {}]; results[index] = { error: new Error('digest failed') };
    queueSupabase(mocks.from, results);
    await expect(getFreeScanLeadCaptureDigestStats(dates)).rejects.toThrow('digest failed');
  });
});

describe('free scan persistence is consent-first', () => {
  const input = { email: ' LEAD@EXAMPLE.COM ', url: 'https://www.example.com/page', phase: 'done' as const, locale: 'nl' as const, clientIp: '192.0.2.1',
    result: { score: 80, totalIssues: 10, impactCritical: 1, impactSerious: 2, impactModerate: 3, impactMinor: 4 } };
  function captureResults(): QueryResult[] { return [{ data: { id: 'org-a' } }, { data: { id: 'lead-a' } }, { data: { id: 'contact-a' } }, { data: { id: 'scan-a' } }, {}]; }
  it('upserts organization/contact identities but never grants commercial outreach consent', async () => {
    const calls = queueSupabase(mocks.from, captureResults());
    expect(await recordFreeScanLeadCapture(input)).toEqual({ stored: true, workspaceId: 'workspace-a', organizationId: 'org-a', contactId: 'contact-a', leadId: 'lead-a', scanId: 'scan-a' });
    expect(calls[0].query.upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', normalized_domain: 'example.com' }), { onConflict: 'workspace_id,normalized_domain' });
    expect(calls[1].query.upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', status: 'permission_required', score: 80,
      score_explanation: expect.stringContaining('requires separate consent') }), { onConflict: 'workspace_id,organization_id' });
    expect(calls[2].query.upsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'lead@example.com', workspace_id: 'workspace-a', is_personal_data: true }), { onConflict: 'organization_id,email' });
    expect(calls[3].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', status: 'completed', accessibility_score: 80 }));
    expect(calls[4].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', event_type: 'free_scan_lead_captured', entity_id: 'lead-a' }));
    expect(calls.some(({ table }) => table === 'consent_events')).toBe(false);
  });
  it.each(['error', 'rate_limited', 'done'] as const)('stores phase %s without scan results as failed evidence, never as a successful scan', async (phase) => {
    const calls = queueSupabase(mocks.from, captureResults());
    await recordFreeScanLeadCapture({ ...input, phase, result: undefined });
    expect(calls[1].query.upsert.mock.calls[0][0]).toMatchObject({ score: 0, status: 'permission_required', score_explanation: expect.stringContaining('without a completed scan') });
    expect(calls[3].query.insert.mock.calls[0][0]).toMatchObject({ status: 'failed', accessibility_score: null, critical_issues: 0, serious_issues: 0, moderate_issues: 0, minor_issues: 0 });
  });
  it.each([0, 1, 2, 3, 4])('stops and propagates capture persistence failure %s', async (index) => {
    const results = captureResults(); results[index] = { error: new Error('capture failed') };
    const calls = queueSupabase(mocks.from, results);
    await expect(recordFreeScanLeadCapture(input)).rejects.toThrow('capture failed');
    expect(calls).toHaveLength(index + 1);
  });
});

describe('double opt-in evidence and one-time token claims', () => {
  const capture = { stored: true as const, workspaceId: 'workspace-a', organizationId: 'org-a', contactId: 'contact-a', leadId: 'lead-a', scanId: 'scan-a' };
  const request = { id: 'request-a', workspace_id: 'workspace-a', organization_id: 'org-a', contact_id: 'contact-a', source: 'free_scan_opt_in', evidence: { locale: 'nl', checkbox: true } };
  it('stores only a token hash, scoped evidence and a 48-hour expiry', async () => {
    const calls = queueSupabase(mocks.from, [{}]);
    expect(await createFreeScanConsentRequest({ capture, token: 'secret-token', locale: 'nl', clientIp: '192.0.2.1', userAgent: 'unit-test' }))
      .toEqual({ expiresAt: '2026-09-12T12:00:00.000Z' });
    const payload = calls[0].query.insert.mock.calls[0][0];
    expect(payload).toMatchObject({ workspace_id: 'workspace-a', organization_id: 'org-a', contact_id: 'contact-a', token_hash: hashConsentToken('secret-token'),
      evidence: { locale: 'nl', checkbox: true, wording_version: 'free_scan_nurture_v1' } });
    expect(JSON.stringify(payload)).not.toContain('secret-token');
  });
  it('propagates request persistence failures', async () => {
    queueSupabase(mocks.from, [{ error: new Error('request failed') }]);
    await expect(createFreeScanConsentRequest({ capture, token: 'token', locale: 'en', clientIp: '192.0.2.1', userAgent: 'test' })).rejects.toThrow('request failed');
  });
  it('rejects invalid/expired requests before any state mutation', async () => {
    const calls = queueSupabase(mocks.from, [{}]);
    expect(await confirmLeadConsentToken('token')).toEqual({ confirmed: false, reason: 'invalid_or_expired' });
    expect(calls[0].query.eq.mock.calls).toEqual([['token_hash', hashConsentToken('token')], ['status', 'pending']]);
    expect(calls[0].query.gt).toHaveBeenCalledWith('expires_at', now);
    expect(calls).toHaveLength(1);
  });
  it('rejects a concurrent/replayed claim when the pending row was already claimed', async () => {
    const calls = queueSupabase(mocks.from, [{ data: request }, {}]);
    expect(await confirmLeadConsentToken('token')).toEqual({ confirmed: false, reason: 'already_used' });
    expect(calls[1].query.eq.mock.calls).toEqual([['id', 'request-a'], ['status', 'pending']]);
    expect(calls).toHaveLength(2);
  });
  function confirmationResults(): QueryResult[] { return [{ data: request }, { data: { id: 'request-a' } }, {}, { data: { id: 'lead-a' } }, {}]; }
  it('records active consent and an audit only after a successful one-time claim', async () => {
    const calls = queueSupabase(mocks.from, confirmationResults());
    expect(await confirmLeadConsentToken('token')).toEqual({ confirmed: true, leadId: 'lead-a' });
    expect(calls[2].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', organization_id: 'org-a', contact_id: 'contact-a',
      status: 'active', lawful_basis: 'consent', evidence: { locale: 'nl', checkbox: true, consent_request_id: 'request-a', confirmed_at: now } }));
    expect(calls[3].query.eq.mock.calls).toEqual([['workspace_id', 'workspace-a'], ['organization_id', 'org-a']]);
    expect(calls[4].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', entity_id: 'lead-a', event_type: 'commercial_outreach_consent_confirmed' }));
  });
  it.each([0, 1, 2, 3, 4])('propagates confirmation failure %s instead of returning a false success', async (index) => {
    const results = confirmationResults(); results[index] = { error: new Error('confirmation failed') };
    const calls = queueSupabase(mocks.from, results);
    await expect(confirmLeadConsentToken('token')).rejects.toThrow('confirmation failed');
    expect(calls).toHaveLength(index + 1);
  });
});
