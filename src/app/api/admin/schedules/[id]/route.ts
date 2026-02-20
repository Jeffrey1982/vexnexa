import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/schedules/[id] — get schedule detail (admin)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAPI();
    const { id } = await params;

    const schedule = await (prisma as any).scanSchedule.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        site: { select: { id: true, url: true } },
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
        _count: { select: { runs: true } },
      },
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, schedule });
  } catch (error: unknown) {
    console.error('Admin get schedule error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/admin/schedules/[id] — admin: disable schedule, reset failures
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAPI();
    const { id } = await params;

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.isEnabled === 'boolean') data.isEnabled = body.isEnabled;
    if (typeof body.consecutiveFailures === 'number') data.consecutiveFailures = body.consecutiveFailures;

    const schedule = await (prisma as any).scanSchedule.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, email: true } },
        site: { select: { id: true, url: true } },
      },
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error: unknown) {
    console.error('Admin update schedule error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
