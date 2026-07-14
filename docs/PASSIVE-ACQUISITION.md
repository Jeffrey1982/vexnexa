# Passive acquisition loop

VexNexa now uses the free accessibility scan as the entry point for a consent-first acquisition loop.

## Flow

1. A visitor runs an automated free scan.
2. The transactional result email is sent once. Supplying an email address does not grant marketing permission.
3. The visitor may separately select an unchecked marketing opt-in.
4. VexNexa stores a hashed, 48-hour confirmation token and sends the confirmation link inside the result email.
5. Confirmation creates contact-scoped consent evidence and marks the lead as opted in.
6. `/api/cron/lead-nurture` runs daily and rechecks the database `can_send_commercial_email` function immediately before every send.
7. At most three messages are sent on day 0, 3, and 8. Copy uses stored scan facts and links to the full report, sample report, and pilot program.
8. Every delivery is idempotent, audited, and includes one-click unsubscribe. Unsubscribe adds a suppression entry and withdraws consent.

## Production requirements

- Apply `supabase/migrations/20260714090000_passive_lead_nurture.sql`.
- Configure `LEAD_CAPTURE_WORKSPACE_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`, and `CRON_SECRET`.
- Verify the sending domain in Resend and keep SPF, DKIM, and DMARC aligned.
- Keep Vercel Cron enabled for `/api/cron/lead-nurture`.

## Deliberate limits

- CSV imports and public email addresses never create permission.
- There is no automated cold-email path.
- Commercial consent is contact-specific. It cannot be reused for another employee at the same organization.
- Organization-level existing-customer evidence can qualify only where the recorded relationship is valid and has evidence.
- AI-generated or inferred claims are not used in nurture copy. Only stored scan results are referenced.

