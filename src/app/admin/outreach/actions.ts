'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendBatch, type SendBatchResult } from '@/lib/outreach/send-engine';
import { mergeVariables, type PersonalizationVars } from '@/lib/outreach/personalize';
import { buildUnsubscribeUrl } from '@/lib/outreach/unsubscribe';

// ── Types ────────────────────────────────────────────────────────────

interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Companies ────────────────────────────────────────────────────────

export async function fetchCompanies(
  limit: number = 50,
  offset: number = 0,
  search?: string
): Promise<ActionResult> {
  try {
    let query = supabaseAdmin
      .from('outreach_companies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,website.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { companies: data ?? [], total: count ?? 0 } };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch companies' };
  }
}

export async function createCompany(payload: {
  name: string;
  website?: string;
  country?: string;
  industry?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    if (!payload.name?.trim()) return { ok: false, error: 'Company name is required' };

    const domain = payload.website
      ? payload.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
      : null;

    const { data, error } = await supabaseAdmin
      .from('outreach_companies')
      .insert({ ...payload, domain })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to create company' };
  }
}

export async function updateCompany(id: string, payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    if (!id) return { ok: false, error: 'ID required' };

    if (payload.website && typeof payload.website === 'string') {
      payload.domain = payload.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    }

    const { data, error } = await supabaseAdmin
      .from('outreach_companies')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update company' };
  }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  try {
    const { error } = await supabaseAdmin.from('outreach_companies').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete company' };
  }
}

// ── Contacts ─────────────────────────────────────────────────────────

export async function fetchContacts(
  limit: number = 50,
  offset: number = 0,
  filters?: { search?: string; country?: string; tag?: string; unsubscribed?: boolean }
): Promise<ActionResult> {
  try {
    let query = supabaseAdmin
      .from('outreach_contacts')
      .select('*, outreach_companies(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }
    if (filters?.country) query = query.eq('country', filters.country);
    if (filters?.tag) query = query.contains('tags', [filters.tag]);
    if (filters?.unsubscribed !== undefined) query = query.eq('unsubscribed', filters.unsubscribed);

    const { data, count, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { contacts: data ?? [], total: count ?? 0 } };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch contacts' };
  }
}

export async function createContact(payload: {
  first_name: string;
  last_name: string;
  email: string;
  company_id?: string;
  position?: string;
  country?: string;
  tags?: string[];
}): Promise<ActionResult> {
  try {
    if (!payload.email?.trim()) return { ok: false, error: 'Email is required' };

    const { data, error } = await supabaseAdmin
      .from('outreach_contacts')
      .insert({ ...payload, email: payload.email.toLowerCase().trim() })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to create contact' };
  }
}

export async function updateContact(id: string, payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    if (!id) return { ok: false, error: 'ID required' };

    const { data, error } = await supabaseAdmin
      .from('outreach_contacts')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update contact' };
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const { error } = await supabaseAdmin.from('outreach_contacts').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete contact' };
  }
}

// ── CSV Import ───────────────────────────────────────────────────────

interface ImportRow {
  company_name?: string;
  website?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  tags?: string;
}

interface ImportReport {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function importContacts(rows: ImportRow[]): Promise<ActionResult<ImportReport>> {
  const report: ImportReport = { imported: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header + 0-index

    if (!row.email || !isValidEmail(row.email.trim())) {
      report.errors.push(`Row ${rowNum}: Invalid or missing email "${row.email ?? ''}"`);
      report.skipped++;
      continue;
    }

    const email = row.email.trim().toLowerCase();

    try {
      // Upsert company if provided
      let companyId: string | null = null;
      if (row.company_name?.trim()) {
        const domain = row.website
          ? row.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
          : null;

        // Try to find by domain first, then by name
        let existing = null;
        if (domain) {
          const { data } = await supabaseAdmin
            .from('outreach_companies')
            .select('id')
            .eq('domain', domain)
            .limit(1)
            .maybeSingle();
          existing = data;
        }
        if (!existing) {
          const { data } = await supabaseAdmin
            .from('outreach_companies')
            .select('id')
            .eq('name', row.company_name.trim())
            .limit(1)
            .maybeSingle();
          existing = data;
        }

        if (existing) {
          companyId = existing.id;
        } else {
          const { data: newCo } = await supabaseAdmin
            .from('outreach_companies')
            .insert({
              name: row.company_name.trim(),
              website: row.website?.trim() || null,
              domain,
              country: row.country?.trim() || null,
            })
            .select('id')
            .single();
          companyId = newCo?.id ?? null;
        }
      }

      // Upsert contact by email
      const tags = row.tags
        ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      const { data: existingContact } = await supabaseAdmin
        .from('outreach_contacts')
        .select('id')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (existingContact) {
        await supabaseAdmin
          .from('outreach_contacts')
          .update({
            first_name: row.first_name?.trim() || undefined,
            last_name: row.last_name?.trim() || undefined,
            company_id: companyId || undefined,
            position: row.position?.trim() || undefined,
            country: row.country?.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContact.id);
        report.updated++;
      } else {
        await supabaseAdmin
          .from('outreach_contacts')
          .insert({
            email,
            first_name: row.first_name?.trim() || '',
            last_name: row.last_name?.trim() || '',
            company_id: companyId,
            position: row.position?.trim() || '',
            country: row.country?.trim() || '',
            tags,
          });
        report.imported++;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      report.errors.push(`Row ${rowNum} (${email}): ${msg.substring(0, 100)}`);
      report.skipped++;
    }
  }

  return { ok: true, data: report };
}

// ── Campaigns ────────────────────────────────────────────────────────

export async function fetchCampaigns(
  limit: number = 50,
  offset: number = 0
): Promise<ActionResult> {
  try {
    const { data, count, error } = await supabaseAdmin
      .from('outreach_campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { campaigns: data ?? [], total: count ?? 0 } };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch campaigns' };
  }
}

export async function fetchCampaign(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('outreach_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Campaign not found' };
  }
}

export async function createCampaign(payload: {
  name: string;
  subject: string;
  template_name?: string;
  html_body: string;
  text_body: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  tag?: string;
  filters?: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    if (!payload.name?.trim()) return { ok: false, error: 'Campaign name is required' };
    if (!payload.subject?.trim()) return { ok: false, error: 'Subject is required' };

    const { data, error } = await supabaseAdmin
      .from('outreach_campaigns')
      .insert(payload)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to create campaign' };
  }
}

export async function updateCampaign(id: string, payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('outreach_campaigns')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update campaign' };
  }
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  try {
    const { error } = await supabaseAdmin.from('outreach_campaigns').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete campaign' };
  }
}

// ── Recipients ───────────────────────────────────────────────────────

export async function buildRecipients(
  campaignId: string,
  filters: { country?: string; tag?: string; hasWebsite?: boolean }
): Promise<ActionResult<{ total: number }>> {
  try {
    // Fetch eligible contacts
    let query = supabaseAdmin
      .from('outreach_contacts')
      .select('id, email, first_name, last_name, country, company_id, outreach_companies(name, website)')
      .eq('do_not_email', false)
      .eq('unsubscribed', false);

    if (filters.country) query = query.eq('country', filters.country);
    if (filters.tag) query = query.contains('tags', [filters.tag]);

    const { data: contacts, error: cErr } = await query;
    if (cErr) return { ok: false, error: cErr.message };
    if (!contacts || contacts.length === 0) return { ok: false, error: 'No eligible contacts match the filters.' };

    // Filter by hasWebsite client-side (company must have website)
    let filtered = contacts;
    if (filters.hasWebsite) {
      filtered = contacts.filter((c: Record<string, unknown>) => {
        const co = c.outreach_companies as { website?: string } | null;
        return co?.website;
      });
    }

    // Check global suppressions
    const emails = filtered.map((c: Record<string, unknown>) => (c.email as string).toLowerCase());
    const { data: suppressed } = await supabaseAdmin
      .from('outreach_unsubscribes')
      .select('email')
      .in('email', emails);

    const suppressedSet = new Set((suppressed ?? []).map((s: { email: string }) => s.email.toLowerCase()));

    // Also check email_suppressions
    const { data: suppressed2 } = await supabaseAdmin
      .from('email_suppressions')
      .select('email')
      .in('email', emails);

    (suppressed2 ?? []).forEach((s: { email: string }) => suppressedSet.add(s.email.toLowerCase()));

    const eligible = filtered.filter((c: Record<string, unknown>) => !suppressedSet.has((c.email as string).toLowerCase()));

    if (eligible.length === 0) return { ok: false, error: 'All matching contacts are suppressed or unsubscribed.' };

    // Delete existing recipients for this campaign (rebuild)
    await supabaseAdmin
      .from('outreach_campaign_recipients')
      .delete()
      .eq('campaign_id', campaignId);

    // Insert recipients
    const rows = eligible.map((c: Record<string, unknown>) => {
      const co = c.outreach_companies as { name?: string; website?: string } | null;
      return {
        campaign_id: campaignId,
        contact_id: c.id as string,
        email: (c.email as string).toLowerCase(),
        first_name: (c.first_name as string) || '',
        last_name: (c.last_name as string) || '',
        company_name: co?.name || '',
        website: co?.website || '',
        country: (c.country as string) || '',
        status: 'pending',
      };
    });

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error: insErr } = await supabaseAdmin
        .from('outreach_campaign_recipients')
        .insert(batch);
      if (insErr) return { ok: false, error: insErr.message };
    }

    // Update campaign counts
    await supabaseAdmin
      .from('outreach_campaigns')
      .update({ total_recipients: rows.length, filters, updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    return { ok: true, data: { total: rows.length } };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to build recipients' };
  }
}

export async function fetchRecipients(
  campaignId: string,
  limit: number = 50,
  offset: number = 0,
  status?: string
): Promise<ActionResult> {
  try {
    let query = supabaseAdmin
      .from('outreach_campaign_recipients')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { recipients: data ?? [], total: count ?? 0 } };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch recipients' };
  }
}

export async function fetchRecipientCounts(campaignId: string): Promise<ActionResult> {
  try {
    const statuses = ['pending', 'sent', 'failed', 'skipped'];
    const counts: Record<string, number> = {};

    for (const s of statuses) {
      const { count } = await supabaseAdmin
        .from('outreach_campaign_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', s);
      counts[s] = count ?? 0;
    }

    return { ok: true, data: counts };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch counts' };
  }
}

// ── Send ─────────────────────────────────────────────────────────────

export async function sendCampaignBatch(campaignId: string): Promise<ActionResult<SendBatchResult>> {
  try {
    const result = await sendBatch(campaignId);
    return { ok: true, data: result };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed' };
  }
}

// ── Preview ──────────────────────────────────────────────────────────

export async function previewCampaignEmail(
  campaignId: string,
  contactId?: string
): Promise<ActionResult<{ subject: string; html: string; text: string }>> {
  try {
    const { data: campaign } = await supabaseAdmin
      .from('outreach_campaigns')
      .select('subject, html_body, text_body')
      .eq('id', campaignId)
      .single();

    if (!campaign) return { ok: false, error: 'Campaign not found' };

    // Get a sample contact
    let contact: Record<string, unknown> | null = null;
    if (contactId) {
      const { data } = await supabaseAdmin
        .from('outreach_contacts')
        .select('*, outreach_companies(name, website)')
        .eq('id', contactId)
        .single();
      contact = data;
    } else {
      // Get first recipient
      const { data } = await supabaseAdmin
        .from('outreach_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .limit(1)
        .maybeSingle();
      contact = data;
    }

    const vars: PersonalizationVars = {
      first_name: (contact?.first_name as string) || 'John',
      last_name: (contact?.last_name as string) || 'Doe',
      company_name: (contact?.company_name as string) || ((contact?.outreach_companies as { name?: string })?.name) || 'Acme Corp',
      website: (contact?.website as string) || ((contact?.outreach_companies as { website?: string })?.website) || 'https://example.com',
      country: (contact?.country as string) || 'Netherlands',
      email: (contact?.email as string) || 'john@example.com',
      unsubscribe_url: buildUnsubscribeUrl((contact?.email as string) || 'john@example.com'),
    };

    return {
      ok: true,
      data: {
        subject: mergeVariables(campaign.subject || '', vars, false),
        html: mergeVariables(campaign.html_body || '', vars, true),
        text: mergeVariables(campaign.text_body || '', vars, false),
      },
    };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Preview failed' };
  }
}

// ── Templates (fetch for campaign creation) ──────────────────────────

export async function fetchTemplates(): Promise<ActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('id, name, subject, html, text')
      .order('updated_at', { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch templates' };
  }
}

// ── Stats helpers ────────────────────────────────────────────────────

export async function fetchOutreachStats(): Promise<ActionResult> {
  try {
    const [companies, contacts, campaigns, unsubscribes] = await Promise.all([
      supabaseAdmin.from('outreach_companies').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('outreach_contacts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('outreach_campaigns').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('outreach_unsubscribes').select('id', { count: 'exact', head: true }),
    ]);

    return {
      ok: true,
      data: {
        companies: companies.count ?? 0,
        contacts: contacts.count ?? 0,
        campaigns: campaigns.count ?? 0,
        unsubscribes: unsubscribes.count ?? 0,
      },
    };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch stats' };
  }
}
