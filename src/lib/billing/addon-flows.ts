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
    throw new Error("Please upgrade to a paid plan before purchasing add-ons")
  }

  if (!user.mollieCustomerId) {
    throw new Error("No Mollie customer ID found. Please set up a payment method first.")
  }

  // Check if customer has valid mandate
  const mandates = await mollie.customerMandates.page({ customerId: user.mollieCustomerId })
  const validMandate = mandates.find((m: any) => m.status === "valid")

  if (!validMandate) {
    throw new Error("No valid payment mandate found. Please update your payment method.")
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
      throw new Error(`Je hebt dit scan pakket al actief. Kies een ander pakket of annuleer eerst het bestaande.`)
    }
  }

  // Create Mollie subscription for the add-on
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
      addOnType: type,
      quantity: quantity.toString()
    }
  })

  // Create add-on record in database
  const addOn = await prisma.addOn.create({
    data: {
      userId,
      type,
      quantity,
      mollieSubscriptionId: subscription.id,
      status: "active",
      pricePerUnit: pricing.pricePerUnit,
      totalPrice,
      activatedAt: new Date()
    }
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
 * Process webhook for add-on subscription payments
 * Called from Mollie webhook when payment status changes
 */
export async function processAddOnWebhook(subscriptionId: string) {
  // Find the add-on by Mollie subscription ID
  const addOn = await prisma.addOn.findUnique({
    where: { mollieSubscriptionId: subscriptionId },
    include: { user: true }
  })

  if (!addOn) {
    console.error("Add-on not found for subscription:", subscriptionId)
    return
  }

  if (!addOn.user.mollieCustomerId) {
    console.error("No Mollie customer ID for user:", addOn.userId)
    return
  }

  // Fetch subscription status from Mollie
  const subscription = await mollie.customerSubscriptions.get(
    subscriptionId,
    { customerId: addOn.user.mollieCustomerId }
  )

  // Update add-on status based on subscription status
  const newStatus = subscription.status === "active" ? "active" :
                    subscription.status === "canceled" ? "canceled" :
                    subscription.status === "suspended" ? "past_due" :
                    "inactive"

  await prisma.addOn.update({
    where: { id: addOn.id },
    data: { status: newStatus }
  })

  // If subscription was canceled, update extraSeats
  if (newStatus === "canceled" && addOn.type === "EXTRA_SEAT" && addOn.status === "active") {
    await prisma.user.update({
      where: { id: addOn.userId },
      data: {
        extraSeats: {
          decrement: addOn.quantity
        }
      }
    })
  }
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
