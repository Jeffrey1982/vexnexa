import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ENTITLEMENTS } from '@/lib/billing/plans';

export async function POST(req: NextRequest) {
  try {
    // Check admin access
    await requireAdminAPI();

    const { userId, newPlan } = await req.json();

    if (!userId || !newPlan) {
      return NextResponse.json({
        success: false,
        error: 'User ID and new plan are required'
      }, { status: 400 });
    }

    // Validate plan
    if (!Object.keys(ENTITLEMENTS).includes(newPlan)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plan specified'
      }, { status: 400 });
    }

    // Find user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update user plan and subscription status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: newPlan,
        subscriptionStatus: 'active', // Set to active for manual upgrades
        // Extend trial if upgrading to trial
        trialEndsAt: newPlan === 'TRIAL' ?
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 days from now
          existingUser.trialEndsAt
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        trialEndsAt: true
      }
    });

    // Log the upgrade action
    console.log(`Admin upgrade: ${existingUser.email} (${existingUser.plan} → ${newPlan})`);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User successfully upgraded to ${newPlan}`
    });

  } catch (error: any) {
    console.error('Admin upgrade user error:', error);

    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Admin access required'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to upgrade user'
    }, { status: 500 });
  }
}