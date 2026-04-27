import { Suspense } from 'react'
import CheckoutReturnClient from './CheckoutReturnClient'

export const dynamic = 'force-dynamic'

/**
 * Server-shell for the post-Mollie redirect page.
 *
 * Mollie always redirects to the same URL regardless of payment outcome
 * (paid / canceled / expired / failed). This page reads the Mollie
 * `paymentId` from the query string, fetches the real status from our
 * `/api/mollie/payment-status` endpoint, and routes the user accordingly.
 */
export default function CheckoutReturnPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container flex flex-col items-center justify-center max-w-4xl mx-auto">
        <Suspense fallback={<CheckoutReturnFallback />}>
          <CheckoutReturnClient />
        </Suspense>
      </div>
    </div>
  )
}

function CheckoutReturnFallback() {
  return (
    <div className="w-full max-w-xl text-center py-16">
      <div className="mx-auto w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}
