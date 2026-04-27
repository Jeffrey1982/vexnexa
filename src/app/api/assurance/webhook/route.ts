import { NextRequest, NextResponse } from 'next/server';
import { processAssuranceWebhookPayment } from '@/lib/assurance/billing';

/**
 * POST /api/assurance/webhook
 * Handle Mollie webhook for Assurance payments.
 *
 * IMPORTANT: Mollie POSTs the body as `application/x-www-form-urlencoded`
 * (e.g. `id=tr_Z6Rn...`), NOT JSON. Parsing with req.json() throws and the
 * payment is then never processed. We MUST read it as text and parse with
 * URLSearchParams (same approach as /api/mollie/webhook).
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const paymentId = params.get('id');

    // Mollie pings (test webhook from dashboard) may have no body or a
    // synthetic id. Acknowledge those without erroring.
    if (!paymentId) {
      console.log('[Assurance Webhook] Empty body / ping received, acknowledging');
      return NextResponse.json({ success: true, ping: true });
    }

    if (!/^tr_[A-Za-z0-9]+$/.test(paymentId)) {
      console.log('[Assurance Webhook] Non-real payment id, acknowledging:', paymentId);
      return NextResponse.json({ success: true, ping: true });
    }

    console.log('[Assurance Webhook] Processing payment:', paymentId);

    // Process the payment and create subscription if successful
    await processAssuranceWebhookPayment(paymentId);

    console.log('[Assurance Webhook] Payment processed successfully:', paymentId);

    // Return 200 OK (Mollie expects this)
    return NextResponse.json({ success: true });
  } catch (error) {
    const e = error as Record<string, unknown>;
    console.error('[Assurance Webhook] Error processing webhook:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      statusCode: e?.statusCode ?? e?.status,
      title: e?.title,
      detail: e?.detail,
      field: e?.field,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Still return 200 to prevent Mollie from retrying indefinitely.
    return NextResponse.json({ success: false });
  }
}
