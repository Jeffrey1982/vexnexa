import { NextRequest, NextResponse } from 'next/server';

/**
 * Newsletter Confirmation API Endpoint
 *
 * This endpoint handles newsletter subscription confirmations.
 * Used by test endpoints and potentially by the confirmation flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual newsletter confirmation logic
    // This might include:
    // 1. Verifying the confirmation token
    // 2. Updating the newsletter subscription status in the database
    // 3. Sending a welcome email
    // 4. Adding to email marketing platform (e.g., Resend, Mailchimp)

    console.log('[Newsletter API] Confirmation request received:', { email, hasToken: !!token });

    // For now, return success
    return NextResponse.json({
      success: true,
      message: 'Newsletter subscription confirmed',
      email
    });

  } catch (error) {
    console.error('[Newsletter API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process newsletter confirmation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests with token in query params
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token && !email) {
    return NextResponse.json(
      { error: 'Token or email is required' },
      { status: 400 }
    );
  }

  // TODO: Verify token and confirm subscription
  console.log('[Newsletter API] GET confirmation request:', { email, hasToken: !!token });

  // Redirect to confirmation page
  const confirmUrl = new URL('/newsletter/confirmed', request.url);
  if (email) confirmUrl.searchParams.set('email', email);

  return NextResponse.redirect(confirmUrl);
}
