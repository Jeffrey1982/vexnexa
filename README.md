# VexNexa

Next.js 16 + TypeScript + Tailwind + Prisma + Supabase accessibility scanning platform.

## Stack

- Next.js App Router with React 19
- Prisma + Supabase Postgres
- Supabase Auth
- Tailwind CSS
- Playwright / axe-core scanning runtime
- Vitest unit tests and Playwright E2E tests

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npx tsc --noEmit
```

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
