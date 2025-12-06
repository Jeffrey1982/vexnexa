import { AddOnType } from "@prisma/client"

// Add-on pricing configuration
export const ADDON_PRICING = {
  EXTRA_SEAT: {
    pricePerUnit: 15.00,
    currency: "EUR",
    interval: "1 month",
    description: "Extra team seat",
    scans: 0, // Seats don't provide scans
  },
  SCAN_PACK_100: {
    pricePerUnit: 19.00,
    currency: "EUR",
    interval: "1 month",
    description: "+100 scans per month",
    scans: 100,
  },
  SCAN_PACK_500: {
    pricePerUnit: 69.00,
    currency: "EUR",
    interval: "1 month",
    description: "+500 scans per month",
    scans: 500,
  },
  SCAN_PACK_1500: {
    pricePerUnit: 179.00,
    currency: "EUR",
    interval: "1 month",
    description: "+1500 scans per month",
    scans: 1500,
  },
} as const

export type AddOnPricing = typeof ADDON_PRICING

// Helper to get pricing for an add-on type
export function getAddOnPricing(type: AddOnType) {
  return ADDON_PRICING[type]
}

// Helper to calculate total price for an add-on
export function calculateAddOnPrice(type: AddOnType, quantity: number = 1): number {
  const pricing = getAddOnPricing(type)
  return pricing.pricePerUnit * quantity
}

// Helper to format add-on price
export function formatAddOnPrice(type: AddOnType, quantity: number = 1): string {
  const price = calculateAddOnPrice(type, quantity)
  return `€${price.toFixed(2)}/maand`
}

// Get total extra scans from user's active scan package add-ons
export function calculateExtraScans(addOns: Array<{ type: AddOnType; quantity: number; status: string }>): number {
  return addOns
    .filter(addon => addon.status === "active")
    .reduce((total, addon) => {
      const pricing = ADDON_PRICING[addon.type]
      return total + (pricing.scans * addon.quantity)
    }, 0)
}

// Get total extra seats from user's active seat add-ons
export function calculateExtraSeats(addOns: Array<{ type: AddOnType; quantity: number; status: string }>): number {
  return addOns
    .filter(addon => addon.status === "active" && addon.type === "EXTRA_SEAT")
    .reduce((total, addon) => total + addon.quantity, 0)
}

// User-friendly names for add-on types
export const ADDON_NAMES = {
  EXTRA_SEAT: "Extra team seat",
  SCAN_PACK_100: "100 extra scans",
  SCAN_PACK_500: "500 extra scans",
  SCAN_PACK_1500: "1500 extra scans",
} as const
