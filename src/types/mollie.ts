// Type definitions for Mollie API responses

export interface MolliePayment {
  id: string
  mode: 'live' | 'test'
  amount: {
    value: string
    currency: string
  }
  description: string
  status: 'open' | 'canceled' | 'pending' | 'authorized' | 'expired' | 'failed' | 'paid'
  createdAt: string
  metadata?: Record<string, unknown>
  getCheckoutUrl: () => string | null
  _links: {
    checkout?: {
      href: string
      type: string
    }
    self: {
      href: string
      type: string
    }
  }
}

export interface MollieCreatePaymentParams {
  amount: {
    value: string
    currency: string
  }
  description: string
  redirectUrl: string
  webhookUrl: string
  metadata?: Record<string, unknown>
}

export interface MollieWebhookPayload {
  id: string
}
