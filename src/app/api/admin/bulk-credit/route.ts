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
    const { userIds, amount, note } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users specified' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credit amount' },
        { status: 400 }
      );
    }

    // Log admin events for each user
    let appliedCount = 0;
    for (const userId of userIds) {
      try {
        await prisma.userAdminEvent.create({
          data: {
            userId,
            adminId: user.id,
            eventType: 'PAYMENT_REFUND',
            description: note || `Bulk credit applied: $${amount}`,
            metadata: {
              amount,
              note,
              bulkAction: true
            }
          }
        });
        appliedCount++;
      } catch (err) {
        console.error(`Failed to apply credit to user ${userId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      applied: appliedCount,
      amount
    });

  } catch (error: any) {
    console.error('Bulk credit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
