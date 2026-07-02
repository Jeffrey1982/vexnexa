import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260627090000_lead_intelligence_foundation.sql"),
  "utf8",
).toLowerCase();

const leadTables = [
  "lead_workspaces",
  "lead_workspace_members",
  "organizations",
  "contacts",
  "leads",
  "consent_events",
  "website_scans",
  "scan_findings",
  "email_drafts",
  "suppression_entries",
  "audit_events",
];

describe("Lead Intelligence migration contract", () => {
  it("creates the Phase 1 tables", () => {
    for (const table of leadTables) {
      expect(migration).toContain(`create table if not exists ${table}`);
    }
  });

  it("enables RLS and workspace-scoped policies on sensitive tables", () => {
    for (const table of leadTables) {
      expect(migration).toContain(`alter table ${table} enable row level security`);
    }
    expect(migration).toContain("is_lead_workspace_member(workspace_id)");
  });

  it("defines integrity constraints for lead scoring, statuses, drafts, and suppressions", () => {
    expect(migration).toContain("score between 0 and 100");
    expect(migration).toContain("'permission_required'");
    expect(migration).toContain("'do_not_contact'");
    expect(migration).toContain("'pending_review'");
    expect(migration).toContain("suppression_email_or_domain");
    expect(migration).toContain("organizations_domain_unique_per_workspace");
  });

  it("keeps security-definer functions on a restrictive search path and revokes public execution", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = pg_catalog, public");
    expect(migration).toContain("revoke all on function is_lead_workspace_member(uuid) from public, anon");
    expect(migration).toContain(
      "revoke all on function can_send_commercial_email(uuid, uuid, uuid) from public, anon",
    );
  });

  it("does not grant lead tables to anon or public", () => {
    expect(migration).not.toMatch(/grant\s+(all|select|insert|update|delete).*on\s+(table\s+)?(organizations|contacts|leads|consent_events|suppression_entries).*to\s+(anon|public)/);
  });
});
