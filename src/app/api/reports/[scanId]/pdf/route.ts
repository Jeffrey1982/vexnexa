import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { transformScanToReport, renderReportHTML } from "@/lib/report";
import type { ReportStyle } from "@/lib/report";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<Response> {
  const { scanId } = await params;

  try {
    console.log(`[reports/pdf] START scan=${scanId}`);

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[reports/pdf] AUTH OK user=${user.id}`);

    // Fetch scan
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: true,
        page: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Check ownership
    if (scan.site.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log(`[reports/pdf] SCAN FOUND score=${scan.score} issues=${scan.issues}`);

    // Parse optional white-label config from query params
    const url = new URL(req.url);
    const wlLogo: string = url.searchParams.get("logo") ?? "";
    const wlColor: string = url.searchParams.get("color") ?? "";
    const wlCompany: string = url.searchParams.get("company") ?? "";
    const wlBranding: boolean = url.searchParams.get("branding") !== "false";
    const styleParam: string = url.searchParams.get("reportStyle") ?? "premium";
    const ctaUrl: string = url.searchParams.get("ctaUrl") ?? "";
    const ctaText: string = url.searchParams.get("ctaText") ?? "";
    const supportEmail: string = url.searchParams.get("supportEmail") ?? "";

    // Transform scan data to report
    console.log(`[reports/pdf] TRANSFORMING...`);
    let reportData;
    try {
      reportData = transformScanToReport(
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
        (styleParam === "corporate" ? "corporate" : "premium") as ReportStyle
      );
    } catch (transformErr: unknown) {
      const tMsg = transformErr instanceof Error ? transformErr.message : "unknown";
      console.error(`[reports/pdf] TRANSFORM FAILED: ${tMsg}`, transformErr);
      return NextResponse.json({ error: `Transform failed: ${tMsg}` }, { status: 500 });
    }
    console.log(`[reports/pdf] TRANSFORM OK domain=${reportData.domain} style=${reportData.reportStyle}`);

    // Render v2 HTML
    let html: string;
    try {
      html = renderReportHTML(reportData);
    } catch (renderErr: unknown) {
      const rMsg = renderErr instanceof Error ? renderErr.message : "unknown";
      console.error(`[reports/pdf] RENDER FAILED: ${rMsg}`, renderErr);
      return NextResponse.json({ error: `Render failed: ${rMsg}` }, { status: 500 });
    }
    console.log(`[reports/pdf] RENDER OK html=${html.length} chars, returning v2 HTML for print`);

    // Return v2 HTML — client opens in new tab and triggers window.print()
    // (puppeteer-core is not installed, so server-side PDF generation is not available)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Report-Version": "v2",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    console.error(`[reports/pdf] OUTER ERROR: ${message}\n${stack}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
