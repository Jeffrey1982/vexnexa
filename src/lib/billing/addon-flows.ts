import { mollie, appUrl } from "../mollie"
import { prisma } from "../prisma"
import { AddOnType } from "@prisma/client"
import { getAddOnPricing, ADDON_NAMES } from "./addons"

/**
 * Purchase an add-on (extra seat or scan package)
 * Creates a Mollie subscription for recurring billing
 */
export async function purchaseAddOn(opts: {
  userId: string
  type: AddOnType
  quantity?: number // Only for EXTRA_SEAT, defaults to 1
}) {
  const { userId, type, quantity = 1 } = opts

  // Validate quantity
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1")
  }

  // For scan packages, quantity must be 1
  if (type !== "EXTRA_SEAT" && quantity !== 1) {
    throw new Error("Scan packages can only be purchased with quantity 1")
  }

  // Get user with Mollie customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      mollieCustomerId: true,
      plan: true,
      subscriptionStatus: true
    }
  })

  if (!user) {
    throw new Error("User not found")
  }

  // User must have an active subscription (not TRIAL)
  if (user.plan === "TRIAL") {
    const error: any = new Error("TRIAL_USER")
    error.code = "TRIAL_USER"
    error.redirectUrl = "/pricing"
    throw error
  }

  // Check if user has Mollie customer (should exist after upgrade)
  if (!user.mollieCustomerId) {
    const error: any = new Error("NO_PAYMENT_METHOD")
    error.code = "NO_PAYMENT_METHOD"
    error.action = "setup_payment"
    throw error
  }

  // Check if customer has valid mandate (authorization to charge via iDEAL, card, etc.)
  const mandates = await mollie.customerMandates.page({ customerId: user.mollieCustomerId })
  const validMandate = mandates.find((m: any) => m.status === "valid")

  if (!validMandate) {
    // User upgraded before but payment method expired/failed
    const error: any = new Error("PAYMENT_METHOD_EXPIRED")
    error.code = "PAYMENT_METHOD_EXPIRED"
    error.action = "setup_payment"
    throw error
  }

  // Get pricing
  const pricing = getAddOnPricing(type)
  const totalPrice = pricing.pricePerUnit * quantity

  // Check if user already has this add-on type active
  // For seats, we can have one add-on with adjustable quantity
  // For scan packs, we can have multiple different packs
  if (type === "EXTRA_SEAT") {
    const existingAddon = await prisma.addOn.findFirst({
      where: {
        userId,
        type: "EXTRA_SEAT",
        status: "active"
      }
    })

    if (existingAddon) {
      // Update existing seat add-on quantity
      return await updateAddOnQuantity({
        addOnId: existingAddon.id,
        newQuantity: existingAddon.quantity + quantity
      })
    }
  } else {
    // Check if user already has this specific scan pack
    const existingPack = await prisma.addOn.findFirst({
      where: {
        userId,
        type,
        status: "active"
      }
    })

    if (existingPack) {
      const error: any = new Error("ALREADY_ACTIVE")
      error.code = "ALREADY_ACTIVE"
      throw error
    }
  }

  // Create add-on record in database FIRST (immediate activation)
  const addOn = await prisma.addOn.create({
    data: {
      userId,
      type,
      quantity,
      status: "active",
      pricePerUnit: pricing.pricePerUnit,
      totalPrice,
      activatedAt: new Date()
    }
  })

  // Create Mollie subscription for recurring billing (async, no wait needed)
  const subscription = await (mollie.customerSubscriptions as any).create({
    customerId: user.mollieCustomerId,
    amount: {
      currency: "EUR",
      value: totalPrice.toFixed(2)
    },
    interval: "1 month",
    description: `VexNexa - ${ADDON_NAMES[type]}${quantity > 1 ? ` x${quantity}` : ""}`,
    startDate: new Date().toISOString().split('T')[0],
    metadata: {
      userId,
      addOnId: addOn.id, // Link to our add-on record
      addOnType: type,
      quantity: quantity.toString()
    }
  })

  // Update add-on with Mollie subscription ID
  await prisma.addOn.update({
    where: { id: addOn.id },
    data: { mollieSubscriptionId: subscription.id }
  })

  // Update user's extraSeats field for quick access (denormalized)
  if (type === "EXTRA_SEAT") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        extraSeats: {
          increment: quantity
        }
      }
    })
  }

  return {
    addOn,
    subscription
  }
}

/**
 * Update add-on quantity (only for EXTRA_SEAT)
 * Adjusts the Mollie subscription amount
 */
export async function updateAddOnQuantity(opts: {
  addOnId: string
  newQuantity: number
}) {
  const { addOnId, newQuantity } = opts

  if (newQuantity < 1) {
    throw new Error("Quantity must be at least 1")
  }

  const addOn = await prisma.addOn.findUnique({
    where: { id: addOnId },
    include: { user: true }
  })

  if (!addOn) {
    throw new Error("Add-on not found")
  }

  if (addOn.type !== "EXTRA_SEAT") {
    throw new Error("Only seat add-ons can have quantity adjusted")
  }

  if (addOn.status !== "active") {
    throw new Error("Cannot update inactive add-on")
  }

  if (!addOn.mollieSubscriptionId || !addOn.user.mollieCustomerId) {
    throw new Error("Missing Mollie subscription data")
  }

  const pricing = getAddOnPricing(addOn.type)
  const newTotalPrice = pricing.pricePerUnit * newQuantity
  const quantityDiff = newQuantity - addOn.quantity

  // Update Mollie subscription
  await (mollie.customerSubscriptions as any).update(
    addOn.mollieSubscriptionId,
    {
      customerId: addOn.user.mollieCustomerId,
      amount: {
        currency: "EUR",
        value: newTotalPrice.toFixed(2)
      },
      description: `VexNexa - ${ADDON_NAMES[addOn.type]} x${newQuantity}`
    }
  )

  // Update database
  const updatedAddOn = await prisma.addOn.update({
    where: { id: addOnId },
    data: {
      quantity: newQuantity,
      totalPrice: newTotalPrice
    }
  })

  // Update user's extraSeats
  await prisma.user.update({
    where: { id: addOn.userId },
    data: {
      extraSeats: {
        increment: quantityDiff
      }
    }
  })

  return updatedAddOn
}

/**
 * Cancel an add-on subscription
 * Cancels at Mollie and marks as canceled in database
 */
export async function cancelAddOn(addOnId: string) {
  const addOn = await prisma.addOn.findUnique({
    where: { id: addOnId },
    include: { user: true }
  })

  if (!addOn) {
    throw new Error("Add-on not found")
  }

  if (addOn.status === "canceled") {
    throw new Error("Add-on already canceled")
  }

  if (!addOn.mollieSubscriptionId || !addOn.user.mollieCustomerId) {
    throw new Error("Missing Mollie subscription data")
  }

  // Cancel at Mollie
  await mollie.customerSubscriptions.cancel(
    addOn.mollieSubscriptionId,
    { customerId: addOn.user.mollieCustomerId }
  )

  // Update database
  const canceledAddOn = await prisma.addOn.update({
    where: { id: addOnId },
    data: {
      status: "canceled",
      canceledAt: new Date()
    }
  })

  // Update user's extraSeats if it's a seat add-on
  if (addOn.type === "EXTRA_SEAT") {
    await prisma.user.update({
      where: { id: addOn.userId },
      data: {
        extraSeats: {
          decrement: addOn.quantity
        }
      }
    })
  }

  return canceledAddOn
}

/**
 * Get all active add-ons for a user
 */
export async function getUserAddOns(userId: string) {
  return await prisma.addOn.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })
}
