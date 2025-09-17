import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // EMERGENCY: Auth temporarily disabled
    return NextResponse.json({
      success: false,
      error: 'Server authentication temporarily disabled',
      authenticated: false
    }, { status: 503 });

  } catch (error: any) {
    console.error('Admin debug - auth error:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Authentication failed',
      authenticated: false
    }, { status: 401 });
  }
}