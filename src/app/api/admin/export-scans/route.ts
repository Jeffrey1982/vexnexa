import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
    if (!adminEmails.includes(user.email) && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Fetch all scans for the user
    const scans = await prisma.scan.findMany({
      where: {
        site: {
          userId: userId
        }
      },
      include: {
        site: {
          select: {
            url: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeader = 'ID,Site URL,Status,Score,Elements Scanned,Issues,Created At\n';
    const csvRows = scans.map(scan => {
      const fields = [
        scan.id,
        scan.site.url,
        scan.status,
        scan.score ?? 'N/A',
        scan.elementsScanned ?? 0,
        scan.issues ?? 0,
        new Date(scan.createdAt).toISOString()
      ];
      return fields.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scans-export-${userId}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting scans:', error);
    return NextResponse.json(
      { error: 'Failed to export scans' },
      { status: 500 }
    );
  }
}
