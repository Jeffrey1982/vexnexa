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
    console.error("=== CHECKOUT ERROR DEBUG ===")
    console.error("Timestamp:", new Date().toISOString())
    console.error("Environment:", process.env.NODE_ENV)
    console.error("Error object:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      // Log more API error details if it's a Mollie error
      ...(error && typeof error === 'object' && 'field' in error ? {
        field: (error as any).field,
        statusCode: (error as any).statusCode,
        title: (error as any).title
      } : {})
    })
    console.error("=== END CHECKOUT ERROR ===")

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Return more detailed error for debugging - always include details in production for now
    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        // Include full error details for debugging
        debug: error instanceof Error ? {
          message: error.message,
          name: error.name,
          ...(error && typeof error === 'object' && 'field' in error ? {
            field: (error as any).field,
            statusCode: (error as any).statusCode,
            title: (error as any).title
          } : {})
        } : error
      },
      { status: 500 }
    )
  }
}