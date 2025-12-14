import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import {
  getAssurancePlanLimits,
  validateDomainCount,
  validateThreshold,
  validateScanFrequency,
  MAX_EMAIL_RECIPIENTS,
  DEFAULT_SCAN_TIME,
  DEFAULT_SCAN_DAY,
} from '@/lib/assurance/pricing';
import { prisma } from '@/lib/prisma';
import type { AssuranceFrequency } from '@prisma/client';

/**
 * GET /api/assurance/domains
 * List all monitored domains for user's subscription
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json({
        domains: [],
        hasSubscription: false,
      });
    }

    // Get all domains for this subscription
    const domains = await prisma.assuranceDomain.findMany({
      where: { subscriptionId: subscription.id },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        alerts: {
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            scans: true,
            reports: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      domains: domains.map((d) => ({
        id: d.id,
        domain: d.domain,
        label: d.label,
        scanFrequency: d.scanFrequency,
        scoreThreshold: d.scoreThreshold,
        active: d.active,
        language: d.language,
        emailRecipients: d.emailRecipients,
        dayOfWeek: d.dayOfWeek,
        timeOfDay: d.timeOfDay,
        lastRunAt: d.lastRunAt,
        nextRunAt: d.nextRunAt,
        createdAt: d.createdAt,
        latestScan: d.scans[0] || null,
        unresolvedAlerts: d.alerts.length,
        counts: d._count,
      })),
      hasSubscription: true,
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('[Assurance Domains] Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assurance/domains
 * Add a new monitored domain
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active Assurance subscription found' },
        { status: 403 }
      );
    }

    // Validate input
    const {
      domain,
      label,
      scanFrequency = 'WEEKLY',
      scoreThreshold,
      language = 'en',
      emailRecipients = [],
      dayOfWeek = DEFAULT_SCAN_DAY,
      timeOfDay = DEFAULT_SCAN_TIME,
    } = body as {
      domain: string;
      label?: string;
      scanFrequency?: AssuranceFrequency;
      scoreThreshold?: number;
      language?: string;
      emailRecipients?: string[];
      dayOfWeek?: number;
      timeOfDay?: string;
    };

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Get plan limits
    const limits = getAssurancePlanLimits(subscription.tier);

    // Check domain count limit
    const currentDomainCount = await prisma.assuranceDomain.count({
      where: { subscriptionId: subscription.id, active: true },
    });

    if (!validateDomainCount(subscription.tier, currentDomainCount + 1)) {
      return NextResponse.json(
        {
          error: `Domain limit reached. Your ${subscription.tier} plan allows ${limits.domains} ${limits.domains === 1 ? 'domain' : 'domains'}.`,
        },
        { status: 403 }
      );
    }

    // Validate threshold
    const threshold = scoreThreshold !== undefined
      ? scoreThreshold
      : limits.defaultThreshold;

    if (!validateThreshold(subscription.tier, threshold)) {
      if (limits.customThreshold) {
        return NextResponse.json(
          { error: 'Threshold must be between 60 and 100' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `Threshold must be ${limits.defaultThreshold} for ${subscription.tier} tier` },
          { status: 400 }
        );
      }
    }

    // Validate scan frequency
    if (!validateScanFrequency(subscription.tier, scanFrequency)) {
      return NextResponse.json(
        { error: 'Invalid scan frequency for this tier' },
        { status: 400 }
      );
    }

    // Validate email recipients
    if (!Array.isArray(emailRecipients)) {
      return NextResponse.json(
        { error: 'Email recipients must be an array' },
        { status: 400 }
      );
    }

    if (emailRecipients.length > MAX_EMAIL_RECIPIENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_EMAIL_RECIPIENTS} email recipients allowed` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emailRecipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: `Invalid email address: ${email}` },
          { status: 400 }
        );
      }
    }

    // Validate language
    if (!['en', 'nl', 'fr', 'es', 'pt'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be one of: en, nl, fr, es, pt' },
        { status: 400 }
      );
    }

    // Check for duplicate domain
    const existingDomain = await prisma.assuranceDomain.findFirst({
      where: {
        subscriptionId: subscription.id,
        domain,
      },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain is already being monitored' },
        { status: 409 }
      );
    }

    // Calculate initial nextRunAt
    const nextRunAt = calculateNextRunTime(scanFrequency, dayOfWeek, timeOfDay);

    // Create domain
    const newDomain = await prisma.assuranceDomain.create({
      data: {
        subscriptionId: subscription.id,
        domain,
        label,
        scanFrequency,
        scoreThreshold: threshold,
        language,
        emailRecipients,
        dayOfWeek,
        timeOfDay,
        active: true,
        nextRunAt,
      },
    });

    console.log('[Assurance Domains] Domain created:', newDomain.id);

    return NextResponse.json({
      success: true,
      domain: {
        id: newDomain.id,
        domain: newDomain.domain,
        label: newDomain.label,
        scanFrequency: newDomain.scanFrequency,
        scoreThreshold: newDomain.scoreThreshold,
        language: newDomain.language,
        emailRecipients: newDomain.emailRecipients,
        nextRunAt: newDomain.nextRunAt,
      },
    });
  } catch (error) {
    console.error('[Assurance Domains] Error creating domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time based on frequency and schedule
 */
function calculateNextRunTime(
  frequency: AssuranceFrequency,
  dayOfWeek: number,
  timeOfDay: string
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const now = new Date();
  const next = new Date();

  // Set time
  next.setHours(hours, minutes, 0, 0);

  // Calculate days until next run
  const currentDay = now.getDay();
  let daysUntilNext = dayOfWeek - currentDay;

  if (daysUntilNext < 0 || (daysUntilNext === 0 && now >= next)) {
    // Target day has passed this week, schedule for next week
    daysUntilNext += 7;
  }

  // Add extra week for biweekly
  if (frequency === 'BIWEEKLY') {
    daysUntilNext += 7;
  }

  next.setDate(now.getDate() + daysUntilNext);

  return next;
}
