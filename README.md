# VexNexa Game Studio

Seven-language game studio website featuring IpiWow. Built with Next.js, React, TypeScript and a database-free Resend contact endpoint. Hosted in the existing Vercel project.

## Local development

Use Node.js 22. Run `npm ci`, then `npm run dev`. Public pages work without credentials. For real contact delivery, copy `.env.example` to `.env.local` and configure a Resend key and a sender on a verified domain. Never commit credentials.

## Active architecture

- `app/`: current Next.js pages and API routes.
- `studio/`: translations, components, styles, validation and tests.
- `proxy.ts`: HTTP 410 for retired SaaS APIs; redirects old account/billing pages to localized support.
- `public/studio/`: original IpiWow imagery.
- `scripts/production-smoke.mjs`: safe deployment checks; never sends real email or creates payments.

Root `app/` intentionally supersedes historical `src/app/`. The old `src/`, `prisma/`, `supabase/` and implementation documents are inactive archives, not dependencies of the studio. Do not re-enable old workflows, migrations or scheduled tasks.

Six pages per language: home, IpiWow, studio, contact, privacy and support. Languages: Dutch, English, German, French, Spanish, European Portuguese and Tagalog. All 42 pages are statically generated with localized metadata, canonical URLs and reciprocal language links.

## Contact email

Production variables:

- `RESEND_API_KEY`: server-only Resend sending key.
- `RESEND_ADMIN_FROM_EMAIL`: verified sender, e.g. `VexNexa Games <updates@vexnexa.com>`. `RESEND_FROM_EMAIL` is a compatibility fallback.

Messages go only to `info@vexnexa.com`, with the visitor address as Reply-To. Validation, body limits, a honeypot, per-instance throttling and Resend idempotency keys protect the endpoint. No contact database or marketing subscription is created. Success means Resend accepted the message, not guaranteed inbox delivery.

Throttling is best-effort per running instance, not a distributed/account-wide spending cap. Monitor provider quotas and consider Vercel-level protection if abuse occurs. No paid database is required.

## Checks

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run test:smoke
npm run build
npm run test:e2e
```

Browser tests start a dedicated local production server and never send real email. CI requires no database, payment or email credentials. Coverage thresholds remain 25% statements/lines/functions and 55% branches; they were not lowered.

## Deployment and retirement

Use the existing Vercel project, Node.js 22, `npm ci`, and `npm run build`. No Prisma generation or database migration is needed. Vercel scheduled jobs are empty. Redeploy after changing email variables.

After deployment run `node scripts/production-smoke.mjs`, then one clearly labeled delivery test to the studio inbox. Check Resend acceptance and receipt in the inbox separately.

Removing Supabase code does **not** cancel billing. Downgrade only the confirmed VexNexa billing scope after checking other projects and data retention. Do not permanently delete a project to achieve a billing downgrade. The owner confirmed no paying SaaS customers or running subscriptions at conversion time.
