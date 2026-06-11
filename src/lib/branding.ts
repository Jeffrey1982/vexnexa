import { prisma } from "@/lib/prisma";
import { ENTITLEMENTS } from "@/lib/billing/plans";

/**
 * Resolved branding for the dashboard shell. Defaults to VexNexa branding;
 * switches to the customer's white-label identity when their plan includes it
 * and they configured one under /settings/white-label.
 */
export interface Branding {
  isWhiteLabel: boolean;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail: string | null;
  footerText: string | null;
  showPoweredBy: boolean;
}

export const DEFAULT_BRANDING: Branding = {
  isWhiteLabel: false,
  companyName: "VexNexa",
  logoUrl: null,
  primaryColor: "#1F4A2D",
  secondaryColor: "#143521",
  accentColor: "#E8F0EA",
  supportEmail: null,
  footerText: null,
  showPoweredBy: true,
};

export async function getBranding(userId: string, plan?: string | null): Promise<Branding> {
  try {
    const entitlements = ENTITLEMENTS[(plan ?? "FREE") as keyof typeof ENTITLEMENTS] ?? ENTITLEMENTS.FREE;
    if (!("whiteLabel" in entitlements) || !entitlements.whiteLabel) {
      return DEFAULT_BRANDING;
    }

    const wl = await prisma.whiteLabel.findUnique({ where: { userId } });
    if (!wl || (!wl.companyName && !wl.logoUrl)) {
      return DEFAULT_BRANDING;
    }

    return {
      isWhiteLabel: true,
      companyName: wl.companyName || DEFAULT_BRANDING.companyName,
      logoUrl: wl.logoUrl,
      primaryColor: wl.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: wl.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      accentColor: wl.accentColor || DEFAULT_BRANDING.accentColor,
      supportEmail: wl.supportEmail,
      footerText: wl.footerText,
      showPoweredBy: wl.showPoweredBy !== false,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}
