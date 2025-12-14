import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import {
  validateThreshold,
  validateScanFrequency,
  MAX_EMAIL_RECIPIENTS,
} from '@/lib/assurance/pricing';
import { getDomainStatistics } from '@/lib/assurance/trends';
import { prisma } from '@/lib/prisma';
import type { AssuranceFrequency } from '@prisma/client';

/**
 * GET /api/assurance/domains/[id]
 * Get single domain details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: domainId } = await params;

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Get domain (verify ownership via subscription)
    const domain = await prisma.assuranceDomain.findFirst({
      where: {
        id: domainId,
        subscriptionId: subscription.id,
      },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        alerts: {
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            scans: true,
            reports: true,
            alerts: true,
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Get statistics
    const stats = await getDomainStatistics(domainId);

    return NextResponse.json({
      domain: {
        id: domain.id,
        domain: domain.domain,
        label: domain.label,
        scanFrequency: domain.scanFrequency,
        scoreThreshold: domain.scoreThreshold,
        active: domain.active,
        language: domain.language,
        emailRecipients: domain.emailRecipients,
        dayOfWeek: domain.dayOfWeek,
        timeOfDay: domain.timeOfDay,
        lastRunAt: domain.lastRunAt,
        nextRunAt: domain.nextRunAt,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      },
      scans: domain.scans,
      alerts: domain.alerts,
      reports: domain.reports.map((r) => ({
        id: r.id,
        scanId: r.scanId,
        pdfUrl: r.pdfUrl,
        language: r.language,
        score: r.score,
        threshold: r.threshold,
        emailSentTo: r.emailSentTo,
        sentAt: r.sentAt,
        createdAt: r.createdAt,
      })),
      counts: domain._count,
      statistics: stats,
    });
  } catch (error) {
    console.error('[Assurance Domain] Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assurance/domains/[id]
 * Update domain settings
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: domainId } = await params;
    const body = await req.json();

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Get domain (verify ownership)
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

    // Extract update fields
    const {
      label,
      scanFrequency,
      scoreThreshold,
      language,
      emailRecipients,
      dayOfWeek,
      timeOfDay,
      active,
    } = body;

    // Validate updates
    const updateData: any = {};

    if (label !== undefined) {
      updateData.label = label;
    }

    if (scanFrequency !== undefined) {
      if (!validateScanFrequency(subscription.tier, scanFrequency as AssuranceFrequency)) {
        return NextResponse.json(
          { error: 'Invalid scan frequency for this tier' },
          { status: 400 }
        );
      }
      updateData.scanFrequency = scanFrequency;
    }

    if (scoreThreshold !== undefined) {
      if (!validateThreshold(subscription.tier, scoreThreshold)) {
        return NextResponse.json(
          { error: 'Invalid score threshold for this tier' },
          { status: 400 }
        );
      }
      updateData.scoreThreshold = scoreThreshold;
    }

    if (language !== undefined) {
      if (!['en', 'nl', 'fr', 'es', 'pt'].includes(language)) {
        return NextResponse.json(
          { error: 'Invalid language' },
          { status: 400 }
        );
      }
      updateData.language = language;
    }

    if (emailRecipients !== undefined) {
      if (!Array.isArray(emailRecipients)) {
        return NextResponse.json(
          { error: 'Email recipients must be an array' },
          { status: 400 }
        );
      }

      if (emailRecipients.length > MAX_EMAIL_RECIPIENTS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_EMAIL_RECIPIENTS} recipients allowed` },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emailRecipients) {
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { error: `Invalid email: ${email}` },
            { status: 400 }
          );
        }
      }

      updateData.emailRecipients = emailRecipients;
    }

    if (dayOfWeek !== undefined) {
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'Day of week must be 0-6' },
          { status: 400 }
        );
      }
      updateData.dayOfWeek = dayOfWeek;
    }

    if (timeOfDay !== undefined) {
      // Validate HH:MM format
      if (!/^\d{2}:\d{2}$/.test(timeOfDay)) {
        return NextResponse.json(
          { error: 'Time must be in HH:MM format' },
          { status: 400 }
        );
      }
      updateData.timeOfDay = timeOfDay;
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // Update domain
    const updated = await prisma.assuranceDomain.update({
      where: { id: domainId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      domain: {
        id: updated.id,
        domain: updated.domain,
        label: updated.label,
        scanFrequency: updated.scanFrequency,
        scoreThreshold: updated.scoreThreshold,
        language: updated.language,
        emailRecipients: updated.emailRecipients,
        dayOfWeek: updated.dayOfWeek,
        timeOfDay: updated.timeOfDay,
        active: updated.active,
        nextRunAt: updated.nextRunAt,
      },
    });
  } catch (error) {
    console.error('[Assurance Domain] Error updating domain:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assurance/domains/[id]
 * Remove monitored domain
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: domainId } = await params;

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

    // Delete domain (cascade will delete scans, reports, alerts)
    await prisma.assuranceDomain.delete({
      where: { id: domainId },
    });

    console.log('[Assurance Domain] Domain deleted:', domainId);

    return NextResponse.json({
      success: true,
      message: 'Domain removed successfully',
    });
  } catch (error) {
    console.error('[Assurance Domain] Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
