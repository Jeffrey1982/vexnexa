import { NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getVniFromJson(value: unknown): { score: number | null; tier: string | null } {
  if (!value || typeof value !== "object") {
    return { score: null, tier: null };
  }

  const data = value as Record<string, any>;
  const vni = data.vni && typeof data.vni === "object" ? data.vni : data.result?.vni;
  const score = typeof vni?.score === "number" ? Math.round(vni.score) : null;
  const tier = typeof vni?.tier === "string" ? vni.tier : null;

  return { score, tier };
}

export async function GET() {
  try {
    await requireAdminAPI();

    const scans = await prisma.scan.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 75,
      include: {
        site: {
          select: {
            url: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        page: {
          select: { url: true },
        },
      },
    });

    const items = scans.map((scan) => {
      const resultVni = getVniFromJson(scan.resultJson);
      const rawVni = getVniFromJson(scan.raw);
      const vniScore = resultVni.score ?? rawVni.score;
      const vniTier = resultVni.tier ?? rawVni.tier;

      return {
        id: scan.id,
        url: scan.page?.url ?? scan.site.url,
        siteUrl: scan.site.url,
        status: scan.status,
        score: scan.score,
        issues: scan.issues,
        impactCritical: scan.impactCritical,
        impactSerious: scan.impactSerious,
        impactModerate: scan.impactModerate,
        impactMinor: scan.impactMinor,
        performanceScore: scan.performanceScore,
        scanDuration: scan.scanDuration,
        pageLoadTime: scan.pageLoadTime,
        elementsScanned: scan.elementsScanned,
        createdAt: scan.createdAt.toISOString(),
        user: {
          email: scan.site.user.email,
          name: [scan.site.user.firstName, scan.site.user.lastName].filter(Boolean).join(" ") || null,
        },
        vni: {
          score: vniScore,
          tier: vniTier,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      scans: items,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch admin scans:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch scans" }, { status: 500 });
  }
}
