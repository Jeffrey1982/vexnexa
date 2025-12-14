import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { triggerManualScan } from '@/lib/assurance/scanner';
import { detectRegression, createAlert } from '@/lib/assurance/trends';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/assurance/domains/[id]/scan
 * Trigger manual scan for a domain (outside of schedule)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const domainId = params.id;

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

    if (!domain.active) {
      return NextResponse.json(
        { error: 'Domain is inactive' },
        { status: 400 }
      );
    }

    console.log('[Assurance Domain] Triggering manual scan for:', domain.domain);

    // Execute scan
    const scan = await triggerManualScan(domainId);

    console.log('[Assurance Domain] Manual scan completed:', scan.id);

    // Detect regression
    const regression = await detectRegression(domain, scan);

    // Create alert if regression detected
    if (regression.detected && regression.type) {
      await createAlert({
        domainId: domain.id,
        type: regression.type,
        severity: regression.severity,
        title: regression.message,
        message: regression.message,
        currentScore: regression.currentScore,
        previousScore: regression.previousScore,
        threshold: regression.threshold,
        scanId: scan.scanId,
      });

      console.log('[Assurance Domain] Regression alert created');
    }

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        score: scan.score,
        wcagAACompliance: scan.wcagAACompliance,
        wcagAAACompliance: scan.wcagAAACompliance,
        issuesCount: scan.issuesCount,
        isRegression: scan.isRegression,
        scoreChange: scan.scoreChange,
        createdAt: scan.createdAt,
      },
      regression: regression.detected ? {
        type: regression.type,
        severity: regression.severity,
        message: regression.message,
      } : null,
    });
  } catch (error) {
    console.error('[Assurance Domain] Error triggering scan:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger scan',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
