/**
 * Mollie Product Sync Service
 *
 * Idempotent sync of VexNexa pricing tiers and add-ons to Mollie.
 * - Creates Mollie products for each tier and add-on
 * - Never edits existing prices — creates new ones if amount changes
 * - Stores Mollie product/price IDs in MollieProduct table
 */

import { prisma } from "../prisma"
import { BASE_PRICES, ANNUAL_PRICES, WEBSITE_PACK_PRICES, ASSURANCE_ADDON_PRICES, type PlanKey } from "../pricing"

/* ─── Product definitions to sync ─── */

interface ProductDef {
  productKey: string
  productType: "tier" | "addon"
  description: string
  prices: Array<{
    interval: "monthly" | "yearly"
    amount: number
  }>
}

function buildProductDefs(): ProductDef[] {
  const defs: ProductDef[] = []

  // Tier products
  const tiers: PlanKey[] = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]
  for (const tier of tiers) {
    const monthly = BASE_PRICES[tier]
    const yearly = ANNUAL_PRICES[tier]
    const prices: ProductDef["prices"] = [{ interval: "monthly", amount: monthly }]
    if (yearly > 0) {
      prices.push({ interval: "yearly", amount: yearly })
    }
    defs.push({
      productKey: tier,
      productType: "tier",
      description: `VexNexa ${tier.charAt(0) + tier.slice(1).toLowerCase()} Plan`,
      prices,
    })
  }

  // Website pack add-ons
  const websitePacks: Array<{ key: string; desc: string; amount: number }> = [
    { key: "EXTRA_WEBSITE_1", desc: "+1 Extra Website", amount: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_1 },
    { key: "EXTRA_WEBSITE_5", desc: "+5 Extra Websites", amount: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_5 },
    { key: "EXTRA_WEBSITE_10", desc: "+10 Extra Websites", amount: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_10 },
  ]
  for (const wp of websitePacks) {
    defs.push({
      productKey: wp.key,
      productType: "addon",
      description: `VexNexa ${wp.desc}`,
      prices: [{ interval: "monthly", amount: wp.amount }],
    })
  }

  // Assurance add-ons (per tier that pays for it)
  for (const [tier, amount] of Object.entries(ASSURANCE_ADDON_PRICES)) {
    if (amount && amount > 0) {
      defs.push({
        productKey: `ASSURANCE_${tier}`,
        productType: "addon",
        description: `VexNexa Assurance (${tier.charAt(0) + tier.slice(1).toLowerCase()})`,
        prices: [{ interval: "monthly", amount }],
      })
    }
  }

  return defs
}

/* ─── Sync logic ─── */

export interface SyncResult {
  created: number
  updated: number
  unchanged: number
  errors: string[]
}

/**
 * Idempotent sync of all products and prices to the MollieProduct table.
 * Does NOT call Mollie API directly — it only manages the local catalog.
 * A separate step can push to Mollie if needed.
 */
export async function syncMollieProducts(): Promise<SyncResult> {
  const defs = buildProductDefs()
  const result: SyncResult = { created: 0, updated: 0, unchanged: 0, errors: [] }

  for (const def of defs) {
    for (const price of def.prices) {
      try {
        const existing = await prisma.mollieProduct.findFirst({
          where: { productKey: def.productKey, interval: price.interval, active: true },
        })

        if (!existing) {
          // Create new record
          await prisma.mollieProduct.create({
            data: {
              productType: def.productType,
              productKey: def.productKey,
              interval: price.interval,
              amount: price.amount,
              currency: "EUR",
              active: true,
            },
          })
          result.created++
        } else if (Number(existing.amount) !== price.amount) {
          // Price changed — deactivate old, create new
          await prisma.mollieProduct.update({
            where: { id: existing.id },
            data: { active: false },
          })
          await prisma.mollieProduct.create({
            data: {
              productType: def.productType,
              productKey: def.productKey,
              interval: price.interval,
              amount: price.amount,
              currency: "EUR",
              active: true,
              // New Mollie price will be created on next subscription
              mollieProductId: existing.mollieProductId,
            },
          })
          result.updated++
        } else {
          result.unchanged++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`${def.productKey}/${price.interval}: ${msg}`)
      }
    }
  }

  return result
}

/**
 * Get all active Mollie product records for admin visibility
 */
export async function getActiveProducts() {
  return prisma.mollieProduct.findMany({
    where: { active: true },
    orderBy: [{ productType: "asc" }, { productKey: "asc" }, { interval: "asc" }],
  })
}

/**
 * Get product record for a specific tier + interval
 */
export async function getProductRecord(productKey: string, interval: string) {
  return prisma.mollieProduct.findFirst({
    where: { productKey, interval, active: true },
  })
}
