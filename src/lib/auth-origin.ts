/**
 * Returns the origin URL to use for auth-related email links.
 *
 * In production, this returns NEXT_PUBLIC_AUTH_SITE_URL (e.g. https://auth.vexnexa.com)
 * so that password-reset / verification links open in the **browser** instead of the
 * installed PWA app. The PWA manifest scope is "/" on vexnexa.com, which means any link
 * to vexnexa.com/auth/* would be captured by the PWA. Using a separate subdomain
 * (auth.vexnexa.com) keeps the same Vercel deployment but avoids PWA deep-linking.
 *
 * In local development (localhost), returns the current window origin so links work
 * against the local dev server.
 *
 * Usage:
 *   const authOrigin = getAuthOrigin()
 *   // emailRedirectTo: `${authOrigin}/auth/callback?flow=verify`
 *   // redirectTo:      `${authOrigin}/auth/reset-password`
 */
export function getAuthOrigin(): string {
  // Client-side: detect localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return window.location.origin
  }

  // Prefer dedicated auth subdomain, fall back to main site URL
  return (
    process.env.NEXT_PUBLIC_AUTH_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://vexnexa.com'
  )
}

/**
 * Returns the main site origin (for non-auth links like OAuth callbacks that
 * should land in the app).
 */
export function getSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return window.location.origin
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://vexnexa.com'
  )
}
