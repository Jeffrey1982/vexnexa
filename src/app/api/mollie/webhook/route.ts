import { NextRequest, NextResponse } from "next/server"
import { processWebhookPayment } from "@/lib/billing/mollie-flows"

export async function POST(request: NextRequest) {
  try {
    // Parse form-encoded body (Mollie sends application/x-www-form-urlencoded)
    const formData = await request.formData()
    const paymentId = formData.get("id")
    
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 })
    }

    // Process the payment (this will validate by fetching from Mollie)
    await processWebhookPayment(paymentId)
    
    // Always return 200 OK for webhooks (idempotent)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    // Webhook processing error
    
    // Still return 200 to prevent Mollie from retrying
    // Log the error for manual investigation
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    })
  }
}