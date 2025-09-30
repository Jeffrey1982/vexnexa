import { NextRequest, NextResponse } from "next/server"
import { processWebhookPayment } from "@/lib/billing/mollie-flows"
import crypto from "crypto"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Mollie Webhook Received ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Headers:', Object.fromEntries(request.headers.entries()))

    // Get the raw body for signature verification
    const body = await request.text()
    console.log('Body:', body)

    // Verify webhook signature if secret is configured
    if (process.env.MOLLIE_WEBHOOK_SECRET) {
      const signature = request.headers.get('mollie-signature')
      if (!signature) {
        console.error('Missing Mollie signature header')
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.MOLLIE_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log('Webhook signature verified ✓')
    }

    // Parse form-encoded body (Mollie sends application/x-www-form-urlencoded)
    const formData = new URLSearchParams(body)
    const paymentId = formData.get("id")

    console.log('Payment ID from webhook:', paymentId)

    if (!paymentId || typeof paymentId !== "string") {
      console.error('Missing or invalid payment ID')
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 })
    }

    // Process the payment (this will validate by fetching from Mollie)
    console.log('Processing webhook payment:', paymentId)
    await processWebhookPayment(paymentId)
    console.log('Webhook processing completed successfully')

    // Always return 200 OK for webhooks (idempotent)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('=== Webhook Processing Error ===')
    console.error('Error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')

    // Still return 200 to prevent Mollie from retrying
    // Log the error for manual investigation
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}