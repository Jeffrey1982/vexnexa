/**
 * Mollie Payment Client
 *
 * PAYMENT METHOD AVAILABILITY:
 * Mollie automatically determines which payment methods to show based on:
 *   1. API key mode — test_ keys show limited methods; live_ keys show all enabled methods
 *   2. Currency — EUR is recommended; non-EUR restricts available methods
 *   3. Amount — some methods have minimum/maximum thresholds
 *   4. Profile settings — methods must be enabled in the Mollie dashboard
 *   5. Country — some methods are region-specific
 *
 * We intentionally do NOT pass `method` or `methods` in payment creation
 * so that Mollie's hosted checkout page shows the full set of eligible
 * methods automatically. Forcing a method restricts the checkout to only
 * that single option.
 *
 * TEST vs LIVE:
 * - test_ API key: only iDEAL, credit card, and a few others appear
 * - live_ API key: all methods enabled in the dashboard appear
 * This is expected Mollie behavior, not a bug.
 */
import { createMollieClient } from "@mollie/api-client"

let mollieClient: ReturnType<typeof createMollieClient> | null = null

/**
 * Returns `true` when using a Mollie test API key.
 * Test mode shows limited payment methods — this is expected Mollie behavior.
 */
export function isMollieTestMode(): boolean {
  return process.env.MOLLIE_API_KEY?.startsWith('test_') ?? false
}

export function getMollieClient() {
  if (!mollieClient) {
    if (!process.env.MOLLIE_API_KEY) {
      throw new Error("MOLLIE_API_KEY environment variable is required")
    }
    mollieClient = createMollieClient({ 
      apiKey: process.env.MOLLIE_API_KEY 
    })
  }
  return mollieClient
}

/**
 * Format a numeric amount to Mollie's required string format (2 decimal places).
 * Mollie requires amount.value as a string like "24.99".
 *
 * @param amount - Numeric amount in EUR (must be >= 0.01 for most methods)
 * @returns String formatted with exactly 2 decimal places
 */
export function formatMollieAmount(amount: number): string {
  if (amount < 0) {
    throw new Error(`[Mollie] Invalid negative amount: ${amount}`)
  }
  if (amount > 0 && amount < 0.01) {
    console.warn(`[Mollie] Amount ${amount} is below €0.01 minimum for most payment methods`)
  }
  return amount.toFixed(2)
}

// Legacy export for backwards compatibility (lazy initialization)
export const mollie = new Proxy({} as ReturnType<typeof createMollieClient>, {
  get(target, prop) {
    return getMollieClient()[prop as keyof ReturnType<typeof createMollieClient>]
  }
})

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://vexnexa.com").replace(/\/+$/,"")
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`
}

export const BILLING_CONFIG = {
  supportEmail: process.env.BILLING_SUPPORT_EMAIL || "info@vexnexa.com",
  webhookUrl: appUrl("/api/mollie/webhook"),
  successUrl: appUrl("/dashboard?checkout=success"),
  cancelUrl: appUrl("/pricing?checkout=cancelled")
} as const
