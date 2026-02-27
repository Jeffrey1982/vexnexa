# Canonical Domain: `https://vexnexa.com` (non-www)

## Vercel Domain Configuration (confirmed)

| Domain | Role | Behavior |
|--------|------|----------|
| `vexnexa.com` | **Production (primary)** | Serves the app |
| `www.vexnexa.com` | Redirect | **308 → `vexnexa.com`** (Vercel handles this at edge) |
| `vexnexa.vercel.app` | Fallback | Production fallback |

> **Do NOT add www→non-www redirects in code** (`next.config.js`, `middleware.ts`, `vercel.json`).
> Vercel's domain-level 308 redirect is the single source of truth. Adding code-level redirects
> causes double-redirect chains that can trigger Safari's 20-redirect limit.

## Environment Variable

```
NEXT_PUBLIC_SITE_URL=https://vexnexa.com
```

Set in Vercel → Project → Settings → Environment Variables (all environments).
Used by all auth flows (`redirectTo`, `emailRedirectTo`) to guarantee non-www origin.

## Supabase Dashboard Settings

| Setting | Value |
|---------|-------|
| **Site URL** | `https://vexnexa.com` |

**Redirect URLs** (non-www only):

```
https://vexnexa.com/auth/callback
https://vexnexa.com/auth/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
```

> Do **NOT** add `www.vexnexa.com` entries. Supabase validates `redirectTo` against this list.

## Code Guardrails

### Auth `redirectTo` construction

All auth flows use `NEXT_PUBLIC_SITE_URL` instead of `window.location.origin`:

```ts
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const origin = isLocalhost
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com')
```

This pattern is used in:
- `src/app/auth/forgot-password/page.tsx` — `resetPasswordForEmail`
- `src/components/auth/ModernLoginForm.tsx` — Google OAuth
- `src/components/auth/ModernRegistrationForm.tsx` — Google OAuth + email sign-up
- `src/components/auth/AuthForm.tsx` — email sign-up
- `src/app/api/admin/users/[id]/reset-password/route.ts` — admin password reset

### Callback redirect param sanitization

`src/app/auth/callback/route.ts` uses `sanitizeRedirectParam()` which:
1. Allows relative paths (`/foo`) as-is
2. Parses absolute URLs and checks hostname against allowlist: `vexnexa.com`, `www.vexnexa.com`, `vexnexa.vercel.app`, `localhost`
3. Normalizes `www.vexnexa.com` → `vexnexa.com`
4. Blocks external hostnames (open redirect prevention) → falls back to `/dashboard`

### No hardcoded `www.vexnexa.com` in source

The only remaining references are:
- `src/lib/report/resolve-white-label.ts` — image fetch allowlist (must accept images from either domain)
- `src/app/auth/callback/route.ts` — the allowlist in `ALLOWED_HOSTS` (accepted but normalized)

## Regression Test Checklist

### Basic redirect behavior

- [ ] `https://vexnexa.com/auth/reset-password` → stays on non-www, shows reset UI
- [ ] `https://www.vexnexa.com/auth/reset-password` → **one** 308 redirect → non-www
- [ ] `https://www.vexnexa.com/dashboard` → **one** 308 redirect → non-www
- [ ] No "Load cannot follow more than 20 redirections" error in Safari

### Password reset flow

- [ ] Request password reset from `/auth/forgot-password`
- [ ] Email link starts with `https://vexnexa.com/` (not www)
- [ ] Clicking email link lands on `/auth/reset-password` (not `/login`)
- [ ] Code exchange succeeds → password form shown
- [ ] New password submission works → redirects to `/dashboard`

### Open redirect prevention

- [ ] `/auth/callback?next=https://evil.com/steal` → redirects to `/dashboard` (blocked)
- [ ] `/auth/callback?redirect=https://evil.com/` → redirects to `/dashboard` (blocked)
- [ ] `/auth/callback?next=https://www.vexnexa.com/settings` → redirects to `/settings` (normalized)

### iOS Safari cache note

Safari aggressively caches 301/308 redirects. If testing after a domain config change:
1. Open **Settings → Safari → Clear History and Website Data**, or
2. Use **Private Browsing** mode, or
3. Long-press the reload button → **Request Desktop Site** then back

This clears the redirect cache for the domain.
