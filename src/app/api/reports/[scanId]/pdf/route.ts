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
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Parse optional white-label config from query params
    const url = new URL(req.url);
    const wlLogo: string = url.searchParams.get("logo") ?? "";
    const wlColor: string = url.searchParams.get("color") ?? "";
    const wlCompany: string = url.searchParams.get("company") ?? "";
    const wlBranding: boolean = url.searchParams.get("branding") !== "false";
    const styleParam: string = url.searchParams.get("reportStyle") ?? "bold";
    const ctaUrl: string = url.searchParams.get("ctaUrl") ?? "";
    const ctaText: string = url.searchParams.get("ctaText") ?? "";
    const supportEmail: string = url.searchParams.get("supportEmail") ?? "";

    // Transform scan data to report
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
      (styleParam === "corporate" ? "corporate" : "premium") as ReportStyle
    );

    // Render v2 HTML (render-html.ts output ONLY)
    const html: string = renderReportHTML(reportData);
    console.log(`[reports/pdf] Rendering v2 report for scan=${scanId} style=${styleParam}`);

    const filename = `accessibility-report-${scan.site.url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;

    // Try Puppeteer PDF generation
    try {
      const chromium = await import("@sparticuz/chromium").then((m) => m.default);
      const puppeteer = await import("puppeteer-core");

      const browser = await puppeteer.default.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 900 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      });

      await browser.close();
      console.log(`[reports/pdf] PDF generated, ${pdfUint8.byteLength} bytes`);

      return new Response(pdfUint8.buffer as ArrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (puppeteerError: unknown) {
      // Puppeteer unavailable on this environment — return v2 HTML for browser print
      const pMsg = puppeteerError instanceof Error ? puppeteerError.message : "unknown";
      console.warn(`[reports/pdf] Puppeteer unavailable (${pMsg}), returning v2 HTML for print`);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Report-Fallback": "html-v2",
        },
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[reports/pdf] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
