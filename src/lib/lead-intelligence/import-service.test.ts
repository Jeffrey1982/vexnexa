import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queueSupabase, type QueryResult } from './__tests__/supabase-mock';
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: mocks.from } }));
import { importLeadCsv } from './import-service';

const header = 'company_name,website_url,country_code,industry,source_url,contact_email';
const row = 'Example,https://www.example.com,nl,Services,https://example.com/about,CONTACT@EXAMPLE.COM';
const input = { csvText: `${header}\n${row}`, workspaceId: 'workspace-a', actor: { id: 'actor-a' } };
beforeEach(() => { mocks.from.mockReset(); });

describe('CSV import service', () => {
  function results(): QueryResult[] { return [{}, {}, { data: { id: 'org-a' } }, {}, {}, {}]; }
  it('keeps every read/write tenant-scoped and defaults imported leads to permission required', async () => {
    const calls = queueSupabase(mocks.from, results());
    expect((await importLeadCsv(input)).summary).toEqual({ created: 1, updated: 0, skipped: 0, invalid: 0 });
    for (const index of [0, 1]) expect(calls[index].query.eq).toHaveBeenCalledWith('workspace_id', 'workspace-a');
    expect(calls[2].query.upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', normalized_domain: 'example.com',
      source_type: 'csv_import', country_code: 'NL' }), { onConflict: 'workspace_id,normalized_domain' });
    expect(calls[3].query.upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', organization_id: 'org-a',
      status: 'permission_required', score: 0, score_explanation: expect.stringContaining('separate consent') }), { onConflict: 'workspace_id,organization_id' });
    expect(calls[4].query.upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', organization_id: 'org-a', email: 'contact@example.com',
      is_personal_data: true }), { onConflict: 'organization_id,email' });
    expect(calls[5].query.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: 'workspace-a', actor_user_id: 'actor-a', event_type: 'lead_csv_imported' }));
    expect(calls.some(({ table }) => ['consent_events', 'email_drafts', 'lead_nurture_deliveries'].includes(table))).toBe(false);
  });
  it('detects an existing organization/contact and relies on stable conflict keys rather than duplicate inserts', async () => {
    const responses = results();
    responses[0] = { data: [{ normalized_domain: 'example.com' }] };
    responses[1] = { data: [{ email: 'contact@example.com', organizations: { normalized_domain: 'example.com' } }, { email: 'orphan@example.com', organizations: null }] };
    const calls = queueSupabase(mocks.from, responses);
    expect((await importLeadCsv(input)).summary).toEqual({ created: 0, updated: 1, skipped: 1, invalid: 0 });
    expect(calls[4].query.upsert.mock.calls[0][1]).toEqual({ onConflict: 'organization_id,email' });
  });
  it('can import an organization without creating a contact', async () => {
    const calls = queueSupabase(mocks.from, [{}, {}, { data: { id: 'org-a' } }, {}, {}]);
    expect((await importLeadCsv({ ...input, csvText: `${header}\nExample,https://example.com,nl,Services,,` })).summary.created).toBe(1);
    expect(calls.map(({ table }) => table)).toEqual(['organizations', 'contacts', 'organizations', 'leads', 'audit_events']);
  });
  it('audits rejected rows with a bounded sample and performs no organization/contact writes', async () => {
    const calls = queueSupabase(mocks.from, [{}, {}, {}]);
    const invalidRows = Array.from({ length: 30 }, () => ',https://example.com,nl,Services,,').join('\n');
    const plan = await importLeadCsv({ ...input, csvText: `${header}\n${invalidRows}` });
    expect(plan.summary.invalid).toBe(30);
    expect(calls).toHaveLength(3);
    expect(calls[2].table).toBe('audit_events');
    expect(calls[2].query.insert.mock.calls[0][0].metadata.invalid_rows).toHaveLength(25);
    expect(calls[2].query.insert.mock.calls[0][0].metadata.summary.invalid).toBe(30);
  });
  it('rejects malformed input before any import writes', async () => {
    const calls = queueSupabase(mocks.from, [{}, {}]);
    await expect(importLeadCsv({ ...input, csvText: 'wrong,header' })).rejects.toThrow('missing required columns');
    expect(calls).toHaveLength(2);
  });
  it.each([0, 1, 2, 3, 4, 5])('propagates database error %s instead of reporting a successful import', async (index) => {
    const responses = results(); responses[index] = { error: new Error('database import failed') };
    const calls = queueSupabase(mocks.from, responses);
    await expect(importLeadCsv(input)).rejects.toThrow('database import failed');
    expect(calls).toHaveLength(Math.max(2, index + 1));
  });
});
