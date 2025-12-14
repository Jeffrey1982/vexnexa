import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { generateReportPDF } from '@/lib/assurance/report-generator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/assurance/reports/[id]/pdf
 * Download report PDF
 *
 * NOTE: This endpoint serves as a fallback for PDF downloads when @vercel/blob is not installed.
 * Once @vercel/blob is configured, PDFs will be served directly from Blob storage URLs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const reportId = params.id;

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Fetch report with ownership verification
    const report = await prisma.assuranceReport.findFirst({
      where: {
        id: reportId,
        domain: {
          subscriptionId: subscription.id,
        },
      },
      include: {
        domain: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // If pdfUrl is a full Blob storage URL, redirect to it
    if (report.pdfUrl.startsWith('https://')) {
      return NextResponse.redirect(report.pdfUrl);
    }

    console.log('[Assurance Reports] Generating PDF on-the-fly for:', reportId);

    // Generate PDF on-the-fly (fallback when using placeholder URLs)
    const pdfBuffer = await generateReportPDF({
      domainId: report.domainId,
      scanId: report.scanId,
      language: report.language,
    });

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="assurance-report-${report.domain.domain}-${report.createdAt.toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[Assurance Reports] Error serving PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to serve PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
