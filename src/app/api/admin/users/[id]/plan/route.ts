import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_PLANS = ['TRIAL', 'STARTER', 'PRO', 'BUSINESS'] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAPI();
    const { id: userId } = await params;

    const body = await request.json();
    const { plan, applyImmediately = true, note } = body as {
      plan: string;
      applyImmediately?: boolean;
      note?: string;
    };

    if (!plan || !VALID_PLANS.includes(plan as ValidPlan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan. Must be TRIAL, STARTER, PRO, or BUSINESS.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const oldPlan = user.plan;

    if (applyImmediately) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan as ValidPlan,
          subscriptionStatus: plan === 'TRIAL' ? 'trialing' : 'active',
          trialEndsAt:
            plan === 'TRIAL'
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              : null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan as ValidPlan,
        },
      });
    }

    // Log admin event with optional note
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'PLAN_CHANGE',
        description: `Plan changed from ${oldPlan} to ${plan}${note ? ` — ${note}` : ''}`,
        metadata: {
          oldPlan,
          newPlan: plan,
          applyImmediately,
          ...(note ? { note } : {}),
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: plan,
        subscriptionStatus: applyImmediately
          ? plan === 'TRIAL'
            ? 'trialing'
            : 'active'
          : user.subscriptionStatus,
      },
      oldPlan,
      newPlan: plan,
    });
  } catch (error: unknown) {
    console.error('Plan change error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
