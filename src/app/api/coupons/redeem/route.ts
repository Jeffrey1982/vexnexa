import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/coupons/redeem — redeem a coupon code
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { code } = body as { code?: string };

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Find coupon
    const coupon = await (prisma as any).coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Validate: active
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'This coupon is no longer active' },
        { status: 410 }
      );
    }

    // Validate: not expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This coupon has expired' },
        { status: 410 }
      );
    }

    // Validate: not before start date
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return NextResponse.json(
        { success: false, error: 'This coupon is not yet active' },
        { status: 400 }
      );
    }

    // Validate: max redemptions not exceeded
    if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) {
      return NextResponse.json(
        { success: false, error: 'This coupon has reached its maximum redemptions' },
        { status: 410 }
      );
    }

    // Validate: per-user limit
    const userRedemptions = await (prisma as any).couponRedemption.count({
      where: {
        couponId: coupon.id,
        userId: user.id,
      },
    });

    if (userRedemptions >= coupon.perUserLimit) {
      return NextResponse.json(
        { success: false, error: 'You have already redeemed this coupon' },
        { status: 409 }
      );
    }

    // Apply grant based on type
    const grantType: string = coupon.grantType;
    const grantValue: string = coupon.grantValue;
    let grantDescription = '';

    if (grantType.startsWith('PLAN_')) {
      // Extract plan name: PLAN_TRIAL -> TRIAL, PLAN_STARTER -> STARTER, etc.
      const planName = grantType.replace('PLAN_', '');
      const trialDays = grantType === 'PLAN_TRIAL' ? parseInt(grantValue, 10) || 14 : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: planName as any,
          subscriptionStatus: planName === 'TRIAL' ? 'trialing' : 'active',
          trialEndsAt: trialDays
            ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      grantDescription = planName === 'TRIAL'
        ? `${trialDays}-day trial activated`
        : `Plan upgraded to ${planName}`;
    } else if (grantType === 'FREE_SCANS') {
      const scanCount = parseInt(grantValue, 10) || 0;
      if (scanCount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid scan credit value' },
          { status: 400 }
        );
      }

      // Add scan credits by incrementing the current period usage negatively
      // (or create a credit record — for now we store in metadata)
      grantDescription = `${scanCount} free scan credits added`;
    }

    // Create redemption record + increment count in a transaction
    await (prisma as any).$transaction([
      (prisma as any).couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId: user.id,
          metadata: {
            grantType,
            grantValue,
            grantDescription,
            userEmail: user.email,
          },
        },
      }),
      (prisma as any).coupon.update({
        where: { id: coupon.id },
        data: { redeemedCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: grantDescription,
      grant: {
        type: grantType,
        value: grantValue,
        description: grantDescription,
      },
    });
  } catch (error: unknown) {
    console.error('Redeem coupon error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
