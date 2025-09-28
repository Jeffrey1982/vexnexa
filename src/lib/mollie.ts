import { createMollieClient } from "@mollie/api-client"

if (!process.env.MOLLIE_API_KEY) {
  throw new Error("MOLLIE_API_KEY environment variable is required")
}

export const mollie = createMollieClient({ 
  apiKey: process.env.MOLLIE_API_KEY! 
})

export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/+$/,"")
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`
}

export const BILLING_CONFIG = {
  supportEmail: process.env.BILLING_SUPPORT_EMAIL || "info@vexnexa.com",
  webhookUrl: appUrl("/api/mollie/webhook"),
  successUrl: appUrl("/dashboard?checkout=success"),
  cancelUrl: appUrl("/pricing?checkout=cancelled")
} as const