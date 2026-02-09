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
      (styleParam === "corporate" ? "corporate" : "bold") as ReportStyle
    );

    // Render HTML
    const html: string = renderReportHTML(reportData);

    // Try Puppeteer PDF generation
    try {
      const chromium = await import("@sparticuz/chromium").then((m) => m.default);
      const puppeteer = await import("puppeteer-core");

      const browser = await puppeteer.default.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      await browser.close();

      const filename = `accessibility-report-${scan.site.url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;

      return new Response(pdfUint8.buffer as ArrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (puppeteerError) {
      // Fallback: return HTML for client-side print
      console.error("[reports/pdf] Puppeteer failed, returning HTML:", puppeteerError);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Report-Fallback": "html",
        },
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[reports/pdf] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
