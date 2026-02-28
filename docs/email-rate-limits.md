# Email Rate Limits (429 over_email_send_rate_limit)

## Problem

Supabase Auth enforces rate limits on email-sending endpoints (`/recover`, `/signup`, `/resend`).
When exceeded, the API returns HTTP 429 with `error_code=over_email_send_rate_limit`.
Users see no email and no useful error message unless the UI handles this explicitly.

## Supabase Default Limits

| Endpoint | Default Limit |
|----------|--------------|
| `/recover` (password reset) | 1 per 60s per email |
| `/signup` | 1 per 60s per email |
| `/resend` | 1 per 60s per email |
| Global SMTP | Depends on provider (see below) |

These limits are **per email address**, not per IP. Supabase's built-in email (via Resend)
has additional global throughput limits on the free tier.

## How We Handle It

### Shared Hook: `useAuthCooldown`

File: `src/hooks/use-auth-cooldown.ts`

- **Per-email cooldown** persisted in `localStorage` (survives page refresh)
- **Configurable duration** via `NEXT_PUBLIC_AUTH_COOLDOWN_SEC` (default: 180 seconds)
- **Countdown UI** showing `MM:SS` until the button re-enables
- **429 detection** via `isRateLimitError()` helper that checks:
  - `error.status === 429`
  - `error.message` containing "rate", "limit", "429"

### Where It's Used

| Component | Action | Cooldown Key |
|-----------|--------|-------------|
| `forgot-password/page.tsx` | `resetPasswordForEmail` | `vx:cooldown:recover:<email>` |
| `ModernRegistrationForm.tsx` | `resend({ type: 'signup' })` | `vx:cooldown:signup-resend:<email>` |

### Behavior

1. **On successful send**: Start cooldown (prevents immediate re-click)
2. **On 429 error**: Start cooldown + show rate-limit message
3. **On page reload**: Restore remaining cooldown from localStorage
4. **On email change**: Reset cooldown (new email = new scope)

## Console Logging

All auth flows log structured events without exposing tokens:

```
[ForgotPassword] auth_recover_rate_limited
[Signup] auth_signup_rate_limited
[Signup] auth_resend_rate_limited
[ResetPassword] recovery_flow=hash_tokens|pkce_code|otp|existing_session|none
[ResetPassword] failure_reason=expired_or_invalid_token|expired_or_invalid_code|expired_or_invalid_otp|session_error|exchange_error|otp_error
```

## Configuration

```env
# Cooldown duration in seconds (default: 180 = 3 minutes)
NEXT_PUBLIC_AUTH_COOLDOWN_SEC=180
```

Set a lower value (e.g. 60) for development/testing.

## Testing Guidance

### During Development

1. Supabase free tier has very low email limits (3-4 per hour via built-in Resend)
2. Use a custom SMTP provider for higher throughput (see below)
3. Monitor Supabase Auth logs: Dashboard → Authentication → Logs
4. Look for `over_email_send_rate_limit` entries

### Reproducing 429

1. Go to `/auth/forgot-password`
2. Enter an email and click "Send"
3. Wait for success, then refresh (cooldown resets on new page load only if timer expired)
4. Click "Send" again immediately → should show cooldown timer
5. If cooldown expired, click rapidly → Supabase will return 429 → UI shows rate-limit message

## SMTP Recommendation

For production, configure a custom SMTP provider in Supabase Dashboard → Settings → Auth → SMTP:

| Provider | Free Tier | Recommended For |
|----------|-----------|----------------|
| **Resend** | 3,000/month | Small scale |
| **Postmark** | 100/month | Transactional focus |
| **SendGrid** | 100/day | Medium scale |
| **AWS SES** | 62,000/month (with EC2) | Production scale |

Custom SMTP bypasses Supabase's built-in email limits and gives you:
- Higher throughput
- Custom sender address
- Delivery tracking
- Better deliverability (SPF/DKIM on your domain)

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/use-auth-cooldown.ts` | **NEW** — Shared cooldown hook + `isRateLimitError()` |
| `src/lib/urls.ts` | **NEW** — `getSiteUrl()`, `getAuthSiteUrl()`, `buildAuthUrl()` central URL helpers |
| `src/app/auth/forgot-password/page.tsx` | 429 handling + cooldown timer, uses `buildAuthUrl()` |
| `src/components/auth/ModernRegistrationForm.tsx` | 429 handling on signup + resend cooldown, uses `buildAuthUrl()` |
| `src/app/auth/reset-password/page.tsx` | `isTokenError()` detection + structured `failure_reason` logs + PWA Copy URL |
| `src/app/auth/callback/route.ts` | `auth.vexnexa.com` in `ALLOWED_HOSTS` + `flow=signup` accepted |
