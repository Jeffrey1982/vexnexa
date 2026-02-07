# Testing Checklist

## Verification Flow

1. Signup triggers email
- Create a new user via your registration page.
- Confirm the email is sent from Supabase (Auth confirmation email).

2. Clicking verify link hits /auth/callback and ends in /auth/verified
- Open the verification link from the email.
- Confirm it loads `https://<site>/auth/callback?...` and then redirects to `/auth/verified`.

3. Session exists after verification; dashboard loads
- From `/auth/verified`, click **Go to dashboard**.
- Confirm you are authenticated and the dashboard loads.

4. Failure mode routes to /auth/verify-error with readable message
- Open a deliberately invalid/expired confirmation link.
- Confirm you are redirected to `/auth/verify-error?reason=...`.

## Email Rendering

1. Gmail
- Verify the button renders as a solid color (no gradients).
- Verify the card layout is centered and spacing looks correct.
- Verify the fallback link wraps and is selectable.

2. Outlook
- Verify the CTA button is not clipped and has correct padding.
- Verify the layout remains table-based and aligned.
- Verify no background-image gradients appear.
