import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<Response> {
  const { scanId } = await params;
  const steps: string[] = [];

  try {
    steps.push("1-start");

    const supabase = await createClient();
    steps.push("2-supabase-created");

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ steps, error: "Unauthorized", authError: authError?.message }, { status: 401 });
    }
    steps.push(`3-auth-ok user=${user.id}`);

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { site: true, page: true },
    });
    if (!scan) {
      return NextResponse.json({ steps, error: "Scan not found" }, { status: 404 });
    }
    steps.push(`4-scan-found score=${scan.score}`);

    if (scan.site.userId !== user.id) {
      return NextResponse.json({ steps, error: "Forbidden" }, { status: 403 });
    }
    steps.push("5-ownership-ok");

    // Try importing transform
    const { transformScanToReport } = await import("@/lib/report");
    steps.push("6-import-transform-ok");

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
      { logoUrl: "", showVexNexaBranding: true },
      {},
      "premium" as const
    );
    steps.push(`7-transform-ok domain=${reportData.domain}`);

    const { renderReportHTML } = await import("@/lib/report");
    steps.push("8-import-render-ok");

    const html = renderReportHTML(reportData);
    steps.push(`9-render-ok length=${html.length}`);

    return NextResponse.json({ steps, ok: true, htmlLength: html.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    return NextResponse.json({ steps, error: message, stack }, { status: 500 });
  }
}
