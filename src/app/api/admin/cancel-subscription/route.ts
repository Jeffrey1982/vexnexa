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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Update subscription status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'canceled'
      }
    });

    // Log the cancellation event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: user.id,
        eventType: 'MANUAL_SUSPENSION',
        description: 'Subscription cancelled by admin',
        metadata: {
          cancelledAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
