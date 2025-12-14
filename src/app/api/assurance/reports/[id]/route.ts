import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/assurance/reports/[id]
 * Get report details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: reportId } = await params;

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
        domain: {
          select: {
            id: true,
            domain: true,
            label: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: report.id,
      domain: {
        id: report.domain.id,
        name: report.domain.label || report.domain.domain,
        url: report.domain.domain,
      },
      scanId: report.scanId,
      pdfUrl: report.pdfUrl,
      language: report.language,
      score: report.score,
      threshold: report.threshold,
      trendData: report.trendData,
      wcagAACompliance: report.wcagAACompliance,
      wcagAAACompliance: report.wcagAAACompliance,
      emailSentTo: report.emailSentTo,
      sentAt: report.sentAt,
      createdAt: report.createdAt,
    });
  } catch (error) {
    console.error('[Assurance Reports] Error fetching report:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assurance/reports/[id]
 * Delete a report
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: reportId } = await params;

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Verify ownership
    const report = await prisma.assuranceReport.findFirst({
      where: {
        id: reportId,
        domain: {
          subscriptionId: subscription.id,
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    console.log('[Assurance Reports] Deleting report:', reportId);

    // TODO: Delete PDF from Vercel Blob storage when @vercel/blob is installed
    /*
    if (report.pdfUrl.includes('blob.vercel-storage.com')) {
      await del(report.pdfUrl);
    }
    */

    // Delete from database
    await prisma.assuranceReport.delete({
      where: { id: reportId },
    });

    console.log('[Assurance Reports] Report deleted:', reportId);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('[Assurance Reports] Error deleting report:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
