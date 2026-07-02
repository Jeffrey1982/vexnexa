import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { canSendCommercialEmail, type CommercialEmailDecisionInput } from "./outreach-eligibility";

const testUrl = process.env.LEAD_INT_TEST_SUPABASE_URL;
const anonKey = process.env.LEAD_INT_TEST_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.LEAD_INT_TEST_SUPABASE_SERVICE_ROLE_KEY;
const safeConfirmed = process.env.LEAD_INT_TEST_DATABASE_IS_SAFE === "true";
const allowRemote = process.env.LEAD_INT_TEST_ALLOW_REMOTE_STAGING === "true";
const isLocalTarget = !!testUrl && /localhost|127\.0\.0\.1/.test(testUrl);
const shouldRun = !!testUrl && !!anonKey && !!serviceRoleKey && safeConfirmed && (isLocalTarget || allowRemote);

type SeededFixture = {
  runId: string;
  alphaAdmin: { id: string; email: string; password: string };
  alphaMember: { id: string; email: string; password: string };
  betaAdmin: { id: string; email: string; password: string };
  alphaWorkspaceId: string;
  betaWorkspaceId: string;
  cases: Record<string, { leadId: string; contactId: string; input: CommercialEmailDecisionInput }>;
};

function adminClient() {
  if (!testUrl || !serviceRoleKey) throw new Error("Missing integration test admin env.");
  return createClient(testUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  if (!testUrl || !anonKey) throw new Error("Missing integration test anon env.");
  const client = createClient(testUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function createTestUser(supabase: SupabaseClient, runId: string, label: string) {
  const email = `lead-int-${label}-${runId}@example.test`;
  const password = `Test-${randomUUID()}-1a`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { is_admin: label.includes("admin") },
  });
  if (error || !data.user) throw error ?? new Error("User was not created.");
  return { id: data.user.id, email, password };
}

async function seedFixture(): Promise<SeededFixture> {
  const supabase = adminClient();
  const runId = randomUUID().slice(0, 8);
  const alphaAdmin = await createTestUser(supabase, runId, "alpha-admin");
  const alphaMember = await createTestUser(supabase, runId, "alpha-member");
  const betaAdmin = await createTestUser(supabase, runId, "beta-admin");

  const { data: workspaces, error: workspaceError } = await supabase
    .from("lead_workspaces")
    .insert([
      { name: `Workspace Alpha ${runId}`, owner_user_id: alphaAdmin.id },
      { name: `Workspace Beta ${runId}`, owner_user_id: betaAdmin.id },
    ])
    .select("id, name");
  if (workspaceError || !workspaces) throw workspaceError ?? new Error("Workspaces missing.");

  const alphaWorkspaceId = workspaces.find((workspace: any) => workspace.name.includes("Alpha"))!.id;
  const betaWorkspaceId = workspaces.find((workspace: any) => workspace.name.includes("Beta"))!.id;

  const { error: memberError } = await supabase.from("lead_workspace_members").insert([
    { workspace_id: alphaWorkspaceId, user_id: alphaAdmin.id, role: "owner" },
    { workspace_id: alphaWorkspaceId, user_id: alphaMember.id, role: "member" },
    { workspace_id: betaWorkspaceId, user_id: betaAdmin.id, role: "owner" },
  ]);
  if (memberError) throw memberError;

  const caseInputs: Record<string, Partial<CommercialEmailDecisionInput> & { domain: string; status?: string }> = {
    validConsent: {
      domain: `valid-${runId}.example.test`,
      consentEvents: [{ consentType: "commercial_outreach", status: "active", evidence: { form: "opt-in" } }],
    },
    publicEmail: { domain: `public-${runId}.example.test`, consentEvents: [] },
    consentWithoutEvidence: {
      domain: `no-evidence-${runId}.example.test`,
      consentEvents: [{ consentType: "commercial_outreach", status: "active", evidence: {} }],
    },
    expiredConsent: {
      domain: `expired-${runId}.example.test`,
      consentEvents: [
        {
          consentType: "commercial_outreach",
          status: "active",
          evidence: { form: "old" },
          expiresAt: "2026-01-01T00:00:00Z",
        },
      ],
    },
    withdrawnConsent: {
      domain: `withdrawn-${runId}.example.test`,
      consentEvents: [{ consentType: "commercial_outreach", status: "withdrawn", evidence: { email: "stop" } }],
    },
    revokedConsent: {
      domain: `revoked-${runId}.example.test`,
      consentEvents: [{ consentType: "commercial_outreach", status: "revoked", evidence: { admin: "revoked" } }],
    },
    existingCustomer: {
      domain: `customer-${runId}.example.test`,
      status: "existing_customer",
      consentEvents: [
        { consentType: "existing_customer_relationship", status: "active", evidence: { invoice: "TEST-1" } },
      ],
    },
    customerWithoutEvidence: {
      domain: `claimed-customer-${runId}.example.test`,
      status: "existing_customer",
      consentEvents: [{ consentType: "existing_customer_relationship", status: "active", evidence: {} }],
    },
    suppressedEmail: {
      domain: `suppressed-email-${runId}.example.test`,
      consentEvents: [{ consentType: "commercial_outreach", status: "active", evidence: { form: "opt-in" } }],
      suppressedEmails: [`person@suppressed-email-${runId}.example.test`],
    },
    suppressedDomain: {
      domain: `suppressed-domain-${runId}.example.test`,
      consentEvents: [{ consentType: "commercial_outreach", status: "active", evidence: { form: "opt-in" } }],
      suppressedDomains: [`suppressed-domain-${runId}.example.test`],
    },
    unsubscribedLead: {
      domain: `unsubscribed-${runId}.example.test`,
      status: "unsubscribed",
      consentEvents: [{ consentType: "commercial_outreach", status: "active", evidence: { form: "opt-in" } }],
    },
    doNotContactLead: {
      domain: `dnc-${runId}.example.test`,
      status: "do_not_contact",
      consentEvents: [{ consentType: "commercial_outreach", status: "active", evidence: { form: "opt-in" } }],
    },
  };

  const cases: SeededFixture["cases"] = {};
  for (const [name, config] of Object.entries(caseInputs)) {
    const email = `person@${config.domain}`;
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        workspace_id: alphaWorkspaceId,
        name: `Org ${name}`,
        website_url: `https://${config.domain}/source?x=1`,
        normalized_domain: config.domain,
        country_code: "NL",
        source_type: "integration_test",
      })
      .select("id")
      .single();
    if (orgError) throw orgError;

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        workspace_id: alphaWorkspaceId,
        organization_id: org.id,
        email,
        source_type: "integration_test",
      })
      .select("id")
      .single();
    if (contactError) throw contactError;

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        workspace_id: alphaWorkspaceId,
        organization_id: org.id,
        status: config.status ?? "permission_required",
      })
      .select("id")
      .single();
    if (leadError) throw leadError;

    for (const event of config.consentEvents ?? []) {
      const { error } = await supabase.from("consent_events").insert({
        workspace_id: alphaWorkspaceId,
        organization_id: org.id,
        contact_id: contact.id,
        consent_type: event.consentType,
        status: event.status,
        lawful_basis: "integration_test",
        source: "integration_test",
        evidence: event.evidence ?? {},
        occurred_at: "2026-06-01T00:00:00Z",
        expires_at: event.expiresAt ?? null,
      });
      if (error) throw error;
    }

    for (const suppressedEmail of config.suppressedEmails ?? []) {
      const { error } = await supabase.from("suppression_entries").insert({
        workspace_id: alphaWorkspaceId,
        normalized_email: suppressedEmail,
        reason: "integration_test",
        source: "integration_test",
      });
      if (error) throw error;
    }
    for (const suppressedDomain of config.suppressedDomains ?? []) {
      const { error } = await supabase.from("suppression_entries").insert({
        workspace_id: alphaWorkspaceId,
        normalized_domain: suppressedDomain,
        reason: "integration_test",
        source: "integration_test",
      });
      if (error) throw error;
    }

    cases[name] = {
      leadId: lead.id,
      contactId: contact.id,
      input: {
        contactEmail: email,
        organizationDomain: config.domain,
        leadStatus: (config.status as any) ?? "permission_required",
        consentEvents: config.consentEvents ?? [],
        suppressedEmails: config.suppressedEmails,
        suppressedDomains: config.suppressedDomains,
        now: new Date("2026-06-27T12:00:00Z"),
      },
    };
  }

  const { data: betaOrg, error: betaOrgError } = await supabase
    .from("organizations")
    .insert({
      workspace_id: betaWorkspaceId,
      name: `Beta Org ${runId}`,
      website_url: `https://beta-${runId}.example.test`,
      normalized_domain: `beta-${runId}.example.test`,
      source_type: "integration_test",
    })
    .select("id")
    .single();
  if (betaOrgError) throw betaOrgError;
  await supabase.from("contacts").insert({
    workspace_id: betaWorkspaceId,
    organization_id: betaOrg.id,
    email: `person@beta-${runId}.example.test`,
    source_type: "integration_test",
  });
  await supabase.from("leads").insert({
    workspace_id: betaWorkspaceId,
    organization_id: betaOrg.id,
    status: "permission_required",
  });
  await supabase.from("audit_events").insert({
    workspace_id: betaWorkspaceId,
    actor_user_id: betaAdmin.id,
    event_type: "integration_test_seed",
    entity_type: "workspace",
  });

  return { runId, alphaAdmin, alphaMember, betaAdmin, alphaWorkspaceId, betaWorkspaceId, cases };
}

async function cleanup(fixture: SeededFixture) {
  const supabase = adminClient();
  await supabase.from("lead_workspaces").delete().in("id", [fixture.alphaWorkspaceId, fixture.betaWorkspaceId]);
  await Promise.all(
    [fixture.alphaAdmin.id, fixture.alphaMember.id, fixture.betaAdmin.id].map((id) =>
      supabase.auth.admin.deleteUser(id),
    ),
  );
}

const runDescribe = shouldRun ? describe : describe.skip;

runDescribe("Lead Intelligence database integration", () => {
  it("enforces tenant isolation with real RLS policies", async () => {
    const fixture = await seedFixture();
    try {
      const alpha = await signedInClient(fixture.alphaMember.email, fixture.alphaMember.password);
      const beta = await signedInClient(fixture.betaAdmin.email, fixture.betaAdmin.password);
      const anonymous = createClient(testUrl!, anonKey!, { auth: { persistSession: false } });

      const alphaOrganizations = await alpha.from("organizations").select("workspace_id");
      expect(alphaOrganizations.error).toBeNull();
      expect(alphaOrganizations.data?.every((row: any) => row.workspace_id === fixture.alphaWorkspaceId)).toBe(true);

      const betaContacts = await beta.from("contacts").select("workspace_id");
      expect(betaContacts.error).toBeNull();
      expect(betaContacts.data?.every((row: any) => row.workspace_id === fixture.betaWorkspaceId)).toBe(true);

      for (const table of ["organizations", "contacts", "consent_events", "suppression_entries", "audit_events"]) {
        const forged = await alpha.from(table).select("id").eq("workspace_id", fixture.betaWorkspaceId);
        expect(forged.error).toBeNull();
        expect(forged.data).toHaveLength(0);
      }

      const unauthenticated = await anonymous.from("organizations").select("id");
      expect(unauthenticated.error).toBeNull();
      expect(unauthenticated.data).toHaveLength(0);
    } finally {
      await cleanup(fixture);
    }
  }, 60_000);

  it("keeps PostgreSQL and TypeScript outreach eligibility in agreement", async () => {
    const fixture = await seedFixture();
    try {
      const alpha = await signedInClient(fixture.alphaMember.email, fixture.alphaMember.password);

      for (const [name, testCase] of Object.entries(fixture.cases)) {
        const tsDecision = canSendCommercialEmail(testCase.input);
        const { data, error } = await alpha.rpc("can_send_commercial_email", {
          target_workspace_id: fixture.alphaWorkspaceId,
          target_lead_id: testCase.leadId,
          target_contact_id: testCase.contactId,
        });
        expect(error, name).toBeNull();
        expect(Boolean(data), name).toBe(tsDecision.allowed);
      }
    } finally {
      await cleanup(fixture);
    }
  }, 60_000);
});
