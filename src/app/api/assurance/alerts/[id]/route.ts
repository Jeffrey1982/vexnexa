import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/assurance/alerts/[id]
 * Get alert details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: alertId } = await params;

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Fetch alert with ownership verification
    const alert = await prisma.assuranceAlert.findFirst({
      where: {
        id: alertId,
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

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('[Assurance Alerts] Error fetching alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assurance/alerts/[id]
 * Mark alert as resolved or unresolved
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: alertId } = await params;
    const { resolved } = await req.json();

    if (typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'resolved must be a boolean' },
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
    const alert = await prisma.assuranceAlert.findFirst({
      where: {
        id: alertId,
        domain: {
          subscriptionId: subscription.id,
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    console.log('[Assurance Alerts] Marking alert as', resolved ? 'resolved' : 'unresolved', ':', alertId);

    // Update alert
    const updatedAlert = await prisma.assuranceAlert.update({
      where: { id: alertId },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
        resolvedBy: resolved ? user.id : null,
      },
    });

    console.log('[Assurance Alerts] Alert updated:', alertId);

    return NextResponse.json({
      success: true,
      alert: {
        id: updatedAlert.id,
        resolved: updatedAlert.resolved,
        resolvedAt: updatedAlert.resolvedAt,
        resolvedBy: updatedAlert.resolvedBy,
      },
    });
  } catch (error) {
    console.error('[Assurance Alerts] Error updating alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to update alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assurance/alerts/[id]
 * Delete an alert
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: alertId } = await params;

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Verify ownership
    const alert = await prisma.assuranceAlert.findFirst({
      where: {
        id: alertId,
        domain: {
          subscriptionId: subscription.id,
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    console.log('[Assurance Alerts] Deleting alert:', alertId);

    // Delete alert
    await prisma.assuranceAlert.delete({
      where: { id: alertId },
    });

    console.log('[Assurance Alerts] Alert deleted:', alertId);

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('[Assurance Alerts] Error deleting alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
