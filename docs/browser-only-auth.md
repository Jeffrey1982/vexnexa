# Browser-Only Auth Links (auth.vexnexa.com)

## Problem

VexNexa has a PWA (Progressive Web App) with a manifest scope of `"/"` on `vexnexa.com`.
When a user installs the app, **any link to `vexnexa.com/*` opens inside the installed PWA**
instead of the browser. This breaks password reset and email verification flows because:

1. The PWA may not handle hash-fragment tokens correctly.
2. Users expect email links to open in their browser, not the app.
3. The PWA service worker could interfere with auth redirects.

## Solution

Use a separate subdomain `auth.vexnexa.com` for all links sent via email.
Since both `vexnexa.com` and `auth.vexnexa.com` point to the same Vercel deployment,
the same Next.js routes are served — but the PWA manifest scope (`/` on `vexnexa.com`)
does **not** capture `auth.vexnexa.com`, so links always open in the browser.

## Environment Variables

```env
# Main site (PWA, OAuth callbacks, in-app navigation)
NEXT_PUBLIC_SITE_URL=https://vexnexa.com

# Auth subdomain for email links (password reset, signup verification)
# Falls back to NEXT_PUBLIC_SITE_URL if not set
NEXT_PUBLIC_AUTH_SITE_URL=https://auth.vexnexa.com
```

## Helper Functions

File: `src/lib/auth-origin.ts`

### `getAuthOrigin(): string`
Returns the origin for **email-delivered auth links** (password reset, signup verification).
- Production: `NEXT_PUBLIC_AUTH_SITE_URL` → `https://auth.vexnexa.com`
- Localhost: `window.location.origin` → `http://localhost:3000`

Use for:
- `resetPasswordForEmail({ redirectTo })` — password reset emails
- `signUp({ options: { emailRedirectTo } })` — signup confirmation emails

### `getSiteOrigin(): string`
Returns the main site origin for **in-browser redirects** (OAuth callbacks).
- Production: `NEXT_PUBLIC_SITE_URL` → `https://vexnexa.com`
- Localhost: `window.location.origin` → `http://localhost:3000`

Use for:
- `signInWithOAuth({ options: { redirectTo } })` — OAuth providers redirect back in-browser

## Which origin to use

| Action | Helper | Domain | Reason |
|--------|--------|--------|--------|
| Password reset email link | `getAuthOrigin()` | `auth.vexnexa.com` | Opens in browser, not PWA |
| Signup verification email link | `getAuthOrigin()` | `auth.vexnexa.com` | Opens in browser, not PWA |
| Admin-initiated password reset | `getAuthOrigin()` | `auth.vexnexa.com` | Opens in browser, not PWA |
| Google OAuth redirect | `getSiteOrigin()` | `vexnexa.com` | Already in browser; should land in app |
| In-app navigation | N/A (relative paths) | N/A | Use `/auth/login`, `/dashboard`, etc. |

## Supabase Dashboard Configuration

Add these to **Authentication → URL Configuration → Redirect URLs**:

```
https://auth.vexnexa.com/auth/reset-password
https://auth.vexnexa.com/auth/callback
https://vexnexa.com/auth/reset-password
https://vexnexa.com/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/callback
```

## Vercel Configuration

Add `auth.vexnexa.com` as a domain alias to the same Vercel project:

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add `auth.vexnexa.com`
3. Configure DNS: CNAME `auth` → `cname.vercel-dns.com` (or your Vercel alias)
4. Vercel will serve the same deployment for both domains

## Service Worker

The service worker (`public/sw.js`) already bypasses all `/auth/*` routes at line 69:

```js
if (url.pathname.startsWith('/auth/callback') || url.pathname.startsWith('/auth/')) {
  return; // Let browser handle auth routes directly without SW interference
}
```

This ensures auth routes are never cached or intercepted, regardless of domain.

## PWA Manifest

The manifest (`public/manifest.json`) has `"scope": "/"` which only applies to `vexnexa.com`.
Links to `auth.vexnexa.com` are outside this scope and will always open in the browser.

No changes to the manifest are needed.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/auth-origin.ts` | **NEW** — `getAuthOrigin()` and `getSiteOrigin()` helpers |
| `src/app/auth/forgot-password/page.tsx` | Use `getAuthOrigin()` for reset email `redirectTo` |
| `src/app/api/admin/users/[id]/reset-password/route.ts` | Use `getAuthOrigin()` for admin reset `redirectTo` |
| `src/components/auth/AuthForm.tsx` | Use `getAuthOrigin()` for signup `emailRedirectTo` |
| `src/components/auth/ModernRegistrationForm.tsx` | Use `getAuthOrigin()` for signup, `getSiteOrigin()` for OAuth |
| `src/components/auth/ModernLoginForm.tsx` | Use `getSiteOrigin()` for OAuth `redirectTo` |

## Testing

1. Set `NEXT_PUBLIC_AUTH_SITE_URL=https://auth.vexnexa.com` in Vercel env vars
2. Add `auth.vexnexa.com` as a Vercel domain alias
3. Add `https://auth.vexnexa.com/auth/reset-password` and `https://auth.vexnexa.com/auth/callback` to Supabase Redirect URLs
4. Request a password reset → verify email link points to `auth.vexnexa.com/auth/reset-password`
5. On a device with VexNexa installed as PWA → verify the link opens in the browser
6. Sign up → verify confirmation email link points to `auth.vexnexa.com/auth/callback?flow=verify`
7. Google OAuth → verify redirect goes to `vexnexa.com/auth/callback` (main domain, in-app)
