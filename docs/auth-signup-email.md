# Signup Email Delivery — Troubleshooting & Configuration

## How signup works in VexNexa

1. User fills out `ModernRegistrationForm` → calls `supabase.auth.signUp()` with `emailRedirectTo`
2. Supabase creates the user in `auth.users` and (if "Confirm email" is ON) sends a confirmation email
3. User clicks email link → lands on `/auth/callback?flow=verify&code=...`
4. Callback route exchanges code for session, calls `ensureUserInDatabase()` to upsert into Prisma `User` table
5. User is redirected to `/auth/verified`

## Supabase Dashboard Checklist

### 1. Auth → Providers → Email

| Setting | Recommended Value | Notes |
|---------|------------------|-------|
| **Enable Email provider** | ON | Required for email/password signup |
| **Confirm email** | ON | If OFF, users are auto-confirmed and no email is sent |
| **Double confirm email changes** | ON | Security best practice |
| **Secure email change** | ON | Requires confirmation from both old and new email |

> **If "Confirm email" is OFF**, Supabase will NOT send a confirmation email. The user is immediately confirmed. This is likely why emails appear missing.

### 2. Auth → Email Templates

Verify the **Confirm signup** template exists and contains `{{ .ConfirmationURL }}`.

Default template should include:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
```

### 3. Auth → SMTP Settings

| Option | Details |
|--------|---------|
| **Default (Supabase)** | Uses Supabase's built-in SMTP. Limited to ~4 emails/hour in free tier, ~30/hour on Pro. |
| **Custom SMTP** | Configure with your own SMTP provider (e.g., Resend, SendGrid, Postmark). Required for reliable delivery at scale. |

If using **default Supabase SMTP**:
- Emails come from `noreply@mail.app.supabase.io`
- Very likely to land in **spam/promotions** folder
- Rate-limited: ~4/hour on free plan
- Check Supabase Dashboard → Auth → Logs for delivery status

If using **custom SMTP** (recommended for production):
- Configure in Supabase Dashboard → Project Settings → Auth → SMTP Settings
- Use a reputable provider (Resend, SendGrid, Postmark)
- Ensure SPF, DKIM, DMARC records are configured for your sending domain

### 4. Auth → URL Configuration

| Setting | Value |
|---------|-------|
| **Site URL** | `https://vexnexa.com` |
| **Redirect URLs** | Must include: `https://vexnexa.com/auth/callback`, `http://localhost:3000/auth/callback` |

### 5. Auth → Rate Limits

Check Auth → Rate Limits in Supabase Dashboard:
- **Email signup**: Default 60/hour
- **Email send**: Default varies by plan

## Common Issues

### "User created but no email received"

1. **Most likely: "Confirm email" is OFF** → Turn it ON in Auth → Providers → Email
2. **Rate limited** → Check Auth → Logs for rate limit errors
3. **Spam folder** → Check spam/promotions/junk
4. **Custom SMTP misconfigured** → Check SMTP credentials, test with Auth → Logs
5. **Email template blank** → Verify template contains `{{ .ConfirmationURL }}`

### "Email received but link doesn't work"

1. **Redirect URL mismatch** → Ensure `emailRedirectTo` in code matches a URL in Supabase's Redirect URLs list
2. **Link expired** → Default expiry is 24 hours. User needs to request a new one.
3. **www vs non-www** → Ensure `NEXT_PUBLIC_SITE_URL=https://vexnexa.com` (non-www)

### "signUp() hangs or times out"

1. **SMTP connection failing** → If custom SMTP is configured but credentials are wrong, signUp blocks waiting for email send
2. Our code adds a 25-second timeout to catch this case
3. Check Supabase logs for SMTP errors

## Resend Confirmation Email

The signup success screen includes a "Resend confirmation email" button that calls:
```ts
supabase.auth.resend({ type: 'signup', email: signupEmail })
```

This is rate-limited by Supabase (typically 60 seconds between resends).

## Verifying Email Delivery in Supabase Logs

1. Go to Supabase Dashboard → Auth → Logs
2. Filter by the user's email
3. Look for:
   - `signup` event → User created successfully
   - `email_sent` → Email dispatched
   - Any error events related to email delivery

## Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://vexnexa.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Files Involved

| File | Role |
|------|------|
| `src/components/auth/ModernRegistrationForm.tsx` | Signup form with `signUp()` + resend button |
| `src/components/auth/AuthForm.tsx` | Legacy signup form (also has `signUp()`) |
| `src/app/auth/callback/route.ts` | Handles email confirmation link, syncs user to DB |
| `src/lib/user-sync.ts` | `ensureUserInDatabase()` — upserts Supabase user into Prisma |
| `src/app/api/sync-user/route.ts` | Manual sync endpoint |
