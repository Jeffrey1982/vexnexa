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

    // Log the retry attempt
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: user.id,
        eventType: 'MANUAL_ACTIVATION',
        description: 'Payment retry initiated by admin',
        metadata: {
          retriedAt: new Date().toISOString()
        }
      }
    });

    // In a real implementation, you would trigger a payment retry via Mollie API
    console.log(`Would retry payment for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Payment retry initiated'
    });

  } catch (error: any) {
    console.error('Payment retry error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
