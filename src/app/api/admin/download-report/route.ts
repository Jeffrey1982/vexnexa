import { NextRequest, NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAPI();

    const searchParams = req.nextUrl.searchParams;
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json({ error: 'Missing scanId parameter' }, { status: 400 });
    }

    // Fetch the scan
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: {
          select: {
            url: true,
            userId: true
          }
        }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Generate a simple JSON report
    const reportData = {
      scanId: scan.id,
      siteUrl: scan.site.url,
      status: scan.status,
      score: scan.score,
      elementsScanned: scan.elementsScanned,
      createdAt: scan.createdAt,
      issues: scan.issues,
      impactCritical: scan.impactCritical,
      impactSerious: scan.impactSerious,
      impactModerate: scan.impactModerate,
      impactMinor: scan.impactMinor
    };

    const jsonContent = JSON.stringify(reportData, null, 2);

    // Return JSON file
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="scan-report-${scanId}.json"`,
      },
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}
