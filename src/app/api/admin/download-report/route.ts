import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { requireAdminAPI } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PDFReport } from "@/lib/pdf-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAPI();

    const scanId = req.nextUrl.searchParams.get("scanId");
    if (!scanId) {
      return NextResponse.json({ error: "Missing scanId parameter" }, { status: 400 });
    }

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    let violations = [];
    if (scan.raw && typeof scan.raw === "object" && "violations" in scan.raw) {
      violations = (scan.raw as any).violations || [];
    }

    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { userId: scan.site.userId },
    });

    const brandName = whiteLabel?.companyName || "VexNexa";
    const pdfDoc = React.createElement(PDFReport, {
      scanData: {
        id: scan.id,
        url: scan.site.url,
        score: scan.score || 0,
        violations,
        createdAt: scan.createdAt,
      },
      brandName,
      brandLogo: whiteLabel?.logoUrl || undefined,
      primaryColor: whiteLabel?.primaryColor || "#D4AF37",
      footerText: whiteLabel?.footerText || undefined,
      supportEmail: whiteLabel?.supportEmail || undefined,
      showPoweredBy: whiteLabel?.showPoweredBy !== false,
    });

    const pdfBuffer = await pdf(pdfDoc as any).toBuffer();
    const filePrefix = brandName.toLowerCase().replace(/[^a-z0-9]/gi, "-");

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filePrefix}-scan-report-${scanId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error downloading admin PDF report:", error);
    return NextResponse.json({ error: "Failed to download report" }, { status: 500 });
  }
}
