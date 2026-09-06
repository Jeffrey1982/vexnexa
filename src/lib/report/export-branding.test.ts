import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getExportWhiteLabel, getStoredWhiteLabel, resolveExportWhiteLabel } from "./get-stored-white-label";
import { DEFAULT_CTA, DEFAULT_WHITE_LABEL } from "./types";
import { exportAccessErrorResponse } from "./export-error";

const m = vi.hoisted(() => ({ user: vi.fn(), settings: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.user }, whiteLabel: { findUnique: m.settings } } }));
const identity = {
  userId: "owner", companyName: "Stored Agency", logoUrl: "data:image/png;base64,AA==",
  faviconUrl: "data:image/png;base64,AQ==", primaryColor: "#112233", showPoweredBy: false,
  footerText: "Private footer", supportEmail: "support@example.test",
};
const query = {
  company: "Injected Agency", logo: "data:image/png;base64,Ag==", favicon: "data:image/png;base64,Aw==",
  color: "abcdef", branding: "false", footer: "Injected footer", ctaUrl: "https://agency.example",
  ctaText: "Agency CTA", supportEmail: "injected@example.test", reportStyle: "premium",
};
const user = (plan = "BUSINESS", subscriptionStatus = "active") => ({
  id: "owner", plan, subscriptionStatus, addOns: [],
  subscriptionCurrentPeriodEnd: null, subscriptionCanceledAt: null,
});
beforeEach(() => {
  vi.resetAllMocks();
  m.user.mockResolvedValue(user());
  m.settings.mockResolvedValue(identity);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network forbidden in branding tests"); }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("export branding uses current central entitlements", () => {
  it.each(["FREE", "STARTER", "PRO"])("ignores query and stored branding on %s without loading private assets", async plan => {
    m.user.mockResolvedValue(user(plan));
    const resolved = await resolveExportWhiteLabel("owner", query);
    expect(resolved.whiteLabelConfig).toEqual({ ...DEFAULT_WHITE_LABEL, companyNameOverride: "VexNexa", showVexNexaBranding: true });
    expect(resolved.ctaConfig).toEqual(DEFAULT_CTA);
    expect(resolved.faviconUrl).toBe("");
    expect(resolved.reportStyle).toBe("premium");
    expect(await getExportWhiteLabel("owner")).toBeNull();
    expect(await getStoredWhiteLabel("owner")).toBeUndefined();
    expect(m.settings).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["BUSINESS", "PIONEER", "ENTERPRISE"])("preserves authorized stored and query branding on active %s (BUSINESS is Agency)", async plan => {
    m.user.mockResolvedValue(user(plan));
    const stored = await resolveExportWhiteLabel("owner", {});
    expect(stored.whiteLabelConfig).toMatchObject({ companyNameOverride: "Stored Agency", showVexNexaBranding: false, primaryColor: "#112233" });
    const overridden = await resolveExportWhiteLabel("owner", query);
    expect(overridden.whiteLabelConfig).toMatchObject({ companyNameOverride: "Injected Agency", showVexNexaBranding: false, primaryColor: "#abcdef", footerText: "Injected footer" });
    expect(overridden.ctaConfig.ctaUrl).toBe("https://agency.example");
    expect(await getExportWhiteLabel("owner")).toEqual(identity);
    expect(m.settings).toHaveBeenCalledWith({ where: { userId: "owner" } });
  });
  it("allows authorized query branding even before settings have been saved", async () => {
    m.settings.mockResolvedValue(null);
    expect((await resolveExportWhiteLabel("owner", query)).whiteLabelConfig.companyNameOverride).toBe("Injected Agency");
  });
  it.each(["past_due", "failed", "canceled", "pending", "none"])("does not downgrade blocked billing %s into a successful unbranded export", async status => {
    m.user.mockResolvedValue(user("BUSINESS", status));
    await expect(resolveExportWhiteLabel("owner", query)).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
    await expect(getExportWhiteLabel("owner")).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
    expect(m.settings).not.toHaveBeenCalled();
  });
  it("does not accept a caller's plan assertion instead of the database account", async () => {
    m.user.mockResolvedValue(user("PRO"));
    expect((await resolveExportWhiteLabel("owner", query)).whiteLabelConfig.companyNameOverride).toBe("VexNexa");
    expect(m.user).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "owner" } }));
  });
  it("propagates missing accounts and database failures", async () => {
    m.user.mockResolvedValue(null);
    await expect(getExportWhiteLabel("missing")).rejects.toThrow("User not found");
    m.user.mockRejectedValue(new Error("Billing unavailable"));
    await expect(resolveExportWhiteLabel("owner", query)).rejects.toThrow("Billing unavailable");
    expect(m.settings).not.toHaveBeenCalled();
  });
});

describe("export access responses", () => {
  it.each(["UPGRADE_REQUIRED", "SUBSCRIPTION_INACTIVE", "LIMIT_REACHED", "FREE_LIMIT_REACHED"])("returns structured %s", async code => {
    const error = Object.assign(new Error("Denied"), { code, feature: "word", subscriptionStatus: "past_due", limit: 1, current: 1 });
    const response = exportAccessErrorResponse(error)!;
    expect(response.status).toBe(code.endsWith("LIMIT_REACHED") ? 429 : 402);
    expect(await response.json()).toMatchObject({ error: "Denied", code, feature: "word", limit: 1, current: 1 });
  });
  it("distinguishes authentication from renderer failures", () => {
    expect(exportAccessErrorResponse(new Error("Authentication required"))?.status).toBe(401);
    expect(exportAccessErrorResponse(new Error("Renderer failed"))).toBeNull();
    expect(exportAccessErrorResponse(null)).toBeNull();
  });
});
