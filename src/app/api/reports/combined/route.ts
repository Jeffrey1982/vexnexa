import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCombinedReport } from "@/lib/combined-report-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/combined - Get combined automated + manual report
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const scanId = searchParams.get("scanId") || undefined;
    const auditId = searchParams.get("auditId") || undefined;

    if (!siteId) {
      return NextResponse.json(
        { ok: false, error: "siteId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: user.id
      }
    });

    if (!site) {
      return NextResponse.json(
        { ok: false, error: "Site not found or access denied" },
        { status: 404 }
      );
    }

    const report = await generateCombinedReport(siteId, scanId, auditId);

    if (!report) {
      return NextResponse.json(
        { ok: false, error: "Unable to generate report" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, report });
  } catch (e: any) {
    console.error("Failed to generate combined report:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
