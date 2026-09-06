# CI reliability and regression coverage

This change repairs the release checks without lowering any existing Vitest
coverage minimum or excluding production modules to make coverage pass.

## Verified locally

- Full unit suite: 2,449 passed; two explicitly opt-in database integration
  tests skipped because no isolated Supabase integration environment was supplied.
- Coverage: lines 57.06%, statements 57.24%, functions 59.58%, branches 58.34%.
- Existing minimums retained: lines/statements/functions 25%, branches 55%.
- Next.js production build and TypeScript check pass.
- ESLint passes with four pre-existing warnings (billing hook and logo images).
- CI database helper safety tests: 24 passed.
- Production smoke-checker regression tests: 12 passed.

The unit tests isolate database, billing, email, browser and network boundaries.
They do not create production accounts, charge customers, send real outreach or
scan third-party websites.

## Release-check repairs

- Keep Vitest and its V8 coverage provider on the same exact version.
- Test new Prisma migrations from a frozen, verified scratch baseline rather
  than incorrectly replaying the non-reconstructable legacy history. See
  [scratch database policy](../scripts/ci/README.md).
- Give quality and authenticated E2E jobs separate disposable PostgreSQL services.
- Prevent E2E fixtures from reusing a server connected to a real database.
- Generate Next.js route types before standalone TypeScript validation.
- Test the actual six-language sitemap policy from the shared source module.
- Validate the intentional permanent partner-program redirect and its destination.
- Avoid shell-pipeline SIGPIPE false failures on large HTML responses.

Actual scratch PostgreSQL execution and hosted deployment status must be checked
in GitHub Actions after publication; local unit tests are not evidence of either.

## Regression fixes covered

- Server-managed admin privileges; editable profile metadata cannot grant them.
- IPv6 private-address validation and guarded, bounded webhook test delivery.
- Unsubscribe persistence failures no longer receive a success acknowledgement.
- Invoice delivery requires provider evidence and the correct persisted quote ID.
- Add-ons remain pending until the billing provider accepts the subscription.
- Explicit Assurance reconciliation payment IDs require a user-owned quote.
- Scanner input validation, quota/auth error responses and deadline cleanup.
- Failed scans do not consume the successful-scan allowance.
- Missing PageSpeed measurements remain null rather than fabricated scores.
- Benchmark aggregates respect the same real-scan and tenant filter as analytics.
- Schedule partial edits preserve frequency and recalculate cleared date bounds.
- Coupon search is not overwritten by the expired-status filter.
- Health probes recognize returned Supabase errors and preserve failure severity.

## Remaining product work — not a claim of full automation

Some legacy monitoring screens use unfinished demo endpoints. Alert-rule
configuration, alert resolution and regression acknowledgement endpoints are now
development-only: production responds 404 instead of exposing shared in-memory
recipient data or falsely claiming durable updates. Implement tenant-scoped
persistent storage and matching UI states before enabling these features.

Other older analytics still contain heuristic or placeholder content (including
compliance deadlines, benchmark reference values and some report correlations).
These are not established legal/compliance findings or measured causes. Review
and replace them with sourced evidence before relying on them in customer-facing
claims. Automated accessibility scans are not a complete manual compliance audit.

The SSRF guard validates resolved addresses but does not pin the validated IP to
the outbound socket. Multi-table unsubscribe updates are not yet transactional;
this change detects failures and avoids false success, but does not claim atomicity.

Production migration history reconciliation remains a separate operation requiring
schema verification and backups. No production database reset or history rewrite
is included. Consent and suppression rules continue to govern commercial email;
passing CI does not authorize unsolicited outreach or guarantee customer acquisition.
