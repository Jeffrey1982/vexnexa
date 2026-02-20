import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/coupons/[id] — get coupon detail + redemptions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAPI();
    const { id } = await params;

    const coupon = await (prisma as any).coupon.findUnique({
      where: { id },
      include: {
        redemptions: {
          orderBy: { redeemedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error: unknown) {
    console.error('Get coupon error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/admin/coupons/[id] — update coupon (toggle active, edit fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAPI();
    const { id } = await params;

    const body = await request.json();
    const { isActive, name, description, maxRedemptions, perUserLimit, expiresAt } = body as {
      isActive?: boolean;
      name?: string;
      description?: string;
      maxRedemptions?: number | null;
      perUserLimit?: number;
      expiresAt?: string | null;
    };

    const data: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (name !== undefined) data.name = name || null;
    if (description !== undefined) data.description = description || null;
    if (maxRedemptions !== undefined) data.maxRedemptions = maxRedemptions;
    if (perUserLimit !== undefined) data.perUserLimit = perUserLimit;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const coupon = await (prisma as any).coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: unknown) {
    console.error('Update coupon error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/admin/coupons/[id] — delete coupon
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAPI();
    const { id } = await params;

    await (prisma as any).coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete coupon error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
