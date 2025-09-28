import { mollie, appUrl } from "../mollie"
import { prisma } from "../prisma"
import { PRICES, planKeyFromString } from "./plans"
import type { Plan } from "@prisma/client"
import type { PaymentCreateParams } from "@mollie/api-client"
import { SequenceType } from "@mollie/api-client"

export async function createOrGetMollieCustomer(userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) throw new Error("User not found")
  
  // If user already has a Mollie customer ID, return it
  if (user.mollieCustomerId) {
    try {
      const customer = await mollie.customers.get(user.mollieCustomerId)
      return customer
    } catch (error) {
      // Customer doesn't exist anymore, create a new one
    }
  }
  
  // Create new Mollie customer
  const customer = await mollie.customers.create({
    email: email,
    name: email.split('@')[0], // Use email prefix as name
    metadata: {
      userId: userId
    }
  })
  
  // Save customer ID to database
  await prisma.user.update({
    where: { id: userId },
    data: { mollieCustomerId: customer.id }
  })
  
  return customer
}

export async function createUpgradePayment(opts: {
  userId: string
  email: string
  plan: Exclude<Plan, "TRIAL">
}) {
  try {
    const { userId, email, plan } = opts

    console.log('Creating upgrade payment for:', { userId, email, plan })

    if (!PRICES[plan]) {
      throw new Error(`Invalid plan: ${plan}`)
    }

    // Get or create Mollie customer
    console.log('Getting or creating Mollie customer...')
    const customer = await createOrGetMollieCustomer(userId, email)
    console.log('Customer created/retrieved:', customer.id)

    // Create first payment (creates mandate automatically)
    const paymentData: PaymentCreateParams = {
      amount: {
        currency: PRICES[plan].currency as any,
        value: PRICES[plan].amount
      },
      description: `TutusPorta ${plan} Plan - First Payment (Vexnexa)`,
      customerId: customer.id,
      sequenceType: SequenceType.first,
      redirectUrl: appUrl("/dashboard?checkout=success"),
      webhookUrl: appUrl("/api/mollie/webhook"),
      metadata: {
        userId,
        plan,
        type: "upgrade"
      }
    }

    console.log('Creating payment with data:', paymentData)
    const payment = await mollie.payments.create(paymentData)
    console.log('Payment created successfully:', payment.id)

    return payment
  } catch (error) {
    console.error('Error in createUpgradePayment:', error)
    throw error
  }
}

export async function createSubscription(opts: {
  customerId: string
  plan: Exclude<Plan, "TRIAL">
  userId: string
}) {
  const { customerId, plan, userId } = opts
  
  if (!PRICES[plan]) {
    throw new Error(`Invalid plan: ${plan}`)
  }
  
  // Check if customer has valid mandates
  const mandates = await mollie.customerMandates.page({ customerId })
  const validMandate = mandates.find((m: any) => m.status === "valid")

  if (!validMandate) {
    throw new Error("No valid mandate found for customer")
  }
  
  // Cancel existing subscription if any
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.mollieSubscriptionId) {
    try {
      await mollie.customerSubscriptions.cancel(user.mollieSubscriptionId, { customerId })
    } catch (error) {
      // Failed to cancel existing subscription
    }
  }
  
  // Create new subscription
  const subscription = await (mollie.customerSubscriptions as any).create({
    customerId,
    amount: {
      currency: PRICES[plan].currency,
      value: PRICES[plan].amount
    },
    interval: "1 month",
    description: `TutusPorta ${plan} Plan (Vexnexa)`,
    startDate: new Date().toISOString().split('T')[0], // Start today
    metadata: {
      userId,
      plan
    }
  })
  
  // Update user in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: "active",
      mollieSubscriptionId: subscription.id,
      trialEndsAt: null
    }
  })
  
  return subscription
}

export async function cancelSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) throw new Error("User not found")
  
  if (!user.mollieCustomerId || !user.mollieSubscriptionId) {
    throw new Error("No active subscription found")
  }
  
  // Cancel subscription at Mollie
  await mollie.customerSubscriptions.cancel(
    user.mollieSubscriptionId,
    { customerId: user.mollieCustomerId }
  )
  
  // Update user status
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "canceled",
      plan: "TRIAL", // Downgrade to trial
      mollieSubscriptionId: null,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days grace period
    }
  })
}

export async function changePlan(opts: {
  userId: string
  newPlan: Exclude<Plan, "TRIAL">
}) {
  const { userId, newPlan } = opts
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) throw new Error("User not found")
  
  if (!user.mollieCustomerId) {
    throw new Error("User has no Mollie customer ID")
  }
  
  // Check if user has valid mandate
  const mandates = await mollie.customerMandates.page({ customerId: user.mollieCustomerId })
  const validMandate = mandates.find((m: any) => m.status === "valid")

  if (!validMandate) {
    // Need new checkout flow for mandate
    return { needCheckout: true }
  }

  // Can create subscription directly
  await createSubscription({
    customerId: user.mollieCustomerId,
    plan: newPlan,
    userId
  })

  return { success: true }
}

export async function processWebhookPayment(paymentId: string) {
  // Fetch payment details from Mollie (never trust webhook data directly)
  const payment = await mollie.payments.get(paymentId)
  
  if (!(payment.metadata as any)?.userId || !(payment.metadata as any)?.plan) {
    console.error("Payment missing required metadata:", payment.id)
    return
  }
  
  const userId = (payment.metadata as any).userId
  const plan = planKeyFromString((payment.metadata as any).plan)
  
  if (payment.status !== "paid") {
    // Payment not paid yet
    return
  }
  
  // Payment is successful, create subscription
  if (payment.customerId && plan !== "TRIAL") {
    await createSubscription({
      customerId: payment.customerId,
      plan: plan as Exclude<Plan, "TRIAL">,
      userId
    })
  }
}

export async function createPaymentMethodResetPayment(userId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")
  
  // Get or create customer
  const customer = await createOrGetMollieCustomer(userId, email)
  
  // Create a small first payment to establish new mandate
  const paymentData: PaymentCreateParams = {
    amount: {
      currency: "EUR",
      value: "0.01" // 1 cent
    },
    description: "TutusPorta - Payment Method Setup (Vexnexa)",
    customerId: customer.id,
    sequenceType: SequenceType.first,
    redirectUrl: appUrl("/settings/billing?setup=success"),
    webhookUrl: appUrl("/api/mollie/webhook"),
    metadata: {
      userId,
      type: "payment_method_reset"
    }
  }

  const payment = await mollie.payments.create(paymentData)
  
  return payment
}