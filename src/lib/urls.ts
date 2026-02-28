/**
 * Central URL helpers for VexNexa.
 *
 * - `getAuthSiteUrl()` — origin for email-opened auth links (auth.vexnexa.com in prod).
 *   Uses a separate subdomain so password-reset / verification links open in the
 *   **browser** instead of the installed PWA (whose manifest scope is "/" on vexnexa.com).
 *
 * - `getSiteUrl()` — origin for in-app links (OAuth redirects, etc.) that should land
 *   inside the app / PWA.
 *
 * - `buildAuthUrl(path)` — convenience to join `getAuthSiteUrl()` + a path, ensuring
 *   no double slashes.
 *
 * Env vars:
 *   NEXT_PUBLIC_SITE_URL      = https://vexnexa.com       (main site)
 *   NEXT_PUBLIC_AUTH_SITE_URL  = https://auth.vexnexa.com  (browser-only auth subdomain)
 */

/** Strip www. from any vexnexa.com origin to enforce canonical non-www host. */
function normalizeOrigin(origin: string): string {
  return origin.replace(/^(https?:\/\/)www\.vexnexa\.com/, '$1vexnexa.com')
}

/**
 * Returns the main site origin.
 * In local dev (localhost), returns the current window origin.
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return window.location.origin
  }

  return normalizeOrigin(
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://vexnexa.com'
  )
}

/**
 * Returns the auth-subdomain origin for email-opened links.
 * In local dev (localhost), returns the current window origin so links hit the dev server.
 */
export function getAuthSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return window.location.origin
  }

  return normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://vexnexa.com'
  )
}

/**
 * Joins `getAuthSiteUrl()` with a path, ensuring exactly one `/` between them.
 *
 * @example buildAuthUrl('/auth/reset-password') → "https://auth.vexnexa.com/auth/reset-password"
 */
export function buildAuthUrl(path: string): string {
  const base: string = getAuthSiteUrl().replace(/\/+$/, '')
  const cleanPath: string = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}
