import { describe, expect, it } from "vitest";
import { buildNurtureMessage, selectDueNurtureStep } from "./nurture";
import { canSendCommercialEmail } from "./outreach-eligibility";

describe("lead nurture sequence", () => {
  const consentedAt = new Date("2026-07-01T10:00:00Z");

  it("makes step one due immediately and respects later delays", () => {
    expect(selectDueNurtureStep({ consentedAt, sentSteps: [], now: consentedAt })).toBe(1);
    expect(selectDueNurtureStep({ consentedAt, sentSteps: [1], now: new Date("2026-07-03T10:00:00Z") })).toBeNull();
    expect(selectDueNurtureStep({ consentedAt, sentSteps: [1], now: new Date("2026-07-04T10:00:00Z") })).toBe(2);
    expect(selectDueNurtureStep({ consentedAt, sentSteps: [1, 2], now: new Date("2026-07-09T10:00:00Z") })).toBe(3);
  });

  it("uses only stored scan facts in copy", () => {
    const message = buildNurtureMessage({ step: 1, locale: "nl", domain: "example.nl", score: 61, totalIssues: 12, appUrl: "https://vexnexa.com" });
    expect(message.body).toContain("61/100");
    expect(message.body).toContain("12 gevonden problemen");
  });
});

describe("contact-scoped consent", () => {
  it("does not reuse one contact's commercial consent for another contact", () => {
    const decision = canSendCommercialEmail({
      contactId: "contact-b",
      contactEmail: "b@example.nl",
      organizationDomain: "example.nl",
      leadStatus: "opted_in",
      consentEvents: [{
        contactId: "contact-a",
        consentType: "commercial_outreach",
        status: "active",
        evidence: { confirmedAt: "2026-07-01" },
      }],
    });
    expect(decision.allowed).toBe(false);
  });
});

