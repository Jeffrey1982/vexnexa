import { NextRequest, NextResponse } from 'next/server';
import { processAssuranceWebhookPayment } from '@/lib/assurance/billing';

/**
 * POST /api/assurance/webhook
 * Handle Mollie webhook for Assurance payments
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paymentId = body.id;

    if (!paymentId) {
      console.error('[Assurance Webhook] No payment ID provided');
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    console.log('[Assurance Webhook] Processing payment:', paymentId);

    // Process the payment and create subscription if successful
    await processAssuranceWebhookPayment(paymentId);

    console.log('[Assurance Webhook] Payment processed successfully');

    // Return 200 OK (Mollie expects this)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Assurance Webhook] Error processing webhook:', error);
    // Still return 200 to prevent Mollie from retrying
    return NextResponse.json({ success: false });
  }
}
