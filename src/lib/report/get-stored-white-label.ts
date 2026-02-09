import { prisma } from "@/lib/prisma";
import type { StoredWhiteLabelSettings } from "./resolve-white-label";

/**
 * Fetch stored white-label settings from Prisma for a given user.
 * Returns undefined if no settings exist.
 */
export async function getStoredWhiteLabel(userId: string): Promise<StoredWhiteLabelSettings | undefined> {
  const wl = await prisma.whiteLabel.findUnique({
    where: { userId },
  });

  if (!wl) return undefined;

  return {
    logoUrl: wl.logoUrl ?? undefined,
    faviconUrl: wl.faviconUrl ?? undefined,
    primaryColor: wl.primaryColor ?? undefined,
    companyName: wl.companyName ?? undefined,
    showVexNexaBranding: wl.showPoweredBy,
    footerText: wl.footerText ?? undefined,
    supportEmail: wl.supportEmail ?? undefined,
  };
}
