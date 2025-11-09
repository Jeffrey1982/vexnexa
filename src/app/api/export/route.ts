import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const {
      format = "csv",
      siteId,
      crawlId,
      dateRange,
      includeFields = ["basic"]
    } = await req.json();

    // Validate format
    if (!["csv", "excel"].includes(format)) {
      return NextResponse.json({ ok: false, error: "Invalid format. Use 'csv' or 'excel'" }, { status: 400 });
    }

    // Build query conditions
    const whereConditions: any = {};

    if (siteId) {
      // Verify site ownership
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: user.id }
      });
      if (!site) {
        return NextResponse.json({ ok: false, error: "Site not found or access denied" }, { status: 404 });
      }
      whereConditions.siteId = siteId;
    } else {
      // Only include user's sites
      whereConditions.site = { userId: user.id };
    }

    if (crawlId) {
      // Verify crawl ownership
      const crawl = await prisma.crawl.findFirst({
        where: {
          id: crawlId,
          site: { userId: user.id }
        }
      });
      if (!crawl) {
        return NextResponse.json({ ok: false, error: "Crawl not found or access denied" }, { status: 404 });
      }
      whereConditions.id = { in: await getCrawlScanIds(crawlId) };
    }

    if (dateRange) {
      const { startDate, endDate } = dateRange;
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Determine which fields to include
    const basicFields = [
      "id", "createdAt", "score", "issues",
      "impactCritical", "impactSerious", "impactModerate", "impactMinor"
    ];

    const enhancedFields = [
      "wcagAACompliance", "wcagAAACompliance",
      "performanceScore", "seoScore", "adaRiskLevel"
    ];

    const detailedFields = [
      "firstContentfulPaint", "largestContentfulPaint",
      "cumulativeLayoutShift", "metaDescription", "headingStructure"
    ];

    let selectFields: any = { id: true };

    if (includeFields.includes("basic")) {
      basicFields.forEach(field => selectFields[field] = true);
    }
    if (includeFields.includes("enhanced")) {
      enhancedFields.forEach(field => selectFields[field] = true);
    }
    if (includeFields.includes("detailed")) {
      detailedFields.forEach(field => selectFields[field] = true);
    }

    // Always include site and page info
    selectFields.site = { select: { url: true } };
    selectFields.page = { select: { url: true, title: true } };

    // Fetch scans
    const scans = await prisma.scan.findMany({
      where: whereConditions,
      select: selectFields,
      orderBy: { createdAt: "desc" },
      take: 10000 // Limit for performance
    });

    if (scans.length === 0) {
      return NextResponse.json({ ok: false, error: "No scans found for export" }, { status: 404 });
    }

    // Generate export data
    if (format === "csv") {
      const csvData = generateCSV(scans);

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="vexnexa-scans-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Excel format (simplified JSON for now, in production you'd use a library like xlsx)
      return NextResponse.json({
        ok: true,
        data: scans,
        filename: `vexnexa-scans-${new Date().toISOString().split('T')[0]}.json`,
        format: "json",
        message: "Excel export available as JSON format for now"
      });
    }

  } catch (e: any) {
    console.error("Export failed:", e);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Export failed"
    }, { status: 500 });
  }
}

async function getCrawlScanIds(crawlId: string): Promise<string[]> {
  const crawlUrls = await prisma.crawlUrl.findMany({
    where: { crawlId, status: "done" },
    select: { url: true }
  });

  const scanIds: string[] = [];
  for (const crawlUrl of crawlUrls) {
    const scans = await prisma.scan.findMany({
      where: {
        page: { url: crawlUrl.url }
      },
      select: { id: true }
    });
    scanIds.push(...scans.map(s => s.id));
  }

  return scanIds;
}

function generateCSV(scans: any[]): string {
  if (scans.length === 0) return "";

  // Create header row
  const headers = [
    "Scan ID",
    "Site URL",
    "Page URL",
    "Page Title",
    "Scan Date",
    "Accessibility Score",
    "Total Issues",
    "Critical Issues",
    "Serious Issues",
    "Moderate Issues",
    "Minor Issues",
    "WCAG AA Compliance (%)",
    "WCAG AAA Compliance (%)",
    "Performance Score",
    "SEO Score",
    "ADA Risk Level"
  ];

  // Create data rows
  const rows = scans.map(scan => [
    scan.id,
    scan.site?.url || "",
    scan.page?.url || "",
    scan.page?.title || "",
    new Date(scan.createdAt).toISOString().split('T')[0],
    scan.score || 0,
    scan.issues || 0,
    scan.impactCritical || 0,
    scan.impactSerious || 0,
    scan.impactModerate || 0,
    scan.impactMinor || 0,
    scan.wcagAACompliance ? Math.round(scan.wcagAACompliance) : "",
    scan.wcagAAACompliance ? Math.round(scan.wcagAAACompliance) : "",
    scan.performanceScore ? Math.round(scan.performanceScore) : "",
    scan.seoScore ? Math.round(scan.seoScore) : "",
    scan.adaRiskLevel || ""
  ]);

  // Convert to CSV format
  const csvContent = [headers, ...rows]
    .map(row => row.map(field =>
      // Escape quotes and wrap in quotes if contains comma/quote/newline
      typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
        ? `"${field.replace(/"/g, '""')}"`
        : field
    ).join(','))
    .join('\n');

  return csvContent;
}