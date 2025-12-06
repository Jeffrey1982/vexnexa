import { NextRequest, NextResponse } from "next/server"
import { processAddOnWebhook } from "@/lib/billing/addon-flows"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

/**
 * Handle Mollie subscription webhooks
 * This is called when subscription status changes (payment success/failure)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Mollie Subscription Webhook Received ===')
    console.log('Timestamp:', new Date().toISOString())

    const body = await request.text()
    console.log('Body:', body)

    // Parse form-encoded body
    const formData = new URLSearchParams(body)
    const subscriptionId = formData.get("id")

    console.log('Subscription ID from webhook:', subscriptionId)

    if (!subscriptionId || typeof subscriptionId !== "string") {
      console.error('Missing or invalid subscription ID')
      return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 })
    }

    // Check if this is an add-on subscription
    const addOn = await prisma.addOn.findUnique({
      where: { mollieSubscriptionId: subscriptionId }
    })

    if (addOn) {
      console.log('Processing add-on subscription webhook:', subscriptionId)
      await processAddOnWebhook(subscriptionId)
      console.log('Add-on webhook processing completed')
      return NextResponse.json({ success: true, type: "addon" })
    }

    // Check if this is a main subscription
    const user = await prisma.user.findFirst({
      where: { mollieSubscriptionId: subscriptionId }
    })

    if (user) {
      console.log('Processing main subscription webhook:', subscriptionId)
      // Main subscription logic can be added here if needed
      console.log('Main subscription webhook processing completed')
      return NextResponse.json({ success: true, type: "main" })
    }

    console.log('Subscription not found in database:', subscriptionId)
    // Return success anyway to prevent retries
    return NextResponse.json({ success: true, type: "unknown" })

  } catch (error) {
    console.error('=== Subscription Webhook Processing Error ===')
    console.error('Error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')

    // Return 200 to prevent retries
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
