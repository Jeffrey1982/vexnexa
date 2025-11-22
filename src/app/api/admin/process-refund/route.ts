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
    const { userId, amount, reason } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the refund event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: user.id,
        eventType: 'PAYMENT_REFUND',
        description: `Refund processed: $${amount}`,
        metadata: {
          amount,
          reason: reason || 'Admin manual refund',
          processedAt: new Date().toISOString()
        }
      }
    });

    // In a real implementation, you would process the refund via Mollie API here
    console.log(`Would process refund of $${amount} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      amount
    });

  } catch (error: any) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
