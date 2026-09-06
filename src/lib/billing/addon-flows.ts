import { mollie, appUrl, formatMollieAmount } from "../mollie"
import { prisma } from "../prisma"
import { AddOnType } from "@prisma/client"
import { getAddOnPricing, ADDON_NAMES, calculateExtraWebsites } from "./addons"
import { ENTITLEMENTS } from "./plans"
import { determineTax, type TaxRegime } from "./tax"
import { deriveVatBreakdown } from "./pricing-config"
import { withBillingOperationLock } from "./webhook-lease"
import { assertNoPendingAddOnFulfillment, fulfillPaidAddOn } from "./addon-fulfillment"

/**
 * Purchase an add-on (extra seat or scan package)
 * Creates a Mollie subscription for recurring billing
 */
type PurchaseAddOnOptions = {
  userId: string
  type: AddOnType
  quantity?: number // Only for EXTRA_SEAT, defaults to 1
  firstBillingDate?: string
  sourcePaymentId?: string
  sourceCustomerId?: string
  sourceAmount?: { currency: string; value: string }
}

export async function purchaseAddOn(opts: PurchaseAddOnOptions) {
  const quantity = opts.quantity ?? 1
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Quantity must be an integer of at least 1")
  if (opts.type !== "EXTRA_SEAT" && quantity !== 1) throw new Error("Scan packages can only be purchased with quantity 1")
  if (opts.sourcePaymentId !== undefined && (!opts.sourcePaymentId || !opts.firstBillingDate || !opts.sourceCustomerId || !opts.sourceAmount)) {
    throw new Error("Paid add-on fulfillment requires source payment, customer, amount and first billing date")
  }
  return withBillingOperationLock(opts.userId, async () => {
    await assertNoPendingAddOnFulfillment(opts.userId, opts.sourcePaymentId)
    if (opts.sourcePaymentId) return fulfillPaidAddOn({ ...opts, quantity, sourcePaymentId: opts.sourcePaymentId, firstBillingDate: opts.firstBillingDate!, sourceCustomerId: opts.sourceCustomerId!, sourceAmount: opts.sourceAmount! })
    return purchaseUnpaidAddOn(opts)
  })
}

async function purchaseUnpaidAddOn(opts: PurchaseAddOnOptions) {
  const { userId, type, quantity = 1, firstBillingDate } = opts

  // A pending row may represent a successful provider call whose response or
  // local activation was lost. Never create or increment again on a POST retry.
  const existing = await prisma.addOn.findFirst({
    where: { userId, type, status: { in: ["active", "pending"] } }
  })
  if (existing) {
    if (existing.status === "pending") {
      throw Object.assign(new Error("A previous add-on purchase requires reconciliation before another can be created."), { code: "ADDON_RECONCILIATION_REQUIRED" })
    }
    if (type === "EXTRA_SEAT") {
      throw Object.assign(new Error("Change an existing seat bundle through its absolute quantity endpoint, not another purchase."), { code: "EXISTING_SEAT_BUNDLE" })
    }
    throw Object.assign(new Error("ALREADY_ACTIVE"), { code: "ALREADY_ACTIVE" })
  }

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

  // Add-on prices are stored INCL. VAT (gross).
  // The displayed price IS what's charged — VAT is only derived afterwards
  // for the invoice / accounting breakdown.
  const pricing = getAddOnPricing(type)
  const grossBase = pricing.pricePerUnit * quantity
  const billingProfile = await prisma.billingProfile.findUnique({
    where: { userId },
    select: { countryCode: true, billingType: true, vatValid: true },
  })
  const tax = billingProfile
    ? determineTax({
        countryCode: billingProfile.countryCode,
        billingType: billingProfile.billingType as 'individual' | 'business',
        vatValid: billingProfile.vatValid,
      })
    : { vatRate: 0.21, regime: 'NL_VAT' as TaxRegime, invoiceNote: 'BTW 21% (NL)' }
  const breakdown = deriveVatBreakdown(grossBase, tax.vatRate)
  const totalPrice = grossBase

  // Reserve the record for provider metadata, but grant no capacity until
  // Mollie confirms that the recurring subscription was created.
  const addOn = await prisma.addOn.create({
    data: {
      userId,
      type,
      quantity,
      status: "pending",
      pricePerUnit: pricing.pricePerUnit,
      totalPrice
    }
  })

  // Create Mollie subscription for recurring billing
  const subscription = await (mollie.customerSubscriptions as any).create({
    customerId: user.mollieCustomerId,
    amount: {
      currency: "EUR",
      value: formatMollieAmount(totalPrice)
    },
    interval: "1 month",
    description: `VexNexa - ${ADDON_NAMES[type]}${quantity > 1 ? ` x${quantity}` : ""} (incl. ${Math.round(tax.vatRate * 100)}% BTW)`,
    startDate: firstBillingDate ?? new Date().toISOString().split('T')[0],
    metadata: {
      userId,
      addOnId: addOn.id,
      addOnType: type,
      quantity: quantity.toString(),
      taxRegime: tax.regime,
      vatRate: String(tax.vatRate),
      netAmount: String(breakdown.net),
      vatAmount: String(breakdown.vat),
    }
  })

  // Activate only after provider success. Failed attempts remain pending and
  // cannot pass the active-only entitlement or duplicate-purchase filters.
  const activatedAddOn = await prisma.addOn.update({
    where: { id: addOn.id },
    data: { mollieSubscriptionId: subscription.id, status: "active", activatedAt: new Date() }
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
    addOn: activatedAddOn,
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
  const owner = await prisma.addOn.findUnique({ where: { id: opts.addOnId }, select: { userId: true } })
  if (!owner) throw new Error("Add-on not found")
  return withBillingOperationLock(owner.userId, () => updateLockedAddOnQuantity(opts))
}

async function updateLockedAddOnQuantity(opts: { addOnId: string; newQuantity: number }) {
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
  const quantityDiff = newQuantity - addOn.quantity

  // Add-on prices are GROSS (incl. VAT) — charge config price as-is.
  const grossBase = pricing.pricePerUnit * newQuantity
  const billingProfile = await prisma.billingProfile.findUnique({
    where: { userId: addOn.userId },
    select: { countryCode: true, billingType: true, vatValid: true },
  })
  const tax = billingProfile
    ? determineTax({
        countryCode: billingProfile.countryCode,
        billingType: billingProfile.billingType as 'individual' | 'business',
        vatValid: billingProfile.vatValid,
      })
    : { vatRate: 0.21, regime: 'NL_VAT' as TaxRegime, invoiceNote: 'BTW 21% (NL)' }
  // Breakdown derived from gross for invoice purposes only.
  void deriveVatBreakdown(grossBase, tax.vatRate)
  const newTotalPrice = grossBase

  // Update Mollie subscription
  await (mollie.customerSubscriptions as any).update(
    addOn.mollieSubscriptionId,
    {
      customerId: addOn.user.mollieCustomerId,
      amount: {
        currency: "EUR",
        value: formatMollieAmount(newTotalPrice)
      },
      description: `VexNexa - ${ADDON_NAMES[addOn.type]} x${newQuantity} (incl. ${Math.round(tax.vatRate * 100)}% BTW)`
    }
  )

  // A provider PATCH sets an absolute quantity price and can be safely retried.
  // Commit both local representations together so a failed write cannot lose
  // the capacity delta on that retry.
  return prisma.$transaction(async tx => {
    const updatedAddOn = await tx.addOn.update({
      where: { id: addOnId },
      data: { quantity: newQuantity, totalPrice: newTotalPrice }
    })
    await tx.user.update({
      where: { id: addOn.userId },
      data: { extraSeats: { increment: quantityDiff } }
    })
    return updatedAddOn
  })
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

  if (getAddOnPricing(addOn.type).websites > 0) {
    const [activeAddOns, currentSiteCount] = await Promise.all([
      prisma.addOn.findMany({
        where: { userId: addOn.userId, status: "active", id: { not: addOn.id } },
        select: { type: true, quantity: true, status: true },
      }),
      prisma.site.count({ where: { userId: addOn.userId } }),
    ])
    const plan = addOn.user.plan as keyof typeof ENTITLEMENTS
    const remainingSiteLimit =
      ENTITLEMENTS[plan].sites + calculateExtraWebsites(activeAddOns)

    if (currentSiteCount > remainingSiteLimit) {
      const error: any = new Error(
        `This website capacity is in use. Remove ${currentSiteCount - remainingSiteLimit} site(s) before cancelling.`,
      )
      error.code = "CAPACITY_IN_USE"
      error.current = currentSiteCount
      error.limitAfterCancellation = remainingSiteLimit
      throw error
    }
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
