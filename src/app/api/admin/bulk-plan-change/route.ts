import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is admin
    const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
    if (!adminEmails.includes(user.email) && !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds, newPlan } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users specified' },
        { status: 400 }
      );
    }

    if (!newPlan || !['TRIAL', 'STARTER', 'PRO', 'BUSINESS'].includes(newPlan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Update all users
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        plan: newPlan
      }
    });

    // Log admin events
    for (const userId of userIds) {
      await prisma.userAdminEvent.create({
        data: {
          userId,
          adminId: user.id,
          eventType: 'PLAN_CHANGE',
          description: `Plan changed to ${newPlan} via bulk action`,
          metadata: {
            newPlan,
            bulkAction: true
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      updated: result.count,
      plan: newPlan
    });

  } catch (error: any) {
    console.error('Bulk plan change error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
