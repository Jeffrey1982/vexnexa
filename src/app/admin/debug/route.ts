import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if user is authenticated
    const user = await requireAuth();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan
      },
      message: 'User is authenticated'
    });

  } catch (error: any) {
    console.error('Admin debug - auth error:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Authentication failed',
      authenticated: false
    }, { status: 401 });
  }
}