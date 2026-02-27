# Password Recovery — Debugging & Diagnostics

## Why recovery links can land on `/auth/login`

| Cause | Explanation |
|-------|-------------|
| **Old email template** | Before the template was updated, Supabase sent PKCE links through `/auth/callback`. If the callback failed to detect recovery, it fell through to `/auth/login`. |
| **Cached redirect** | Browsers (especially Safari) cache 301/308 redirects. A previous domain config that redirected non-www to www (or vice versa) can persist in cache even after the config is fixed. |
| **Legacy link format** | Some Supabase configurations generate links that land on `/auth/login#access_token=...&type=recovery` instead of `/auth/reset-password#...`. |
| **Auth guard** | If a layout or middleware redirects unauthenticated users to `/auth/login`, the reset-password page never loads. (Verified: VexNexa's middleware has NO auth guard.) |

## How the login interception works

`ModernLoginForm.tsx` runs a recovery check **before** anything else on mount:

1. Reads `window.location.hash` for `access_token` + `refresh_token`
2. Checks query params for `type=recovery` or `next` pointing to `/auth/reset-password`
3. If any match → sets `interceptingRecovery=true` and calls `window.location.replace('/auth/reset-password' + hash)`
4. Shows a minimal "Redirecting to password reset..." spinner (no login form flash)
5. The auth-check `useEffect` is skipped when `interceptingRecovery` is true

## How `/auth/reset-password` consumes tokens

Priority order (run-once via `useRef` guard):

1. **Hash tokens (PRIMARY)** — `#access_token=...&refresh_token=...`
   - Reads hash fragment immediately
   - Clears hash via `history.replaceState` before calling `setSession()` (prevents token leakage)
   - Calls `supabase.auth.setSession({ access_token, refresh_token })`
2. **PKCE code** — `?code=...`
   - Calls `supabase.auth.exchangeCodeForSession(code)`
3. **OTP token_hash** — `?token_hash=...&type=recovery`
   - Calls `supabase.auth.verifyOtp({ type: 'recovery', token_hash })`
4. **Existing session** — No params, but user has a valid cookie session
   - Calls `supabase.auth.getUser()` to verify
5. **Invalid** — No tokens, no session → shows "invalid link" UI with "Request new reset email" button

## Console log diagnostics

All logs use `[ResetPassword]` or `[Login]` prefix. Tokens are **never logged**.

| Log | Meaning |
|-----|---------|
| `[Login] intercepted_recovery_link=true` | Login page detected recovery tokens and is redirecting |
| `[ResetPassword] recovery_flow=hash_tokens` | Hash tokens found, calling `setSession()` |
| `[ResetPassword] recovery_flow=pkce_code` | PKCE code found, calling `exchangeCodeForSession()` |
| `[ResetPassword] recovery_flow=otp` | OTP token_hash found, calling `verifyOtp()` |
| `[ResetPassword] recovery_flow=existing_session` | No tokens but valid session exists |
| `[ResetPassword] recovery_flow=none` | No tokens and no session — shows invalid link UI |
| `[ResetPassword] setSession failed: ...` | `setSession()` returned an error (expired token, etc.) |
| `[ResetPassword] Session established for: user@...` | Session created successfully |

## Auth guard audit results

| Location | Auth guard? | Impact on recovery |
|----------|------------|-------------------|
| `src/middleware.ts` | NO — only rate limiting + security headers | None |
| `src/app/layout.tsx` | NO — no auth check | None |
| `src/app/(marketing)/layout.tsx` | NO | None |
| `src/app/dashboard/*/layout.tsx` | Some have auth checks | Not relevant — recovery uses `/auth/*` routes |
| `/auth/*` routes | All public | Correct |

## Test checklist

### Happy path (new email template — hash tokens)

- [ ] Click recovery link from email: `/auth/reset-password#access_token=...&refresh_token=...&type=recovery`
- [ ] Page shows loading spinner, then password form
- [ ] URL hash is cleaned (no tokens visible in address bar)
- [ ] Enter new password (≥8 chars) + confirm → submit
- [ ] Success message shown → redirect to `/dashboard` after 2s
- [ ] Log out → log in with new password → works

### Legacy link (lands on login)

- [ ] Visit `/auth/login#access_token=...&refresh_token=...&type=recovery`
- [ ] Login form does NOT flash (shows "Redirecting..." spinner)
- [ ] Automatically redirected to `/auth/reset-password#...`
- [ ] Password form shows and works as above

### Edge cases

- [ ] Expired token → shows "expired" message + "Request new reset email" button
- [ ] Tampered/invalid token → shows error state
- [ ] No params at all (`/auth/reset-password`) → shows "invalid link" state
- [ ] Already logged in + visit `/auth/reset-password` → shows password form (existing session)
- [ ] PKCE code flow (`?code=xxx`) still works
- [ ] OTP flow (`?token_hash=xxx&type=recovery`) still works

### Safari-specific

- [ ] No "Load cannot follow more than 20 redirections" error
- [ ] If redirect issues persist: Settings → Safari → Clear History and Website Data, or use Private Browsing
