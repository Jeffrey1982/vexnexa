import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextRunAt, type Frequency } from '@/lib/schedule-utils';

const VALID_FORMATS = ['PDF', 'PDF_AND_DOCX', 'PDF_AND_HTML'] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET /api/schedules/[id] — get schedule detail + runs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const schedule = await (prisma as any).scanSchedule.findFirst({
      where: { id, userId: user.id },
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
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, schedule });
  } catch (error: unknown) {
    console.error('Get schedule error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/schedules/[id] — update schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const existing = await (prisma as any).scanSchedule.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    // Updatable fields
    if (typeof body.isEnabled === 'boolean') data.isEnabled = body.isEnabled;
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.daysOfWeek !== undefined) data.daysOfWeek = body.daysOfWeek;
    if (body.dayOfMonth !== undefined) data.dayOfMonth = body.dayOfMonth;
    if (body.timeOfDay !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(body.timeOfDay)) {
        return NextResponse.json({ success: false, error: 'timeOfDay must be HH:MM' }, { status: 400 });
      }
      data.timeOfDay = body.timeOfDay;
    }
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.recipients !== undefined) {
      if (!Array.isArray(body.recipients)) {
        return NextResponse.json({ success: false, error: 'recipients must be an array' }, { status: 400 });
      }
      for (const email of body.recipients) {
        if (!isValidEmail(email)) {
          return NextResponse.json({ success: false, error: `Invalid email: ${email}` }, { status: 400 });
        }
      }
      if (body.recipients.length > 20) {
        return NextResponse.json({ success: false, error: 'Maximum 20 recipients' }, { status: 400 });
      }
      data.recipients = body.recipients;
    }
    if (body.deliverFormat !== undefined) {
      if (!VALID_FORMATS.includes(body.deliverFormat)) {
        return NextResponse.json({ success: false, error: 'Invalid delivery format' }, { status: 400 });
      }
      data.deliverFormat = body.deliverFormat;
    }
    if (typeof body.includeExecutiveSummaryOnly === 'boolean') {
      data.includeExecutiveSummaryOnly = body.includeExecutiveSummaryOnly;
    }

    // Recalculate nextRunAt if schedule params changed
    const needsRecalc = body.frequency || body.daysOfWeek || body.dayOfMonth || body.timeOfDay || body.timezone || body.startsAt || body.endsAt;
    if (needsRecalc) {
      const freq = (data.frequency || existing.frequency) as Frequency;
      const nextRunAt = calculateNextRunAt({
        frequency: freq,
        daysOfWeek: (data.daysOfWeek || existing.daysOfWeek) as number[],
        dayOfMonth: (data.dayOfMonth !== undefined ? data.dayOfMonth : existing.dayOfMonth) as number | null,
        timeOfDay: (data.timeOfDay || existing.timeOfDay) as string,
        timezone: (data.timezone || existing.timezone) as string,
        startsAt: (data.startsAt || existing.startsAt) as Date,
        endsAt: (data.endsAt !== undefined ? data.endsAt : existing.endsAt) as Date | null,
      });
      data.nextRunAt = nextRunAt;
    }

    const schedule = await (prisma as any).scanSchedule.update({
      where: { id },
      data,
      include: {
        site: { select: { id: true, url: true } },
      },
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error: unknown) {
    console.error('Update schedule error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/schedules/[id] — delete schedule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await (prisma as any).scanSchedule.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    await (prisma as any).scanSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete schedule error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
