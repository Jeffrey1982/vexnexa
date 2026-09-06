import { prisma } from "@/lib/prisma";
import { assertWithinLimits } from "@/lib/billing/entitlements";
import type { WhiteLabel } from "@prisma/client";
import { resolveWhiteLabelConfig, type QueryParamOverrides, type StoredWhiteLabelSettings } from "./resolve-white-label";

async function loadAuthorizedWhiteLabel(userId: string) {
  try {
    await assertWithinLimits({ userId, action: "white_label" });
  } catch (error) {
    const denied = error as { code?: string; feature?: string };
    // Only a missing branding feature falls back to VexNexa. Inactive billing,
    // unknown accounts and infrastructure failures must continue to fail closed.
    if (denied?.code === "UPGRADE_REQUIRED" && denied.feature === "whiteLabel") {
      return { allowed: false, settings: null } as const;
    }
    throw error;
  }
  const settings = await prisma.whiteLabel.findUnique({ where: { userId } });
  return { allowed: true, settings } as const;
}

/** Legacy renderers use the raw settings, but never without current entitlement. */
export async function getExportWhiteLabel(userId: string): Promise<WhiteLabel | null> {
  return (await loadAuthorizedWhiteLabel(userId)).settings;
}

function toStoredSettings(wl: WhiteLabel | null): StoredWhiteLabelSettings | undefined {
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

/** Check billing before allowing either query overrides or stored branding. */
export async function resolveExportWhiteLabel(userId: string, query: QueryParamOverrides) {
  const { allowed, settings } = await loadAuthorizedWhiteLabel(userId);
  return resolveWhiteLabelConfig(
    allowed ? query : { reportStyle: query.reportStyle },
    allowed ? toStoredSettings(settings) : { companyName: "VexNexa", showVexNexaBranding: true },
  );
}

/**
 * Fetch stored white-label settings from Prisma for a given user.
 * Returns undefined if no settings exist.
 */
export async function getStoredWhiteLabel(userId: string): Promise<StoredWhiteLabelSettings | undefined> {
  return toStoredSettings(await getExportWhiteLabel(userId));
}
