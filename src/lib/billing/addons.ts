import { AddOnType } from "@prisma/client"

// Add-on pricing configuration
export const ADDON_PRICING: Record<AddOnType, {
  pricePerUnit: number;
  currency: string;
  interval: string;
  description: string;
  scans: number;
  websites: number;
}> = {
  EXTRA_SEAT: {
    pricePerUnit: 15.00,
    currency: "EUR",
    interval: "1 month",
    description: "Extra team seat",
    scans: 0,
    websites: 0,
  },
  // Legacy scan packs (kept for existing subscriptions — do NOT offer to new customers)
  SCAN_PACK_100: {
    pricePerUnit: 19.00,
    currency: "EUR",
    interval: "1 month",
    description: "Legacy: +100 pages/month",
    scans: 100,
    websites: 0,
  },
  SCAN_PACK_500: {
    pricePerUnit: 69.00,
    currency: "EUR",
    interval: "1 month",
    description: "Legacy: +500 pages/month",
    scans: 500,
    websites: 0,
  },
  SCAN_PACK_1500: {
    pricePerUnit: 179.00,
    currency: "EUR",
    interval: "1 month",
    description: "Legacy: +1,500 pages/month",
    scans: 1500,
    websites: 0,
  },
  // New website packs
  EXTRA_WEBSITE_1: {
    pricePerUnit: 15.00,
    currency: "EUR",
    interval: "1 month",
    description: "+1 extra website",
    scans: 0,
    websites: 1,
  },
  EXTRA_WEBSITE_5: {
    pricePerUnit: 59.00,
    currency: "EUR",
    interval: "1 month",
    description: "+5 extra websites",
    scans: 0,
    websites: 5,
  },
  EXTRA_WEBSITE_10: {
    pricePerUnit: 99.00,
    currency: "EUR",
    interval: "1 month",
    description: "+10 extra websites",
    scans: 0,
    websites: 10,
  },
  // Assurance add-on (price varies by tier, pricePerUnit is base)
  ASSURANCE: {
    pricePerUnit: 9.00,
    currency: "EUR",
    interval: "1 month",
    description: "Continuous monitoring & alerts",
    scans: 0,
    websites: 0,
  },
  // New page volume packs (replaces legacy scan packs for new customers)
  PAGE_PACK_25K: {
    pricePerUnit: 29.00,
    currency: "EUR",
    interval: "1 month",
    description: "+25,000 pages/month",
    scans: 25000,
    websites: 0,
  },
  PAGE_PACK_100K: {
    pricePerUnit: 79.00,
    currency: "EUR",
    interval: "1 month",
    description: "+100,000 pages/month",
    scans: 100000,
    websites: 0,
  },
  PAGE_PACK_250K: {
    pricePerUnit: 149.00,
    currency: "EUR",
    interval: "1 month",
    description: "+250,000 pages/month",
    scans: 250000,
    websites: 0,
  },
}

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
  return `€${price.toFixed(2)}/month`
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

// Get total extra websites from user's active website pack add-ons
export function calculateExtraWebsites(addOns: Array<{ type: AddOnType; quantity: number; status: string }>): number {
  const websiteTypes: AddOnType[] = ["EXTRA_WEBSITE_1", "EXTRA_WEBSITE_5", "EXTRA_WEBSITE_10"]
  return addOns
    .filter(addon => addon.status === "active" && websiteTypes.includes(addon.type))
    .reduce((total, addon) => {
      const pricing = ADDON_PRICING[addon.type]
      return total + (pricing.websites * addon.quantity)
    }, 0)
}

// Check if user has active assurance add-on
export function hasActiveAssurance(addOns: Array<{ type: AddOnType; status: string }>): boolean {
  return addOns.some(addon => addon.type === "ASSURANCE" && addon.status === "active")
}

// User-friendly names for add-on types
export const ADDON_NAMES: Record<AddOnType, string> = {
  EXTRA_SEAT: "Extra team seat",
  SCAN_PACK_100: "Legacy: +100 pages/month",
  SCAN_PACK_500: "Legacy: +500 pages/month",
  SCAN_PACK_1500: "Legacy: +1,500 pages/month",
  EXTRA_WEBSITE_1: "+1 extra website",
  EXTRA_WEBSITE_5: "+5 extra websites",
  EXTRA_WEBSITE_10: "+10 extra websites",
  ASSURANCE: "Accessibility Assurance",
  PAGE_PACK_25K: "+25,000 pages/month",
  PAGE_PACK_100K: "+100,000 pages/month",
  PAGE_PACK_250K: "+250,000 pages/month",
}
