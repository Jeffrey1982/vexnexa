import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    .select("id, status, score, created_at, organizations(name, normalized_domain, country_code)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
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
