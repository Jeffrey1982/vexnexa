import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const user = await requireAuth();
    const { scanId } = params;

    if (!scanId) {
      return NextResponse.json(
        { ok: false, error: "Scan ID is required" },
        { status: 400 }
      );
    }

    // Fetch scan with site and page info
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: true,
        page: true,
      },
    });

    if (!scan) {
      return NextResponse.json(
        { ok: false, error: "Scan not found" },
        { status: 404 }
      );
    }

    // Verify user owns this scan
    if (scan.site.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Extract violations from raw data
    const rawData = scan.raw as any;
    const violations = rawData?.violations || [];

    // Format response for results page
    const result = {
      scanId: scan.id,
      url: scan.page?.url || scan.site.url,
      score: scan.score,
      issues: scan.issues,
      violations: violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        help: v.help || v.description,
        description: v.description || v.help,
        nodes: (v.nodes || []).map((node: any) => ({
          target: node.target || [],
          html: node.html || '',
        })),
      })),
    };

    return NextResponse.json({
      ok: true,
      result,
    });

  } catch (error: any) {
    console.error("Failed to fetch scan:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch scan" },
      { status: 500 }
    );
  }
}
