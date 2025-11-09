import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

// Simple admin check function
async function requireAdmin() {
  const user = await requireAuth();

  // Admin emails - replace with your email
  const adminEmails = [
    'jeffrey.aay@gmail.com',
    'admin@vexnexa.com'
  ];

  if (!adminEmails.includes(user.email)) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

export async function POST(req: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    // Search for user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        trialEndsAt: true,
        _count: {
          select: {
            sites: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error: any) {
    console.error('Admin search user error:', error);

    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Admin access required'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to search user'
    }, { status: 500 });
  }
}