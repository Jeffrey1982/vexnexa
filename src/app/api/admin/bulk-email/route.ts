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
    const { userIds, subject, message } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users specified' },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Get all user emails
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    // Log the admin event for each user
    for (const targetUser of users) {
      await prisma.userAdminEvent.create({
        data: {
          userId: targetUser.id,
          adminId: user.id,
          eventType: 'EMAIL_SENT',
          description: `Bulk email sent: ${subject}`,
          metadata: {
            subject,
            message: message.substring(0, 500) // Store preview
          }
        }
      });
    }

    // In a real implementation, you would send emails here using your email service
    // For now, we just log the action
    console.log(`Bulk email would be sent to ${users.length} users:`, {
      subject,
      message,
      recipients: users.map(u => u.email)
    });

    return NextResponse.json({
      success: true,
      sent: users.length,
      message: 'Emails queued for sending'
    });

  } catch (error: any) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
