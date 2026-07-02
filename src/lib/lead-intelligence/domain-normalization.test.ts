import { describe, expect, it } from "vitest";
import { normalizeDomain, normalizeEmail } from "./domain-normalization";

describe("normalizeDomain", () => {
  it.each([
    ["https://www.example.com/", "example.com"],
    ["http://example.com/path", "example.com"],
    ["example.com", "example.com"],
    ["subdomain.example.com", "subdomain.example.com"],
    ["EXAMPLE.COM", "example.com"],
    ["https://www.example.com/path?utm=1#section", "example.com"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it("rejects malformed domains", () => {
    expect(() => normalizeDomain("not a domain")).toThrow();
    expect(() => normalizeDomain("user@example.com")).toThrow();
    expect(() => normalizeDomain("localhost")).toThrow();
  });

  it("does not merge meaningful subdomains", () => {
    expect(normalizeDomain("app.example.com")).toBe("app.example.com");
    expect(normalizeDomain("example.com")).toBe("example.com");
  });
});

describe("normalizeEmail", () => {
  it("lowercases and validates email addresses", () => {
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
  });
});
