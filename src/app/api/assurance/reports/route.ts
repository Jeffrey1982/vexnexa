import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { generateAndStoreReport } from '@/lib/assurance/report-generator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/assurance/reports
 * List all reports for user's subscription (with optional filtering)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Parse filters
    const domainId = searchParams.get('domainId');
    const language = searchParams.get('language');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    const where: any = {
      domain: {
        subscriptionId: subscription.id,
      },
    };

    if (domainId) {
      where.domainId = domainId;
    }

    if (language) {
      where.language = language;
    }

    // Fetch reports with pagination
    const [reports, total] = await Promise.all([
      prisma.assuranceReport.findMany({
        where,
        include: {
          domain: {
            select: {
              id: true,
              domain: true,
              label: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.assuranceReport.count({ where }),
    ]);

    return NextResponse.json({
      reports: reports.map((report) => ({
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
        wcagAACompliance: report.wcagAACompliance,
        wcagAAACompliance: report.wcagAAACompliance,
        emailSentTo: report.emailSentTo,
        sentAt: report.sentAt,
        createdAt: report.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + reports.length < total,
      },
    });
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('[Assurance Reports] Error listing reports:', error);
    return NextResponse.json(
      {
        error: 'Failed to list reports',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assurance/reports/generate
 * Generate a new report manually
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { domainId, scanId, language } = await req.json();

    if (!domainId || !scanId) {
      return NextResponse.json(
        { error: 'domainId and scanId are required' },
        { status: 400 }
      );
    }

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Verify ownership
    const domain = await prisma.assuranceDomain.findFirst({
      where: {
        id: domainId,
        subscriptionId: subscription.id,
      },
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Verify scan exists and belongs to this domain
    const scan = await prisma.assuranceScan.findFirst({
      where: {
        id: scanId,
        domainId: domainId,
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    console.log('[Assurance Reports] Generating report:', {
      domainId,
      scanId,
      language,
    });

    // Generate and store report
    const result = await generateAndStoreReport({
      domainId,
      scanId,
      language: language || domain.language,
    });

    console.log('[Assurance Reports] Report generated:', result.reportId);

    // Fetch the created report
    const report = await prisma.assuranceReport.findUnique({
      where: { id: result.reportId },
      include: {
        domain: {
          select: {
            domain: true,
            label: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report!.id,
        pdfUrl: report!.pdfUrl,
        language: report!.language,
        score: report!.score,
        threshold: report!.threshold,
        createdAt: report!.createdAt,
      },
    });
  } catch (error) {
    console.error('[Assurance Reports] Error generating report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
