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

  it.each(["nl", "en", "de"])("promotes only the paid agency offering in %s", (locale) => {
    const message = buildNurtureMessage({ step: 3, locale, domain: "example.nl", score: null, totalIssues: null, appUrl: "https://app.example" });
    expect(message.body).toContain("https://app.example/for-agencies?utm_source=nurture&utm_campaign=agency");
    expect(message.body).toContain("white-label");
    expect(message.body).toContain(locale === "nl" ? "betaalde Agency-plan" : "paid Agency plan");
    expect(message.body).toContain(locale === "nl" ? "menselijke beoordeling en herstel blijven nodig" : "human review and remediation remain necessary");
    expect(message.body).toContain(locale === "nl" ? "garanderen geen volledige toegankelijkheid of wettelijke naleving" : "do not find every issue or guarantee full accessibility or legal compliance");
    expect(`${message.subject} ${message.body}`).not.toMatch(/founding|pilot|gratis|\bfree\b|12 maanden|12 months|30%/i);
  });

  it.each(["nl", "en"])("labels scan findings as partial automated evidence in %s", (locale) => {
    const message = buildNurtureMessage({ step: 1, locale, domain: "example.nl", score: null, totalIssues: null, appUrl: "https://app.example" });
    expect(message.body).toContain(locale === "nl" ? "geen volledige audit" : "not a complete audit");
    expect(message.body).not.toMatch(/\d+\/100|\d+ (?:gevonden problemen|detected issues)/);
  });

  it.each(["nl", "en"])("describes comparisons between scans without promising every release is monitored in %s", (locale) => {
    const message = buildNurtureMessage({ step: 2, locale, domain: "example.nl", score: 61, totalIssues: 12, appUrl: "https://app.example" });
    expect(message.body).toContain(locale === "nl" ? "opeenvolgende geautomatiseerde scans" : "successive automated scans");
    expect(message.body).toContain("/sample-report?utm_source=nurture&utm_campaign=evidence");
    expect(message.body).not.toMatch(/elke release|each release|founding|pilot/i);
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

