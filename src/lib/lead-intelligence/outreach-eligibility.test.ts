import { describe, expect, it } from "vitest";
import { canSendCommercialEmail, type CommercialEmailDecisionInput } from "./outreach-eligibility";

const base: CommercialEmailDecisionInput = {
  contactEmail: "buyer@example.com",
  organizationDomain: "example.com",
  leadStatus: "permission_required",
  now: new Date("2026-06-27T12:00:00Z"),
  consentEvents: [],
};

describe("canSendCommercialEmail", () => {
  it("allows valid active consent with evidence", () => {
    const decision = canSendCommercialEmail({
      ...base,
      consentEvents: [
        {
          consentType: "commercial_outreach",
          status: "active",
          evidence: { form: "newsletter opt-in" },
        },
      ],
    });

    expect(decision.allowed).toBe(true);
  });

  it("allows a qualifying existing-customer relationship with evidence", () => {
    const decision = canSendCommercialEmail({
      ...base,
      consentEvents: [
        {
          consentType: "existing_customer_relationship",
          status: "active",
          evidence: { invoiceId: "INV-1" },
        },
      ],
    });

    expect(decision.allowed).toBe(true);
  });

  it.each([
    ["expired consent", { expiresAt: "2026-01-01T00:00:00Z", status: "active" }],
    ["withdrawn consent", { status: "withdrawn" }],
    ["absence of evidence", { status: "active", evidence: {} }],
  ])("blocks %s", (_label, event) => {
    const decision = canSendCommercialEmail({
      ...base,
      consentEvents: [
        {
          consentType: "commercial_outreach",
          evidence: { source: "form" },
          ...event,
        },
      ],
    });

    expect(decision.allowed).toBe(false);
  });

  it("blocks a later withdrawal even when an older active consent event exists", () => {
    const decision = canSendCommercialEmail({
      ...base,
      consentEvents: [
        {
          consentType: "commercial_outreach",
          status: "active",
          evidence: { form: "old opt-in" },
        },
        {
          consentType: "commercial_outreach",
          status: "withdrawn",
          evidence: { request: "unsubscribe reply" },
        },
      ],
    });

    expect(decision.allowed).toBe(false);
  });

  it("blocks suppressed email", () => {
    expect(canSendCommercialEmail({ ...base, suppressedEmails: ["buyer@example.com"] }).allowed).toBe(false);
  });

  it("blocks suppressed domain", () => {
    expect(canSendCommercialEmail({ ...base, suppressedDomains: ["example.com"] }).allowed).toBe(false);
  });

  it("blocks unsubscribed lead", () => {
    expect(canSendCommercialEmail({ ...base, leadStatus: "unsubscribed" }).allowed).toBe(false);
  });

  it("blocks do_not_contact lead", () => {
    expect(canSendCommercialEmail({ ...base, leadStatus: "do_not_contact" }).allowed).toBe(false);
  });

  it("blocks a public email address without recorded consent or customer evidence", () => {
    expect(canSendCommercialEmail(base).allowed).toBe(false);
  });

  it("keeps tenant decisions isolated by accepting only provided tenant evidence", () => {
    const otherTenantConsent = [] as CommercialEmailDecisionInput["consentEvents"];
    expect(canSendCommercialEmail({ ...base, consentEvents: otherTenantConsent }).allowed).toBe(false);
  });
});
