# Scratch database verification

This directory is **CI-only**. It is not a production baseline, migration repair,
or a claim that the historical Prisma migrations replay successfully.

The legacy migration history contains changes dated before its initial tables
and does not fully reconstruct the current Prisma schema. Editing or marking
those migrations applied in production would conceal that discrepancy. Instead,
CI creates a fresh isolated PostgreSQL database from a frozen schema snapshot:

1. Verify checksums for every legacy migration and the frozen baseline.
2. Generate a temporary Prisma migration from `baseline.prisma`.
3. Append all new, forward-dated migrations from `prisma/migrations`.
4. Run Prisma `migrate deploy` and `migrate status` on that temporary chain.
5. Compare the resulting database to the current `prisma/schema.prisma` with
   `migrate diff --exit-code`; schema changes without matching migrations fail.

No history is rewritten, no migrations are silently marked applied, and no
database is reset. Supabase-managed Lead Intelligence tables stay outside this
Prisma-only check and are not dropped or redefined.

The helper refuses to run without `CI=true`,
`CI_SCRATCH_DATABASE_IS_SAFE=true`, and identical `DATABASE_URL` / `DIRECT_URL`
values pointing at a loopback PostgreSQL database named `vexnexa_ci_scratch`.
It never loads repository `.env` files. GitHub Actions supplies an ephemeral
PostgreSQL service with disposable, non-secret credentials.

Run helper safety tests with:

```sh
node --test scripts/ci/scratch-database.test.mjs
```

Do not regenerate the frozen baseline for normal schema changes. Add a new
`YYYYMMDDHHMMSS_description` migration after the latest legacy migration instead.
Changing the baseline or historical checksum manifest requires a separately
reviewed re-baseline. Production history reconciliation remains a separate
operational task requiring a verified production schema and backups.
