import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { createUpgradePayment } from "@/lib/billing/mollie-flows"
import { planKeyFromString, PRICES } from "@/lib/billing/plans"
import type { MolliePayment } from "@/types/mollie"

export const dynamic = 'force-dynamic'

const CheckoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly")
})

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth()

    // Parse and validate request body
    const body = await request.json()

    const validation = CheckoutSchema.safeParse(body)

    if (!validation.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Checkout validation failed:', validation.error.issues)
      }
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { plan, billingCycle } = validation.data

    // Validate plan exists in pricing
    if (!PRICES[plan]) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid plan:', plan)
      }
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      )
    }

    // Create payment with Mollie
    const payment = await createUpgradePayment({
      userId: user.id,
      email: user.email,
      plan,
      billingCycle
    })

    // Cast to MolliePayment type for type safety
    const paymentObj = payment as MolliePayment

    const checkoutUrl = paymentObj.getCheckoutUrl()
    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout URL')
    }

    const response = {
      url: checkoutUrl,
      paymentId: paymentObj.id
    }

    return NextResponse.json(response)

  } catch (error) {
    // Log errors only in development, or use structured logging in production
    if (process.env.NODE_ENV === 'development') {
      console.error("Checkout error:", error)
    } else {
      // In production, log minimal info without sensitive data
      console.error("Checkout failed:", error instanceof Error ? error.message : 'Unknown error')
    }

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Return safe error message (no stack traces or internal details in production)
    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : 'Please try again or contact support',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}