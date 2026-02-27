# Password Reset — Configuration & Troubleshooting

## Supabase Dashboard Settings

### A) Auth → URL Configuration

| Setting | Value |
|---------|-------|
| **Site URL** | `https://vexnexa.com` |

**Additional Redirect URLs** (add all):

```
https://vexnexa.com/auth/callback
https://vexnexa.com/auth/reset-password
https://scan.vexnexa.com/auth/callback
https://scan.vexnexa.com/auth/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
```

### B) Auth → Email Templates → Reset Password

Supabase PKCE flow generates a callback URL with a `code` parameter automatically.
The default template variable `{{ .ConfirmationURL }}` works for recovery emails in PKCE mode — it routes through `/auth/callback?code=...` with the `redirectTo` appended as the `next` parameter.

**Do NOT** manually construct URLs with `{{ .Code }}` unless you have disabled PKCE.

The `redirectTo` in the `resetPasswordForEmail()` call controls where the user lands after the code exchange. Our code passes:

```
redirectTo: `${window.location.origin}/auth/reset-password`
```

This ensures Supabase adds `?next=/auth/reset-password` (or the full URL) to the callback, so our callback route detects recovery and redirects accordingly.

## How the Flow Works

```
1. User clicks "Forgot password" → calls resetPasswordForEmail(email, { redirectTo: .../auth/reset-password })
2. Supabase sends email with link → https://<supabase-ref>.supabase.co/auth/v1/verify?...&redirect_to=https://vexnexa.com/auth/reset-password
3. Supabase redirects to → https://vexnexa.com/auth/callback?code=xxx&next=https://vexnexa.com/auth/reset-password
4. /auth/callback exchanges code → detects recovery (via next param or AMR) → redirects to /auth/reset-password
5. /auth/reset-password verifies session → shows password form → calls updateUser({ password })
```

### Fallback Flows

The reset page also handles these alternative flows:

- **Direct PKCE code**: `?code=xxx` — exchanges code for session on the page itself
- **OTP token_hash**: `?token_hash=xxx&type=recovery` — verifies OTP directly
- **Implicit flow hash**: `#access_token=xxx&refresh_token=xxx&type=recovery` — legacy fallback

## Middleware / Auth Guards

The middleware (`src/middleware.ts`) does **NOT** have any auth guard redirecting to `/login`.
It only handles rate limiting, security headers, UTM tracking, and legacy Shopify URL blocking.

All `/auth/*` routes are publicly accessible by default.

## Files Involved

| File | Role |
|------|------|
| `src/app/auth/forgot-password/page.tsx` | Request reset email form |
| `src/app/auth/callback/route.ts` | Exchanges PKCE code, detects recovery, redirects |
| `src/app/auth/reset-password/page.tsx` | Token exchange + new password form |
| `src/lib/supabase/client-new.ts` | Browser Supabase client |
| `src/lib/supabase/server-new.ts` | Server Supabase client (used in callback) |
| `src/middleware.ts` | Rate limiting + security headers (no auth guard) |

## Testing

### Local Testing

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/auth/forgot-password`
3. Enter your email, click send
4. Open email → click reset link
5. Confirm you land on `/auth/reset-password` (NOT `/login` or `/`)
6. Enter new password → submit
7. Confirm redirect to `/dashboard`
8. Log out → log in with new password

### Production Testing

Same flow but starting from `https://vexnexa.com/auth/forgot-password`.

### Edge Cases to Verify

- **Expired link**: Click a reset link after 24h → should show "expired" message + "Request new reset email" button
- **Invalid/tampered link**: Modify the code in URL → should show error state
- **Already logged in**: Visit `/auth/reset-password` while logged in → should still allow password change
- **No params**: Visit `/auth/reset-password` directly with no code/token → should show "invalid link" state

## Troubleshooting: "Redirects to /login"

If clicking the reset link redirects to `/login` instead of showing the reset form:

1. **Check Supabase redirect URLs**: Ensure all URLs listed above are added in Supabase Dashboard → Auth → URL Configuration
2. **Check callback route**: The `/auth/callback` route must detect recovery flow. It checks:
   - `?type=recovery` query param
   - `?next=` param containing `/auth/reset-password` (full URL or path)
   - Session AMR containing `recovery` method
3. **Check reset page session**: If the callback redirects correctly but the reset page shows "invalid link", the session cookie may not be set. Check browser DevTools → Application → Cookies for Supabase auth cookies.
4. **Check email template**: Ensure the Supabase "Reset Password" email template uses `{{ .ConfirmationURL }}` (which Supabase auto-generates for PKCE).
5. **Check CSP headers**: The Content-Security-Policy in middleware must allow `connect-src` to `*.supabase.co` and `wss://*.supabase.co`.
