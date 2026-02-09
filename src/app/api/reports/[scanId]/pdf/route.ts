import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<Response> {
  const { scanId } = await params;

  try {
    const { createClient } = await import("@/lib/supabase/server-new");
    const { prisma } = await import("@/lib/prisma");
    const {
      transformScanToReport,
      renderReportHTML,
      resolveWhiteLabelConfig,
      extractQueryOverrides,
      fetchImageAsDataUrl,
    } = await import("@/lib/report");

    // Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch scan
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

    // Resolve white-label config (query params > stored > defaults)
    const url = new URL(req.url);
    const qp = extractQueryOverrides(url);
    const resolved = resolveWhiteLabelConfig(qp);

    // Embed logo as data URL so it renders in print/PDF
    if (resolved.whiteLabelConfig.logoUrl) {
      const dataUrl = await fetchImageAsDataUrl(resolved.whiteLabelConfig.logoUrl);
      if (dataUrl) resolved.whiteLabelConfig.logoUrl = dataUrl;
    }

    // Transform + render
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
      resolved.themeConfig,
      resolved.whiteLabelConfig,
      resolved.ctaConfig,
      resolved.reportStyle
    );

    const html: string = renderReportHTML(reportData);

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
    console.error(`[reports/pdf] ERROR: ${message}\n${stack}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
