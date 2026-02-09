import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { transformScanToReport, renderReportHTML } from "@/lib/report";

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

    const { page: scanPage, site: scanSite, ...scanRest } = scan;
    const reportData = transformScanToReport(
      {
        id: scanRest.id,
        score: scanRest.score,
        issues: scanRest.issues,
        impactCritical: scanRest.impactCritical,
        impactSerious: scanRest.impactSerious,
        impactModerate: scanRest.impactModerate,
        impactMinor: scanRest.impactMinor,
        wcagAACompliance: (scanRest as Record<string, unknown>).wcagAACompliance as number | null | undefined,
        wcagAAACompliance: (scanRest as Record<string, unknown>).wcagAAACompliance as number | null | undefined,
        createdAt: scanRest.createdAt.toISOString(),
        raw: scanRest.raw,
        site: { url: scanSite.url },
        page: scanPage ? { url: scanPage.url, title: scanPage.title ?? undefined } : null,
      },
      undefined,
      {
        logoUrl: wlLogo,
        primaryColor: wlColor || undefined,
        companyNameOverride: wlCompany,
        showVexNexaBranding: wlBranding,
      }
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
