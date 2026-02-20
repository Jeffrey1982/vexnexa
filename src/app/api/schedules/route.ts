import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextRunAt, type Frequency } from '@/lib/schedule-utils';

const VALID_FREQUENCIES: Frequency[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
const VALID_FORMATS = ['PDF', 'PDF_AND_DOCX', 'PDF_AND_HTML'] as const;
const MAX_SCHEDULES_PER_USER = 20;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET /api/schedules — list current user's schedules
export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    const schedules = await (prisma as any).scanSchedule.findMany({
      where: { userId: user.id },
      include: {
        site: { select: { id: true, url: true } },
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            windowKey: true,
            status: true,
            scanScore: true,
            emailSentAt: true,
            startedAt: true,
            completedAt: true,
            error: true,
          },
        },
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error: unknown) {
    console.error('List schedules error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/schedules — create a new schedule
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      siteId,
      isEnabled = true,
      timezone = 'Europe/Amsterdam',
      frequency = 'WEEKLY',
      daysOfWeek = [1],
      dayOfMonth,
      timeOfDay = '09:00',
      startsAt,
      endsAt,
      recipients = [],
      deliverFormat = 'PDF',
      includeExecutiveSummaryOnly = false,
    } = body as {
      siteId: string;
      isEnabled?: boolean;
      timezone?: string;
      frequency?: string;
      daysOfWeek?: number[];
      dayOfMonth?: number | null;
      timeOfDay?: string;
      startsAt?: string | null;
      endsAt?: string | null;
      recipients?: string[];
      deliverFormat?: string;
      includeExecutiveSummaryOnly?: boolean;
    };

    // Validate siteId
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'siteId is required' }, { status: 400 });
    }

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: user.id },
    });
    if (!site) {
      return NextResponse.json({ success: false, error: 'Site not found or not owned by you' }, { status: 404 });
    }

    // Rate limit: max schedules per user
    const existingCount = await (prisma as any).scanSchedule.count({
      where: { userId: user.id },
    });
    if (existingCount >= MAX_SCHEDULES_PER_USER) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_SCHEDULES_PER_USER} schedules allowed` },
        { status: 429 }
      );
    }

    // Validate frequency
    if (!VALID_FREQUENCIES.includes(frequency as Frequency)) {
      return NextResponse.json({ success: false, error: 'Invalid frequency' }, { status: 400 });
    }

    // Validate format
    if (!VALID_FORMATS.includes(deliverFormat as any)) {
      return NextResponse.json({ success: false, error: 'Invalid delivery format' }, { status: 400 });
    }

    // Validate timeOfDay
    if (!/^\d{2}:\d{2}$/.test(timeOfDay)) {
      return NextResponse.json({ success: false, error: 'timeOfDay must be HH:MM format' }, { status: 400 });
    }

    // Validate recipients
    if (recipients.length > 0) {
      for (const email of recipients) {
        if (!isValidEmail(email)) {
          return NextResponse.json({ success: false, error: `Invalid email: ${email}` }, { status: 400 });
        }
      }
    }
    if (recipients.length > 20) {
      return NextResponse.json({ success: false, error: 'Maximum 20 recipients allowed' }, { status: 400 });
    }

    // Validate daysOfWeek
    if (frequency === 'WEEKLY' && daysOfWeek.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one day required for weekly schedule' }, { status: 400 });
    }
    for (const d of daysOfWeek) {
      if (d < 0 || d > 6) {
        return NextResponse.json({ success: false, error: 'daysOfWeek values must be 0-6' }, { status: 400 });
      }
    }

    const parsedStartsAt = startsAt ? new Date(startsAt) : new Date();
    const parsedEndsAt = endsAt ? new Date(endsAt) : null;

    // Calculate nextRunAt
    const nextRunAt = calculateNextRunAt({
      frequency: frequency as Frequency,
      daysOfWeek,
      dayOfMonth: dayOfMonth ?? null,
      timeOfDay,
      timezone,
      startsAt: parsedStartsAt,
      endsAt: parsedEndsAt,
    });

    const schedule = await (prisma as any).scanSchedule.create({
      data: {
        userId: user.id,
        siteId,
        isEnabled,
        timezone,
        frequency,
        daysOfWeek,
        dayOfMonth: dayOfMonth ?? null,
        timeOfDay,
        startsAt: parsedStartsAt,
        endsAt: parsedEndsAt,
        nextRunAt,
        recipients,
        deliverFormat,
        includeExecutiveSummaryOnly,
      },
      include: {
        site: { select: { id: true, url: true } },
      },
    });

    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create schedule error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
