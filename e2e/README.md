# Playwright E2E tests

## Public checks (no database writes)

```sh
npm run test:e2e -- e2e/smoke.spec.ts e2e/auth.spec.ts
```

These tests cover marketing routes, responsive layout, an actual language
change, login validation, and the unauthenticated dashboard gate. The invalid
login response is intercepted in the browser: no credentials reach a real
Supabase service, no account is created, and no email is sent.

The default URL is `http://localhost:3000`. Public checks can reuse an existing
local preview. Set `E2E_LOCAL_PORT=3001` to use a separate port.

## Authenticated local checks

The full suite starts a **development** server, because `/api/dev/login` is
deliberately unavailable in production. Do not add a production auth bypass.
That route creates the fixture user `e2e@vexnexa.test`, a site record and one
completed scan with score 92. It does not crawl `example.com` or call a scanner.
The tests verify the stored data, sites navigation, findings and HTML report.
Missing data fails the suite; it is never silently skipped.

Requirements:

- A disposable PostgreSQL database named `vexnexa_ci_scratch` on loopback.
- `DATABASE_URL` and `DIRECT_URL` explicitly set to the same scratch connection.
- `E2E_DATABASE_IS_SAFE=true` as an explicit opt-in to fixture writes.
- The schema initialized by the guarded CI scratch helper.

Fixture runs never reuse an existing preview server, since its environment may
point at a real database. The safety check rejects remote hosts, other database
names, missing opt-in and mismatched connections before calling dev-login.

GitHub Actions provisions the database and calls
`node scripts/ci/scratch-database.mjs` before Playwright. See
[`scripts/ci/README.md`](../scripts/ci/README.md) for its frozen baseline and
forward-migration checks. This does not reconcile production migration history.

For an equivalent disposable local run, provision that database first and set
the following in PowerShell (credentials below are deliberately fake examples):

```powershell
$env:CI = 'true'
$env:CI_SCRATCH_DATABASE_IS_SAFE = 'true'
$env:E2E_DATABASE_IS_SAFE = 'true'
$env:E2E_LOCAL_PORT = '3001'
$env:DATABASE_URL = 'postgresql://test:test@localhost:5432/vexnexa_ci_scratch'
$env:DIRECT_URL = $env:DATABASE_URL
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
$env:SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
$env:MOLLIE_API_KEY = 'test_ci_key'
node scripts/ci/scratch-database.mjs
npm run test:e2e:local
```

The scratch helper requires an empty/disposable database, explicit `CI=true`
and the safety flag. It does not load repository `.env` files or reset databases.

## Staging

Staging must be explicitly configured with `TEST_ENV=staging`, an HTTPS
`STAGING_URL` (not `vexnexa.com`), `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.
The dedicated test account must already have at least one completed scan.
The fixture uses normal UI login; dev-login is never called on staging.
Run `npm run test:e2e:staging` only against an authorized test deployment.

## Troubleshooting

- `E2E_DATABASE_IS_SAFE` / scratch validation error: configure the disposable
  local database explicitly, or run only public checks. Do not enable a remote
  database override to bypass the guard.
- `Dev login failed: 404`: a production server was used. Use the development
  server on a separate port; the production restriction is intentional.
- No completed scan / scans API failure: inspect the scratch setup and dev-login
  output. The tests now fail these cases instead of reporting misleading success.
- Reports, traces and failure screenshots are written to `playwright-report`
  and `test-results`; CI uploads the report on failure.
