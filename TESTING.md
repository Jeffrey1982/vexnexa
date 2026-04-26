# Testing guide

This project uses **Vitest** for unit tests and **Playwright** for E2E.

## Quick start

```bash
# Install deps (adds @vitest/coverage-v8, @playwright/test, @testing-library/*)
npm install

# Install Playwright browsers (one-time, ~180 MB)
npx playwright install chromium

# Unit tests
npm test                 # run once
npm run test:watch       # watch mode
npm run test:coverage    # with v8 coverage → coverage/

# E2E
npm run test:e2e         # local dev (auto-starts next dev)
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:staging # against STAGING_URL

# Everything
npm run test:all
```

## Layout

```
src/lib/__tests__/       # unit tests (vitest)
e2e/                     # Playwright specs + fixtures
test/setup.ts            # vitest globals (env + mocks)
vitest.config.ts         # vitest config + coverage thresholds
playwright.config.ts     # Playwright config (local + staging projects)
.github/workflows/test.yml
```

## Current state

- **14 test files, 357 passing, 12 skipped, 0 failing.**
- Coverage is collected for `src/lib/**`, `src/app/api/**`, and
  `src/middleware.ts`. Thresholds are intentionally conservative
  (25% lines / 55% branches) so CI goes green today; ratchet up as
  more tests land.

### What's covered

| Area | File |
|------|------|
| Pricing table + euro formatting | `pricing.test.ts`, `pricing-config.test.ts` |
| Plan entitlements matrix | `plans-entitlements.test.ts` |
| VAT / tax rule engine | `tax-rules.test.ts` |
| Mollie client helpers | `mollie-client.test.ts` |
| Axe results → score | `scoring.test.ts` |
| Google health score utilities | `score-engine.test.ts` |
| URL normalisation (crawler) | `normalize-url.test.ts`, `url.test.ts` |
| Rate limiter | `rate-limit.test.ts` |
| Admin auth gate | `admin-auth.test.ts` |
| Coupon system (behavioural parts) | `coupon-system.test.ts` |
| Report / format helpers | `report.test.ts`, `format.test.ts` |

### What's quarantined

Seven test files from earlier agent worktrees (`*.test.ts.quarantined`)
were grep-for-string tests against source files. They fail against the
current codebase and are **not** behavioural. See
`src/lib/__tests__/QUARANTINE.md`. Rewrite them as real tests or delete.

## Writing new unit tests

1. Put them under `src/lib/__tests__/<topic>.test.ts`.
2. Import `describe`, `it`, `expect` from `vitest`.
3. External services (Prisma, Supabase, Mollie, `next/headers`) are
   globally mocked in `test/setup.ts`. Override per-test with `vi.mock`.
4. For components, use `@testing-library/react` and name the file
   `*.test.tsx` — it auto-switches to the jsdom environment.

## Writing new E2E tests

1. Put them in `e2e/<flow>.spec.ts`.
2. Import `test, expect` from `./fixtures` (not `@playwright/test`
   directly) to get the `authedPage` fixture.
3. Design tests to work against both local and staging by avoiding
   hard-coded strings — prefer `getByRole`, `getByLabel`.

## CI

`.github/workflows/test.yml` runs two parallel jobs on every PR:

1. **unit** — `npm run test:coverage` + publishes the coverage report
   as an artifact and a PR comment.
2. **e2e** — builds the app and runs `npm run test:e2e:local` on
   production build. Uploads the HTML report on failure.

To tighten the gate, bump the `thresholds` block in `vitest.config.ts`
as coverage increases.

## Known gaps / TODO

- `src/app/api/**` route handlers (187 files) have no direct tests yet.
  The lib-layer they call is covered; next step is a tRPC-style
  integration harness that fetches routes in-process.
- React component rendering tests are not yet wired (jsdom config is
  ready — add `*.test.tsx` files under `src/components/__tests__/`).
- Staging E2E needs `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` and a
  stable test account with seed data.
