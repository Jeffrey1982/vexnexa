import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/assurance/alerts
 * List all alerts for user's subscription (with optional filtering)
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
    const resolved = searchParams.get('resolved');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
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

    if (resolved !== null) {
      where.resolved = resolved === 'true';
    }

    if (severity) {
      where.severity = severity;
    }

    if (type) {
      where.type = type;
    }

    // Fetch alerts with pagination
    const [alerts, total] = await Promise.all([
      prisma.assuranceAlert.findMany({
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
      prisma.assuranceAlert.count({ where }),
    ]);

    return NextResponse.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        domain: {
          id: alert.domain.id,
          name: alert.domain.label || alert.domain.domain,
          url: alert.domain.domain,
        },
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        currentScore: alert.currentScore,
        previousScore: alert.previousScore,
        threshold: alert.threshold,
        scanId: alert.scanId,
        emailSentTo: alert.emailSentTo,
        sentAt: alert.sentAt,
        resolved: alert.resolved,
        resolvedAt: alert.resolvedAt,
        resolvedBy: alert.resolvedBy,
        createdAt: alert.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + alerts.length < total,
      },
    });
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('[Assurance Alerts] Error listing alerts:', error);
    return NextResponse.json(
      {
        error: 'Failed to list alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
