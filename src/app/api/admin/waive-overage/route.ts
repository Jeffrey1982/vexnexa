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
    const { userId, amount } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create admin event for waiving the overage
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: user.id,
        eventType: 'MANUAL_ACTIVATION',
        description: `Waived all overage charges: €${amount.toFixed(2)}`,
        metadata: {
          type: 'overage_waived',
          amount
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Overage of €${amount.toFixed(2)} waived successfully`
    });
  } catch (error) {
    console.error('Error waiving overage:', error);
    return NextResponse.json(
      { error: 'Failed to waive overage' },
      { status: 500 }
    );
  }
}
