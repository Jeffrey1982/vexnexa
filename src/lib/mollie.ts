import { createMollieClient } from "@mollie/api-client"

let mollieClient: ReturnType<typeof createMollieClient> | null = null

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

// Legacy export for backwards compatibility (lazy initialization)
export const mollie = new Proxy({} as ReturnType<typeof createMollieClient>, {
  get(target, prop) {
    return getMollieClient()[prop as keyof ReturnType<typeof createMollieClient>]
  }
})

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/,"")
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`
}

export const BILLING_CONFIG = {
  supportEmail: process.env.BILLING_SUPPORT_EMAIL || "support@vexnexa.com",
  webhookUrl: appUrl("/api/mollie/webhook"),
  successUrl: appUrl("/dashboard?checkout=success"),
  cancelUrl: appUrl("/pricing?checkout=cancelled")
} as const
