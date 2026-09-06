import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { processWebhookPayment, processSubscriptionWebhook } from '@/lib/billing/mollie-flows';
import { claimWebhookLease, finishWebhookLease } from '@/lib/billing/webhook-lease';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function retryResponse() {
  // Mollie retries non-2xx deliveries. Never acknowledge a lost/failed payment
  // activation as successful: that would require a manual repair later.
  return NextResponse.json({ success: false, retry: true }, { status: 503, headers: { 'Retry-After': '60' } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const form = new URLSearchParams(body);
    const id = form.get('id');
    const type = form.get('type') ?? 'payment';
    if (!id || !/^(tr|sub|chr|ord|mdt|cst|pay)_[A-Za-z0-9]+$/.test(id)) {
      return NextResponse.json({ success: true, ping: true });
    }
    if (!['payment', 'subscription'].includes(type)) {
      return NextResponse.json({ error: 'Unsupported webhook type' }, { status: 400 });
    }

    // Standard Mollie payment notifications are verified by fetching the
    // payment from Mollie inside the worker, never by trusting the payload.
    // Preserve optional signing for installations with an upstream signer.
    const secret = process.env.MOLLIE_WEBHOOK_SECRET;
    const required = process.env.MOLLIE_WEBHOOK_REQUIRE_SIGNATURE === 'true';
    const signature = request.headers.get('mollie-signature') ?? request.headers.get('x-mollie-signature');
    if (required && !secret) {
      console.error('[Mollie Webhook] Required signature secret is not configured');
      return retryResponse();
    }
    if (required && !signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    if (signature && secret) {
      const expected = crypto.createHmac('sha256', secret).update(body).digest();
      if (!/^[a-fA-F0-9]{64}$/.test(signature) || !crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const claim = await claimWebhookLease({ webhookId: id, webhookType: type }, type === 'subscription');
    if (claim.state === 'processed') return NextResponse.json({ success: true, idempotent: true });
    if (claim.state === 'busy') return retryResponse();
    try {
      const result = type === 'payment' ? await processWebhookPayment(id) : await processSubscriptionWebhook(id);
      await finishWebhookLease(claim.lease, result === 'pending' ? 'pending' : 'processed');
      return NextResponse.json({ success: true, ...(result === 'pending' ? { pending: true } : {}) });
    } catch (error) {
      console.error('[Mollie Webhook] Processing failed; provider retry requested');
      await finishWebhookLease(claim.lease, 'failed', error instanceof Error ? error.message : 'Processing failed').catch(() => undefined);
      return retryResponse();
    }
  } catch {
    console.error('[Mollie Webhook] Notification could not be persisted; provider retry requested');
    return retryResponse();
  }
}
