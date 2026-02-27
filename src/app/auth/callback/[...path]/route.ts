import { NextRequest, NextResponse } from 'next/server'

/**
 * Catch-all route: /auth/callback/<anything>
 *
 * Supabase PKCE flow can produce malformed URLs like:
 *   /auth/callback/auth/reset-password?code=xxx
 * instead of the correct:
 *   /auth/callback?next=/auth/reset-password&code=xxx
 *
 * This handler recovers from that by extracting the captured sub-path,
 * converting it into a ?next= query parameter, and redirecting to
 * the canonical /auth/callback route so the main handler can process it.
 *
 * If no code/token params exist (nothing to exchange), we redirect
 * directly to the captured path to avoid an unnecessary round-trip.
 */

/** Paths we allow as redirect targets from the captured sub-path. */
const ALLOWED_NEXT_PREFIXES: readonly string[] = [
  '/auth/reset-password',
  '/auth/login',
  '/auth/verified',
  '/dashboard',
  '/onboarding',
  '/',
] as const

function isAllowedPath(path: string): boolean {
  return ALLOWED_NEXT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + '?') || path.startsWith(prefix + '/')
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params
  const capturedPath: string = '/' + path.join('/')
  const requestUrl = new URL(request.url)

  // Preserve original query params
  const originalSearch: string = requestUrl.search

  // Check if there's a code to exchange (PKCE flow) or other auth params
  const hasCode: boolean = requestUrl.searchParams.has('code')
  const hasTokenHash: boolean = requestUrl.searchParams.has('token_hash')

  console.log('[Callback CatchAll] Intercepted malformed path:', {
    capturedPath,
    hasCode,
    hasTokenHash,
    originalSearch: originalSearch ? '[present]' : '[empty]',
  })

  if (hasCode || hasTokenHash) {
    // There's a code/token to exchange — redirect to canonical /auth/callback
    // with the captured path as ?next= so the main handler processes the exchange
    // and then redirects to the intended destination.
    const callbackUrl = new URL('/auth/callback', requestUrl.origin)

    // Copy all existing search params
    requestUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })

    // Set the next param to the captured path (validated)
    const nextPath: string = isAllowedPath(capturedPath) ? capturedPath : '/dashboard'
    callbackUrl.searchParams.set('next', nextPath)

    console.log('[Callback CatchAll] Redirecting to canonical callback with next=' + nextPath)
    return NextResponse.redirect(callbackUrl)
  }

  // No code to exchange — redirect directly to the captured path
  // This handles cases where someone bookmarked a broken URL
  const directTarget: string = isAllowedPath(capturedPath)
    ? capturedPath + originalSearch
    : '/dashboard'

  console.log('[Callback CatchAll] No code param, redirecting directly to:', directTarget)
  return NextResponse.redirect(new URL(directTarget, requestUrl.origin))
}
