import type { WhiteLabelConfig, ReportThemeConfig, CTAConfig, ReportStyle } from "./types";
import { DEFAULT_WHITE_LABEL, DEFAULT_THEME, DEFAULT_CTA } from "./types";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

/** Raw query-param overrides from the request URL */
export interface QueryParamOverrides {
  logo?: string;
  color?: string;
  company?: string;
  branding?: string;       // "false" to disable VexNexa branding
  favicon?: string;
  reportStyle?: string;
  ctaUrl?: string;
  ctaText?: string;
  supportEmail?: string;
}

/** Stored white-label settings (per user / workspace) */
export interface StoredWhiteLabelSettings {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  companyName?: string;
  showVexNexaBranding?: boolean;
  footerText?: string;
  ctaUrl?: string;
  ctaText?: string;
  supportEmail?: string;
}

/** Fully resolved config ready for report rendering */
export interface ResolvedWhiteLabel {
  whiteLabelConfig: WhiteLabelConfig;
  themeConfig: ReportThemeConfig;
  ctaConfig: CTAConfig;
  reportStyle: ReportStyle;
  faviconUrl: string;
}

/* ═══════════════════════════════════════════════════════════
   Validation helpers
   ═══════════════════════════════════════════════════════════ */

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Validate hex color, return undefined if invalid */
export function validateHex(color: string | undefined | null): string | undefined {
  if (!color) return undefined;
  const c = color.startsWith("#") ? color : `#${color}`;
  return HEX_RE.test(c) ? c : undefined;
}

/** Allowed hosts for image fetching (SSRF protection) */
const ALLOWED_IMAGE_HOSTS: string[] = [
  "localhost",
  "127.0.0.1",
  "vexnexa.com",
  "www.vexnexa.com",
  "zoljdbuiphzlsqzxdxyy.supabase.co",  // Supabase storage
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "cdn.jsdelivr.net",
  "i.imgur.com",
  "res.cloudinary.com",
];

/** Validate URL is http(s) and on an allowed host */
export function validateImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    const host = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_IMAGE_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
    return isAllowed ? url : "";
  } catch {
    return "";
  }
}

/* ═══════════════════════════════════════════════════════════
   Resolver: query params > stored settings > defaults
   ═══════════════════════════════════════════════════════════ */

export function resolveWhiteLabelConfig(
  queryParams: QueryParamOverrides,
  storedSettings?: StoredWhiteLabelSettings,
): ResolvedWhiteLabel {
  const stored = storedSettings ?? {};

  // Priority: query param > stored > default
  const logoUrl = validateImageUrl(queryParams.logo) || validateImageUrl(stored.logoUrl) || DEFAULT_WHITE_LABEL.logoUrl;
  const primaryColor = validateHex(queryParams.color) || validateHex(stored.primaryColor) || DEFAULT_WHITE_LABEL.primaryColor;
  const companyName = queryParams.company || stored.companyName || DEFAULT_WHITE_LABEL.companyNameOverride;
  const faviconUrl = validateImageUrl(queryParams.favicon) || validateImageUrl(stored.faviconUrl) || "";
  const footerText = stored.footerText || DEFAULT_WHITE_LABEL.footerText;

  const showBranding = queryParams.branding === "false"
    ? false
    : stored.showVexNexaBranding ?? DEFAULT_WHITE_LABEL.showVexNexaBranding;

  const reportStyle: ReportStyle =
    queryParams.reportStyle === "corporate" ? "corporate" : "premium";

  const ctaUrl = queryParams.ctaUrl || stored.ctaUrl || DEFAULT_CTA.ctaUrl;
  const ctaText = queryParams.ctaText || stored.ctaText || DEFAULT_CTA.ctaText;
  const supportEmail = queryParams.supportEmail || stored.supportEmail || DEFAULT_CTA.supportEmail;

  const whiteLabelConfig: WhiteLabelConfig = {
    showVexNexaBranding: showBranding,
    logoUrl,
    primaryColor,
    footerText,
    companyNameOverride: companyName,
  };

  const themeConfig: ReportThemeConfig = {
    ...DEFAULT_THEME,
    primaryColor,
  };

  const ctaConfig: CTAConfig = {
    ctaUrl,
    ctaText,
    supportEmail,
  };

  return { whiteLabelConfig, themeConfig, ctaConfig, reportStyle, faviconUrl };
}

/* ═══════════════════════════════════════════════════════════
   Extract query params from a URL
   ═══════════════════════════════════════════════════════════ */

export function extractQueryOverrides(url: URL): QueryParamOverrides {
  return {
    logo: url.searchParams.get("logo") ?? undefined,
    color: url.searchParams.get("color") ?? undefined,
    company: url.searchParams.get("company") ?? undefined,
    branding: url.searchParams.get("branding") ?? undefined,
    favicon: url.searchParams.get("favicon") ?? undefined,
    reportStyle: url.searchParams.get("reportStyle") ?? undefined,
    ctaUrl: url.searchParams.get("ctaUrl") ?? undefined,
    ctaText: url.searchParams.get("ctaText") ?? undefined,
    supportEmail: url.searchParams.get("supportEmail") ?? undefined,
  };
}
