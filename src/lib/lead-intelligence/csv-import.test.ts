import { describe, expect, it } from "vitest";
import { planCsvLeadImport } from "./csv-import";

const header = "company_name,website_url,country_code,industry,source_url,contact_email";

describe("planCsvLeadImport", () => {
  it("validates and normalizes rows", () => {
    const plan = planCsvLeadImport(
      `${header}\nExample,https://www.example.com/path,NL,Agency,https://source.test,HELLO@EXAMPLE.COM`,
    );

    expect(plan.invalidRows).toEqual([]);
    expect(plan.rows[0]).toMatchObject({
      normalized_domain: "example.com",
      normalized_email: "hello@example.com",
      country_code: "NL",
    });
  });

  it("deduplicates organizations by normalized domain and contacts by email", () => {
    const plan = planCsvLeadImport(
      `${header}\nExample,https://www.example.com,NL,Agency,,hello@example.com\nExample Again,http://example.com/path,NL,Agency,,hello@example.com`,
    );

    expect(plan.summary.created).toBe(1);
    expect(plan.summary.updated).toBe(1);
    expect(plan.summary.skipped).toBe(1);
  });

  it("rejects dangerous spreadsheet formulas", () => {
    const plan = planCsvLeadImport(`${header}\n=cmd,https://example.com,NL,Agency,,hello@example.com`);
    expect(plan.summary.invalid).toBe(1);
  });

  it("rejects malformed domains and email addresses", () => {
    const plan = planCsvLeadImport(
      `${header}\nBad Domain,not a domain,NL,Agency,,hello@example.com\nBad Email,https://example.com,NL,Agency,,not-an-email`,
    );

    expect(plan.summary.invalid).toBe(2);
  });

  it("rejects missing required columns", () => {
    expect(() => planCsvLeadImport("company_name,website_url\nExample,https://example.com")).toThrow(
      /missing required columns/i,
    );
  });

  it("rejects oversized files", () => {
    const hugeValue = "a".repeat(512_001);
    expect(() => planCsvLeadImport(`${header}\n${hugeValue},https://example.com,NL,Agency,,hello@example.com`)).toThrow(
      /too large/i,
    );
  });

  it("rejects excessive row counts", () => {
    const rows = Array.from({ length: 1_001 }, (_, index) => `Company ${index},https://example-${index}.com,NL,Agency,,`);
    expect(() => planCsvLeadImport(`${header}\n${rows.join("\n")}`)).toThrow(/too many rows/i);
  });

  it("does not mark imported public emails eligible for outreach", () => {
    const plan = planCsvLeadImport(`${header}\nExample,https://example.com,NL,Agency,,public@example.com`);
    expect(plan.rows[0]?.normalized_email).toBe("public@example.com");
    expect(plan.summary.created).toBe(1);
  });
});
