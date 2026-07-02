# VexNexa

Next.js 16 + TypeScript + Tailwind + Prisma + Supabase accessibility scanning platform.

## Stack

- Next.js App Router with React 19
- Prisma + Supabase Postgres
- Supabase Auth
- Tailwind CSS
- Playwright / axe-core scanning runtime
- Vitest unit tests and Playwright E2E tests
- Zod validation for Lead Intelligence import boundaries

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npx tsc --noEmit
```

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in local Supabase, database, billing, email, and cron values.
3. Run `npx prisma generate`.
4. Apply Prisma migrations for the existing app models and Supabase migrations for Lead Intelligence.
5. Start the app with `npm run dev`.

Never commit `.env`, `.env.local`, Supabase service-role keys, provider API keys, or production database URLs.

Before production deploys, run:

```bash
npm run lint
npx tsc --noEmit
npm test
npx prisma migrate status
npx next build
```

## Prisma + Supabase

Prisma reads database configuration from `.env`.

Supabase needs two database URLs:

- `DATABASE_URL`: transaction pooler, usually port `6543`, for runtime queries.
- `DIRECT_URL`: direct connection, usually port `5432`, for migrations.

Encode special characters in database passwords. In PowerShell:

```powershell
[System.Uri]::EscapeDataString("YOUR_PASSWORD")
```

Safe migration commands:

```bash
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
```

Avoid destructive commands against production databases. See [DATABASE_SAFETY.md](./DATABASE_SAFETY.md).

Supabase migrations live in `supabase/migrations`. The Lead Intelligence foundation is created by:

```bash
npx supabase db push
```

The Phase 1 Lead Intelligence tables are tenant-scoped with `lead_workspaces` and `lead_workspace_members`. Existing Prisma `User` and `Team` models remain intact; the new workspace model exists to give Supabase RLS a clean tenant boundary.

## Lead Intelligence Phase 1

Current scope:

- Lead workspace tenant model.
- Organization, contact, lead, consent, website scan placeholder, scan finding, email draft, suppression, and audit-event tables.
- Database `can_send_commercial_email` function.
- Server-side `canSendCommercialEmail` domain function.
- Authenticated dashboard pages for leads, lead detail, CSV import, suppression list, and lead audit events.
- Admin-only CSV import with Zod validation, domain normalization, email normalization, deduplication, audit logging, and import limits.

Explicitly deferred:

- Website scraping.
- Automated lead discovery.
- Claude or other AI integration.
- AI-generated outreach claims.
- Actual commercial email sending.
- Campaign workers and email provider integration.

No email may be sent merely because an address is publicly available. Imported contacts default to `permission_required`; outreach requires active recorded consent or a qualifying existing-customer relationship with stored evidence.

Lead Intelligence uses Supabase directly through server-side modules in `src/lib/lead-intelligence`:

- `repository.ts` reads tenant-scoped dashboard data with the server-only Supabase admin client.
- `import-service.ts` persists validated CSV imports and audit events.
- `outreach-eligibility.ts` mirrors the PostgreSQL `can_send_commercial_email` decision for server workers and UI explanation.

Prisma does not need to know about these tables for Phase 1. Existing Prisma migrations manage the historical scanner, billing, user, team, and report models. Future Lead Intelligence database changes should be additive Supabase migrations under `supabase/migrations`, with RLS and service-role boundaries reviewed before deployment.

Optional database integration tests are guarded so they do not run against production by accident:

```bash
LEAD_INT_TEST_DATABASE_IS_SAFE=true \
LEAD_INT_TEST_SUPABASE_URL=http://127.0.0.1:54321 \
LEAD_INT_TEST_SUPABASE_ANON_KEY=... \
LEAD_INT_TEST_SUPABASE_SERVICE_ROLE_KEY=... \
node node_modules/vitest/vitest.mjs run src/lib/lead-intelligence/integration.test.ts
```

For a dedicated staging project only, also set `LEAD_INT_TEST_ALLOW_REMOTE_STAGING=true`.

## CSV Import Format

Sample file: `examples/lead-import-sample.csv`.

Required columns:

```csv
company_name,website_url,country_code,industry,source_url,contact_email
Example Accessibility BV,https://www.example.com/,NL,Digital services,https://example.com/about,hello@example.com
```

Import limits are controlled by:

- `LEAD_IMPORT_MAX_BYTES`
- `LEAD_IMPORT_MAX_ROWS`

Dangerous spreadsheet formula prefixes are rejected. Domains are normalized for deduplication, but meaningful subdomains are preserved.

## Admin Auth

Admin access is session-based:

- User must be authenticated through Supabase.
- User must have `User.isAdmin = true` in Prisma, or their email must be listed in `ADMIN_EMAILS`.
- Admin API helpers use the current session cookies, not `ADMIN_DASH_SECRET`.

The old `x-admin-secret` / `ADMIN_DASH_SECRET` path has been removed from admin routes.

## Diagnostic Routes

Test and diagnostic routes are development-only where they expose configuration, send test email, touch the database, or run runtime checks.

Examples:

- `/api/auth/diagnose`
- `/api/auth-test`
- `/api/chromium-test`
- `/api/dbtest`
- `/api/debug-db`
- `/api/diagnose-email`
- `/api/migrate`
- `/api/test-*`

In production these should return `404` via `requireDevelopment()`.

## Scanning Runtime

The scan APIs use Playwright and run in `runtime = "nodejs"`.

The primary scanner uses `@axe-core/playwright`. If a page needs the UMD axe fallback during local debugging:

```bash
USE_AXE_UMD=1 npm run dev
```

## Project Layout

- `src/app`: Next.js routes, pages, API handlers.
- `src/components`: shared UI and feature components.
- `src/lib`: service logic, auth, scanning, billing, reports, scoring.
- `prisma`: Prisma schema and migrations.
- `supabase`: Supabase migrations and email templates.
- `e2e`: Playwright tests.
- `test`: Vitest setup.
- `docs`: architecture, design, notes, and archived implementation records.

## Documentation

- [Testing](./TESTING.md)
- [Database Safety](./DATABASE_SAFETY.md)
- [Design Docs](./docs/design/)
- [Architecture Docs](./docs/architecture/)
- [Notes](./docs/notes/)
- [Archive](./docs/archive/)
