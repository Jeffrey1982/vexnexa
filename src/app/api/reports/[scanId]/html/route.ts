import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { transformScanToReport, renderReportHTML } from "@/lib/report";
import type { ReportStyle } from "@/lib/report";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<NextResponse> {
  const { scanId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { site: true, page: true },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    if (scan.site.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const wlLogo: string = url.searchParams.get("logo") ?? "";
    const wlColor: string = url.searchParams.get("color") ?? "";
    const wlCompany: string = url.searchParams.get("company") ?? "";
    const wlBranding: boolean = url.searchParams.get("branding") !== "false";
    const styleParam: string = url.searchParams.get("reportStyle") ?? "bold";
    const ctaUrl: string = url.searchParams.get("ctaUrl") ?? "";
    const ctaText: string = url.searchParams.get("ctaText") ?? "";
    const supportEmail: string = url.searchParams.get("supportEmail") ?? "";

    const reportData = transformScanToReport(
      {
        id: scan.id,
        score: scan.score,
        issues: scan.issues,
        impactCritical: scan.impactCritical,
        impactSerious: scan.impactSerious,
        impactModerate: scan.impactModerate,
        impactMinor: scan.impactMinor,
        wcagAACompliance: (scan as Record<string, unknown>).wcagAACompliance as number | null | undefined,
        wcagAAACompliance: (scan as Record<string, unknown>).wcagAAACompliance as number | null | undefined,
        createdAt: scan.createdAt.toISOString(),
        raw: scan.raw,
        site: { url: scan.site.url },
        page: scan.page ? { url: scan.page.url, title: scan.page.title ?? undefined } : null,
      },
      undefined,
      {
        logoUrl: wlLogo,
        primaryColor: wlColor || undefined,
        companyNameOverride: wlCompany,
        showVexNexaBranding: wlBranding,
      },
      {
        ctaUrl: ctaUrl || undefined,
        ctaText: ctaText || undefined,
        supportEmail: supportEmail || undefined,
      },
      (styleParam === "corporate" ? "corporate" : "bold") as ReportStyle
    );

    const html: string = renderReportHTML(reportData);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[reports/html] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
