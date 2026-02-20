import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/schedules — list all schedules (admin view)
export async function GET(request: NextRequest) {
  try {
    await requireAdminAPI();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'enabled' | 'disabled' | 'all'

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { site: { url: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status === 'enabled') {
      where.isEnabled = true;
    } else if (status === 'disabled') {
      where.isEnabled = false;
    }

    const schedules = await (prisma as any).scanSchedule.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        site: { select: { id: true, url: true } },
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error: unknown) {
    console.error('Admin list schedules error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
