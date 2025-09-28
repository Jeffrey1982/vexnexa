import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { createUpgradePayment } from "@/lib/billing/mollie-flows"
import { planKeyFromString, PRICES } from "@/lib/billing/plans"

const CheckoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS"])
})

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth()
    
    // Parse and validate request body
    const body = await request.json()
    const validation = CheckoutSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { plan } = validation.data
    
    // Validate plan exists in pricing
    if (!PRICES[plan]) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      )
    }
    
    // Create payment with Mollie
    const payment = await createUpgradePayment({
      userId: user.id,
      email: user.email,
      plan
    })
    
    // Type assertion workaround for compiler issue
    const paymentObj = payment as any
    
    return NextResponse.json({
      url: paymentObj.getCheckoutUrl(),
      paymentId: paymentObj.id
    })
    
  } catch (error) {
    console.error("Checkout error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    })

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Return more detailed error for debugging
    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}