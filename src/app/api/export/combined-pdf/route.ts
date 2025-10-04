import React from "react";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCombinedReport } from "@/lib/combined-report-generator";
import { renderToStream } from "@react-pdf/renderer";
import { CombinedPDFReport } from "@/lib/pdf-generator-combined";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/export/combined-pdf - Export combined automated + manual report as PDF
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const scanId = searchParams.get("scanId") || undefined;
    const auditId = searchParams.get("auditId") || undefined;
    const brandName = searchParams.get("brandName") || "TutusPorta";

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

    // Generate combined report data
    const reportData = await generateCombinedReport(siteId, scanId, auditId);

    if (!reportData) {
      return NextResponse.json(
        { ok: false, error: "Unable to generate report" },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfStream = await renderToStream(
      React.createElement(CombinedPDFReport, {
        reportData,
        brandName
      }) as any
    );

    const chunks: any[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="accessibility-report-${site.url.replace(/[^a-z0-9]/gi, '-')}.pdf"`
      }
    });
  } catch (e: any) {
    console.error("Failed to generate combined PDF:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
