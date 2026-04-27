/**
 * Alias route for the Mollie webhook.
 *
 * The canonical Mollie webhook handler lives at `/api/mollie/webhook`, but the
 * Mollie dashboard is configured (historically) to call `/api/webhooks/mollie`.
 * Without this file, Next.js would resolve that URL to `/api/webhooks/[id]`
 * (which only exports PUT/DELETE) and return 405 Method Not Allowed to Mollie.
 *
 * This file re-exports the real handler so both URLs stay functional.
 */
export const dynamic = 'force-dynamic'

export { POST } from '@/app/api/mollie/webhook/route'

// Mollie occasionally hits the webhook with GET for reachability checks.
// Returning 200 avoids noisy 405s in the dashboard.
export async function GET() {
  return new Response('ok', { status: 200 })
}
