import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as html } from "./[scanId]/html/route";
import { GET as printPdf } from "./[scanId]/pdf/route";
import { GET as word } from "./[scanId]/docx/route";
import { POST as legacyPdf } from "../export/pdf/route";
import { POST as legacyWord } from "../export/docx/route";
import { POST as simplePdf } from "../export/pdf-simple/route";
import { POST as enhancedPdf } from "../export/pdf-enhanced/route";
import { POST as beautifulPdf } from "../export/pdf-beautiful/route";
import { GET as combinedPdf } from "../export/combined-pdf/route";
import { POST as publicPdf } from "../export-pdf/route";
import { GET as adminPdf } from "../admin/download-report/route";

const m = vi.hoisted(() => ({
  auth: vi.fn(), getUser: vi.fn(), admin: vi.fn(), user: vi.fn(), scan: vi.fn(), ownedScan: vi.fn(),
  site: vi.fn(), settings: vi.fn(), usage: vi.fn(), addUsage: vi.fn(), render: vi.fn(), image: vi.fn(),
  pdf: vi.fn(), stream: vi.fn(), pack: vi.fn(), combined: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireAuth: m.auth, requireAdminAPI: m.admin }));
vi.mock("@/lib/supabase/server-new", () => ({ createClient: async () => ({ auth: { getUser: m.getUser } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: m.user }, scan: { findUnique: m.scan, findFirst: m.ownedScan },
  site: { findFirst: m.site }, whiteLabel: { findUnique: m.settings },
  usage: { findUnique: m.usage, create: m.usage, upsert: m.addUsage },
} }));
vi.mock("@/lib/report", async () => ({
  ...(await import("@/lib/report/transform")), ...(await import("@/lib/report/resolve-white-label")),
  ...(await import("@/lib/report/labels")), ...(await import("@/lib/report/image-dimensions")),
  renderReportHTML: m.render, fetchImageAsDataUrl: m.image, fetchImageAsBuffer: m.image,
}));
vi.mock("@/lib/pdf-generator", () => ({ PDFReport: () => null }));
vi.mock("@/lib/pdf-generator-combined", () => ({ CombinedPDFReport: () => null }));
vi.mock("@/lib/combined-report-generator", () => ({ generateCombinedReport: m.combined }));
vi.mock("@react-pdf/renderer", () => ({
  pdf: (element: unknown) => { m.pdf(element); return { toBuffer: async () => Buffer.from("mock PDF") }; },
  renderToStream: m.stream,
}));
vi.mock("docx", async () => ({ ...(await vi.importActual<typeof import("docx")>("docx")), Packer: { toBuffer: m.pack } }));
vi.mock("@/lib/analytics", () => ({
  calculateWCAGCompliance: () => 80, getScanTrendData: async () => [],
  getBenchmarkComparison: async () => ({ userScore: 82, industryAvg: 70, difference: 12, category: "above_average" }),
  getScanComparison: async () => ({ current: { id: "scan-fixture", score: 82 } }),
}));

const user = (plan = "BUSINESS", subscriptionStatus = "active") => ({
  id: "owner", plan, subscriptionStatus, addOns: [], subscriptionCurrentPeriodEnd: null, subscriptionCanceledAt: null,
});
const scan = () => ({
  id: "scan-fixture", siteId: "site-fixture", status: "COMPLETED", score: 82, issues: 0,
  impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0,
  raw: { violations: [] }, resultJson: null, createdAt: new Date("2026-01-02"),
  site: { url: "https://fixture.test", userId: "owner", user: { id: "owner" } }, page: null,
});
const settings = {
  userId: "owner", companyName: "Stored Agency", logoUrl: "data:image/png;base64,AA==",
  primaryColor: "#123456", secondaryColor: "#abcdef", footerText: "Private footer",
  showPoweredBy: false, supportEmail: "agency@example.test",
};
const overrides = "?company=Injected%20Agency&brandName=Injected%20Agency&branding=false&color=abcdef&logo=data:image/png;base64,AA==&footer=Injected%20footer&ctaText=Injected%20CTA&ctaUrl=https://agency.example&favicon=data:image/png;base64,AA==&siteId=site-fixture&scanId=scan-fixture";
const req = (method = "GET", body?: unknown) => new NextRequest(`https://app.example/api/export${overrides}`, {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "content-type": "application/json" } }),
});
const context = () => ({ params: Promise.resolve({ scanId: "scan-fixture" }) });
const routes = [
  ["HTML", () => html(req(), context()), false],
  ["print PDF", () => printPdf(req(), context()), false],
  ["DOCX", () => word(req(), context()), true],
  ["legacy PDF", () => legacyPdf(req("POST", { scanId: "scan-fixture" })), false],
  ["legacy DOCX", () => legacyWord(req("POST", { scanId: "scan-fixture" })), true],
  ["simple PDF", () => simplePdf(req("POST", { scanId: "scan-fixture" })), false],
  ["enhanced PDF", () => enhancedPdf(req("POST", { scanId: "scan-fixture" })), false],
  ["beautiful PDF", () => beautifulPdf(req("POST", { scanId: "scan-fixture" })), false],
  ["combined PDF", () => combinedPdf(req()), false],
  ["old public PDF", () => publicPdf(req("POST", { result: { scanId: "scan-fixture", score: 100, url: "https://injected.example", violations: [] } })), false],
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No external network permitted"); }));
  m.auth.mockResolvedValue({ id: "owner" });
  m.getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
  m.admin.mockResolvedValue({ id: "admin" });
  m.user.mockResolvedValue(user());
  m.scan.mockResolvedValue(scan());
  m.ownedScan.mockResolvedValue(scan());
  m.site.mockResolvedValue({ id: "site-fixture", userId: "owner", url: "https://fixture.test" });
  m.settings.mockResolvedValue(settings);
  m.usage.mockResolvedValue({ pages: 0, sites: 0 });
  m.addUsage.mockResolvedValue({ pages: 1 });
  m.render.mockImplementation(data => JSON.stringify(data));
  m.image.mockResolvedValue(null);
  m.pack.mockResolvedValue(Buffer.from("mock DOCX"));
  m.stream.mockImplementation(async function* () { yield Buffer.from("mock combined PDF"); });
  m.combined.mockResolvedValue({ site: { id: "site-fixture" } });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe.each(routes)("%s monetization and tenant boundary", (_name, invoke, isWord) => {
  it.each(["FREE", "PRO"])("does not expose query or saved branding to %s", async plan => {
    m.user.mockResolvedValue(user(plan));
    const response = await invoke();
    expect(response.status, JSON.stringify(vi.mocked(console.error).mock.calls, (_key, value) => value instanceof Error ? value.message : value)).toBe(plan === "FREE" && isWord ? 402 : 200);
    const body = await response.text();
    expect(body).not.toMatch(/Injected Agency|Stored Agency|Private footer|agency@example.test/);
    expect(response.headers.get("content-disposition") ?? "").not.toMatch(/stored-agency|Injected/);
    expect(m.settings).not.toHaveBeenCalled();
    expect(m.image).not.toHaveBeenCalled();
    for (const [element] of m.pdf.mock.calls) expect(element.props).toMatchObject({ brandName: "VexNexa", showPoweredBy: true });
    for (const [element] of m.stream.mock.calls) expect(element.props.brandName).toBe("VexNexa");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps active Agency branding authorized and scoped to the requester", async () => {
    expect((await invoke()).status, JSON.stringify(vi.mocked(console.error).mock.calls, (_key, value) => value instanceof Error ? value.message : value)).toBe(200);
    expect(m.settings).toHaveBeenCalledWith({ where: { userId: "owner" } });
    expect(m.pdf.mock.calls.length + m.stream.mock.calls.length + m.render.mock.calls.length + m.pack.mock.calls.length + m.addUsage.mock.calls.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["past_due", "failed", "canceled"])("blocks %s before rendering or loading branding", async status => {
    m.user.mockResolvedValue(user("BUSINESS", status));
    const response = await invoke();
    expect(response.status).toBe(402);
    expect(await response.json()).toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
    expect(m.settings).not.toHaveBeenCalled();
    expect(m.render).not.toHaveBeenCalled();
    expect(m.pdf).not.toHaveBeenCalled();
    expect(m.pack).not.toHaveBeenCalled();
    expect(m.stream).not.toHaveBeenCalled();
    expect(m.addUsage).not.toHaveBeenCalled();
  });
  it("rejects another tenant's scan/site before rendering or branding", async () => {
    m.scan.mockResolvedValue({ ...scan(), site: { ...scan().site, userId: "other-owner" } });
    m.ownedScan.mockResolvedValue(null);
    m.site.mockResolvedValue(null);
    expect([403, 404]).toContain((await invoke()).status);
    expect(m.settings).not.toHaveBeenCalled();
    expect(m.render).not.toHaveBeenCalled();
    expect(m.pdf).not.toHaveBeenCalled();
    expect(m.pack).not.toHaveBeenCalled();
  });
});

describe("legacy and administrator entry points", () => {
  it("ignores forged evidence in the legacy public request", async () => {
    expect((await publicPdf(req("POST", { result: { scanId: "scan-fixture", score: 100, url: "https://injected.example", violations: [] } }))).status).toBe(200);
    expect(m.pdf.mock.calls[0][0].props.scanData).toMatchObject({ score: 82, url: "https://fixture.test" });
    expect(m.ownedScan).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "scan-fixture", site: { OR: expect.arrayContaining([{ userId: "owner" }]) } }) }));
  });
  it("preserves direct scanId compatibility while requiring authentication", async () => {
    expect((await publicPdf(req("POST", { scanId: "scan-fixture" }))).status).toBe(200);
    m.auth.mockRejectedValue(new Error("Authentication required"));
    expect((await publicPdf(req("POST", { scanId: "scan-fixture" }))).status).toBe(401);
  });
  it.each([{}, { result: {} }, { scanId: 12 }])("rejects legacy requests lacking a stored scan reference: %j", async body => {
    expect((await publicPdf(req("POST", body))).status).toBe(400);
    expect(m.pdf).not.toHaveBeenCalled();
  });
  it("checks the scan owner's entitlement for admin downloads", async () => {
    m.user.mockResolvedValue(user("PRO"));
    expect((await adminPdf(req())).status).toBe(200);
    expect(m.admin).toHaveBeenCalledOnce();
    expect(m.user).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "owner" } }));
    expect(m.settings).not.toHaveBeenCalled();
    expect(m.pdf.mock.calls[0][0].props).toMatchObject({ brandName: "VexNexa", showPoweredBy: true });
  });
  it("blocks an inactive owner's admin export rather than applying stale branding", async () => {
    m.user.mockResolvedValue(user("BUSINESS", "failed"));
    expect((await adminPdf(req())).status).toBe(402);
    expect(m.pdf).not.toHaveBeenCalled();
    expect(m.settings).not.toHaveBeenCalled();
  });
});
