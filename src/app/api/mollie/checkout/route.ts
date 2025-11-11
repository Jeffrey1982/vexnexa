import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { createUpgradePayment } from "@/lib/billing/mollie-flows"
import { planKeyFromString, PRICES } from "@/lib/billing/plans"

export const dynamic = 'force-dynamic'

const CheckoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS"]),
  billingCycle: z.enum(["monthly", "semiannual", "annual"]).optional().default("monthly")
})

export async function POST(request: NextRequest) {
  try {
    // Force rebuild to pick up new environment variables
    console.log('=== Checkout Request (Cache Cleared) ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Headers:', Object.fromEntries(request.headers.entries()))

    // Verify user is authenticated
    console.log('Checking authentication...')
    const user = await requireAuth()
    console.log('User authenticated:', { id: user.id, email: user.email })

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body:', body)

    const validation = CheckoutSchema.safeParse(body)

    if (!validation.success) {
      console.error('Validation failed:', validation.error.issues)
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { plan, billingCycle } = validation.data
    console.log('Plan validated:', { plan, billingCycle })

    // Validate plan exists in pricing
    if (!PRICES[plan]) {
      console.error('Invalid plan:', plan)
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      )
    }

    // Create payment with Mollie
    console.log('Creating payment with Mollie...')
    const payment = await createUpgradePayment({
      userId: user.id,
      email: user.email,
      plan,
      billingCycle
    })

    console.log('Payment created successfully:', payment.id)

    // Type assertion workaround for compiler issue
    const paymentObj = payment as any

    const response = {
      url: paymentObj.getCheckoutUrl(),
      paymentId: paymentObj.id
    }
    console.log('Returning response:', response)

    return NextResponse.json(response)

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