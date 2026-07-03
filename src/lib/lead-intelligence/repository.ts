import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeDomain, normalizeEmail } from "./domain-normalization";

export type LeadWorkspace = {
  id: string;
  name: string;
};

type UserLike = {
  id: string;
  email: string;
  company?: string | null;
};

export async function getOrCreateLeadWorkspace(user: UserLike): Promise<LeadWorkspace> {
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("lead_workspace_members")
    .select("workspace_id, lead_workspaces(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

  const workspace = (membership as any)?.lead_workspaces;
  if (workspace?.id) {
    return { id: workspace.id, name: workspace.name };
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from("lead_workspaces")
    .insert({
      name: user.company || "VexNexa Lead Workspace",
      owner_user_id: user.id,
    })
    .select("id, name")
    .single();

  if (createError) throw createError;

  const { error: memberError } = await supabaseAdmin.from("lead_workspace_members").insert({
    workspace_id: created.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) throw memberError;
  return created;
}

export async function getLeadOverviewRows(workspaceId: string) {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id, status, score, created_at, organizations(id, name, normalized_domain, country_code, source_type)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  const rows = data ?? [];
  const organizationIds = rows.map((row: any) => row.organizations?.id).filter(Boolean);
  if (organizationIds.length === 0) return rows;

  const { data: scans, error: scansError } = await supabaseAdmin
    .from("website_scans")
    .select("organization_id, status, accessibility_score, critical_issues, serious_issues, moderate_issues, minor_issues, created_at")
    .eq("workspace_id", workspaceId)
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false });

  if (scansError) throw scansError;

  const latestScanByOrg = new Map<string, any>();
  for (const scan of scans ?? []) {
    if (!latestScanByOrg.has(scan.organization_id)) {
      latestScanByOrg.set(scan.organization_id, scan);
    }
  }

  return rows.map((row: any) => ({
    ...row,
    latest_scan: row.organizations?.id ? latestScanByOrg.get(row.organizations.id) ?? null : null,
  }));
}

export async function getLeadDetail(workspaceId: string, leadId: string) {
  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("*, organizations(*)")
    .eq("workspace_id", workspaceId)
    .eq("id", leadId)
    .single();

  if (leadError) throw leadError;

  const organizationId = (lead as any).organization_id;
  const [contacts, consents, scans, drafts, auditEvents] = await Promise.all([
    supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("consent_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false }),
    supabaseAdmin
      .from("website_scans")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("email_drafts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("audit_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .or(`entity_id.eq.${leadId},entity_id.eq.${organizationId}`)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  for (const result of [contacts, consents, scans, drafts, auditEvents]) {
    if (result.error) throw result.error;
  }

  const contactEmails = new Set((contacts.data ?? []).map((contact: any) => contact.email));
  const { data: suppressionRows, error: suppressionsError } = await supabaseAdmin
    .from("suppression_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(500);
  if (suppressionsError) throw suppressionsError;

  const suppressions = (suppressionRows ?? []).filter(
    (entry: any) =>
      entry.normalized_domain === (lead as any).organizations.normalized_domain ||
      (entry.normalized_email && contactEmails.has(entry.normalized_email)),
  );

  return {
    lead,
    contacts: contacts.data ?? [],
    consents: consents.data ?? [],
    scans: scans.data ?? [],
    drafts: drafts.data ?? [],
    auditEvents: auditEvents.data ?? [],
    suppressions,
  };
}

export async function getSuppressionEntries(workspaceId: string) {
  const { data, error } = await supabaseAdmin
    .from("suppression_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function getAuditEvents(workspaceId: string) {
  const { data, error } = await supabaseAdmin
    .from("audit_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

type FreeScanLeadCaptureInput = {
  email: string;
  url: string;
  phase: "done" | "error" | "rate_limited";
  locale: "en" | "nl" | "de" | "fr" | "es" | "pt";
  clientIp: string;
  result?: {
    score: number;
    totalIssues: number;
    impactCritical: number;
    impactSerious: number;
    impactModerate: number;
    impactMinor: number;
  };
};

export type FreeScanLeadCaptureResult =
  | { stored: true; workspaceId: string; organizationId: string; leadId: string; scanId: string }
  | { stored: false; reason: "not_configured" };

function leadCaptureWorkspaceId(): string | null {
  return process.env.LEAD_CAPTURE_WORKSPACE_ID?.trim() || null;
}

export async function getFreeScanLeadCaptureDigestStats({
  weekAgo,
  twoWeeksAgo,
}: {
  weekAgo: Date;
  twoWeeksAgo: Date;
}) {
  const workspaceId = leadCaptureWorkspaceId();
  if (!workspaceId) {
    return {
      freeScanLeads: 0,
      freeScanLeadsPrev: 0,
      recentFreeScanLeads: [] as Array<{
        domain: string;
        score: number | null;
        issues: number | null;
        createdAt: string;
      }>,
    };
  }

  const [current, previous, recent] = await Promise.all([
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("source_type", "free_scan_lead")
      .gte("created_at", weekAgo.toISOString()),
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("source_type", "free_scan_lead")
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString()),
    supabaseAdmin
      .from("website_scans")
      .select("created_at, accessibility_score, critical_issues, serious_issues, moderate_issues, minor_issues, organizations!inner(normalized_domain, source_type)")
      .eq("workspace_id", workspaceId)
      .eq("organizations.source_type", "free_scan_lead")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  for (const result of [current, previous, recent]) {
    if (result.error) throw result.error;
  }

  return {
    freeScanLeads: current.count ?? 0,
    freeScanLeadsPrev: previous.count ?? 0,
    recentFreeScanLeads: (recent.data ?? []).map((scan: any) => ({
      domain: scan.organizations?.normalized_domain ?? "unknown",
      score: scan.accessibility_score ?? null,
      issues:
        (scan.critical_issues ?? 0) +
        (scan.serious_issues ?? 0) +
        (scan.moderate_issues ?? 0) +
        (scan.minor_issues ?? 0),
      createdAt: scan.created_at,
    })),
  };
}

export async function getLeadCaptureStorageHealth() {
  const workspaceId = leadCaptureWorkspaceId();
  if (!workspaceId) {
    return { configured: false, reachable: false };
  }

  const { error } = await supabaseAdmin
    .from("lead_workspaces")
    .select("id", { head: true })
    .eq("id", workspaceId)
    .limit(1);

  return {
    configured: true,
    reachable: !error,
  };
}

function freeScanLeadExplanation(input: FreeScanLeadCaptureInput): string {
  if (input.phase !== "done" || !input.result) {
    return "Free-scan lead captured without a completed scan. Manual follow-up required. Outreach requires separate consent or customer evidence.";
  }

  return `Free scan captured with score ${input.result.score}/100 and ${input.result.totalIssues} reported issues. Outreach requires separate consent or customer evidence.`;
}

export async function recordFreeScanLeadCapture(
  input: FreeScanLeadCaptureInput,
): Promise<FreeScanLeadCaptureResult> {
  const workspaceId = leadCaptureWorkspaceId();
  if (!workspaceId) {
    return { stored: false, reason: "not_configured" };
  }

  const normalizedDomain = normalizeDomain(input.url);
  const normalizedEmail = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const { data: organization, error: orgError } = await supabaseAdmin
    .from("organizations")
    .upsert(
      {
        workspace_id: workspaceId,
        name: normalizedDomain,
        website_url: input.url,
        normalized_domain: normalizedDomain,
        source_type: "free_scan_lead",
        source_url: input.url,
        updated_at: now,
      },
      { onConflict: "workspace_id,normalized_domain" },
    )
    .select("id")
    .single();

  if (orgError) throw orgError;

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .upsert(
      {
        workspace_id: workspaceId,
        organization_id: organization.id,
        status: "permission_required",
        score: input.result?.score ?? 0,
        score_explanation: freeScanLeadExplanation(input),
        updated_at: now,
      },
      { onConflict: "workspace_id,organization_id" },
    )
    .select("id")
    .single();

  if (leadError) throw leadError;

  const { error: contactError } = await supabaseAdmin.from("contacts").upsert(
    {
      workspace_id: workspaceId,
      organization_id: organization.id,
      email: normalizedEmail,
      source_type: "free_scan_lead",
      source_url: input.url,
      is_personal_data: true,
      updated_at: now,
    },
    { onConflict: "organization_id,email" },
  );

  if (contactError) throw contactError;

  const status = input.phase === "done" && input.result ? "completed" : "failed";
  const { data: scan, error: scanError } = await supabaseAdmin
    .from("website_scans")
    .insert({
      workspace_id: workspaceId,
      organization_id: organization.id,
      requested_url: input.url,
      final_url: input.phase === "done" ? input.url : null,
      status,
      accessibility_score: input.result?.score ?? null,
      critical_issues: input.result?.impactCritical ?? 0,
      serious_issues: input.result?.impactSerious ?? 0,
      moderate_issues: input.result?.impactModerate ?? 0,
      minor_issues: input.result?.impactMinor ?? 0,
      started_at: now,
      completed_at: now,
    })
    .select("id")
    .single();

  if (scanError) throw scanError;

  const { error: auditError } = await supabaseAdmin.from("audit_events").insert({
    workspace_id: workspaceId,
    actor_user_id: null,
    event_type: "free_scan_lead_captured",
    entity_type: "lead",
    entity_id: lead.id,
    metadata: {
      organization_id: organization.id,
      website_scan_id: scan.id,
      email: normalizedEmail,
      url: input.url,
      phase: input.phase,
      locale: input.locale,
      client_ip: input.clientIp,
      score: input.result?.score ?? null,
      total_issues: input.result?.totalIssues ?? null,
    },
  });

  if (auditError) throw auditError;

  return {
    stored: true,
    workspaceId,
    organizationId: organization.id,
    leadId: lead.id,
    scanId: scan.id,
  };
}
