import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { planCsvLeadImport } from "./csv-import";

type ImportUser = {
  id: string;
};

export async function importLeadCsv({
  csvText,
  workspaceId,
  actor,
}: {
  csvText: string;
  workspaceId: string;
  actor: ImportUser;
}) {
  const [{ data: orgs, error: orgsError }, { data: contacts, error: contactsError }] = await Promise.all([
    supabaseAdmin
      .from("organizations")
      .select("normalized_domain")
      .eq("workspace_id", workspaceId),
    supabaseAdmin
      .from("contacts")
      .select("email, organizations(normalized_domain)")
      .eq("workspace_id", workspaceId),
  ]);

  if (orgsError) throw orgsError;
  if (contactsError) throw contactsError;

  const plan = planCsvLeadImport(csvText, {
    organizationDomains: new Set((orgs ?? []).map((org: any) => org.normalized_domain)),
    contactKeys: new Set(
      (contacts ?? []).map((contact: any) => {
        const domain = contact.organizations?.normalized_domain ?? "";
        return `${domain}:${contact.email}`;
      }),
    ),
  });

  for (const row of plan.rows) {
    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .upsert(
        {
          workspace_id: workspaceId,
          name: row.company_name,
          website_url: row.website_url,
          normalized_domain: row.normalized_domain,
          country_code: row.country_code,
          industry: row.industry,
          source_type: "csv_import",
          source_url: row.source_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,normalized_domain" },
      )
      .select("id")
      .single();

    if (orgError) throw orgError;

    const { error: leadError } = await supabaseAdmin.from("leads").upsert(
      {
        workspace_id: workspaceId,
        organization_id: organization.id,
        status: "permission_required",
        score: 0,
        score_explanation: "Imported from CSV. Outreach requires separate consent or customer evidence.",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,organization_id" },
    );
    if (leadError) throw leadError;

    if (row.normalized_email) {
      const { error: contactError } = await supabaseAdmin.from("contacts").upsert(
        {
          workspace_id: workspaceId,
          organization_id: organization.id,
          email: row.normalized_email,
          source_type: "csv_import",
          source_url: row.source_url,
          is_personal_data: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,email" },
      );
      if (contactError) throw contactError;
    }
  }

  const { error: auditError } = await supabaseAdmin.from("audit_events").insert({
    workspace_id: workspaceId,
    actor_user_id: actor.id,
    event_type: "lead_csv_imported",
    entity_type: "csv_import",
    metadata: {
      summary: plan.summary,
      invalid_rows: plan.invalidRows.slice(0, 25),
    },
  });
  if (auditError) throw auditError;

  return plan;
}
