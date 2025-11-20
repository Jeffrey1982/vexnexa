import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
    if (!adminEmails.includes(user.email) && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, amount, reason } = body;

    if (!userId || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Create admin event for the credit application
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: user.id,
        eventType: 'MANUAL_ACTIVATION', // Reusing this enum value
        description: `Applied overage credit: €${amount.toFixed(2)} - ${reason}`,
        metadata: {
          type: 'overage_credit',
          amount,
          reason
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Credit of €${amount.toFixed(2)} applied successfully`
    });
  } catch (error) {
    console.error('Error applying overage credit:', error);
    return NextResponse.json(
      { error: 'Failed to apply credit' },
      { status: 500 }
    );
  }
}
