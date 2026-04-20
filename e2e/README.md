# Playwright E2E tests

## Running

```bash
npm run test:e2e           # default: local dev
npm run test:e2e:local     # explicit local dev
npm run test:e2e:staging   # against staging (requires env)
npm run test:e2e:ui        # Playwright UI mode (watch + debug)
```

## Environments

### Local (default)

Runs against `http://localhost:3000`. Playwright auto-starts `npm run dev`
if no server is already listening. Uses the dev-only `/api/dev/login`
route to sign in the fixture user `e2e@vexnexa.test` without email
verification.

Prereqs:
- Postgres running + `DATABASE_URL` set
- Supabase local (or test project) accessible
- A seeded user with email `e2e@vexnexa.test`. Add to `prisma/seed.mjs`
  behind a `NODE_ENV !== 'production'` guard.

### Staging

```bash
export TEST_ENV=staging
export STAGING_URL=https://staging.vexnexa.com
export E2E_USER_EMAIL=e2e+runner@vexnexa.com
export E2E_USER_PASSWORD=****
npm run test:e2e:staging
```

The fixture performs a real UI login instead of using the dev route. The
test account should have a permanent free-tier plan and a handful of
completed scans so the scan-flow test has data to assert against.

## Files

- `fixtures.ts`      — shared `test` export with `authedPage` fixture
- `smoke.spec.ts`    — unauthenticated public pages (no login needed)
- `auth.spec.ts`     — login / signup error handling & auth gate
- `scan-flow.spec.ts`— dashboard navigation + scan results page

## Troubleshooting

- `Dev login failed: 404` → the `/api/dev/login` route hasn't been added.
  The fixture assumes it exists; if you prefer UI-login everywhere, set
  `TEST_ENV=staging` and provide E2E creds even locally.
- Flaky tests → increase `expect.timeout` in `playwright.config.ts` or
  wrap selectors in `page.waitForSelector`.
