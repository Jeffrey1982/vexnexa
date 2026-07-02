# VexNexa Lead Intelligence Engine

## Purpose

VexNexa is building a consent-first Lead Intelligence Engine for vexnexa.com. The system may eventually discover permitted public company sources, import company domains, scan websites for accessibility issues, qualify leads, generate evidence-backed company analyses, and draft outreach. Phase 1 is limited to the secure project foundation, lead database, CSV import, eligibility rules, and initial dashboard views.

## Architecture

- Next.js App Router, React, TypeScript strict mode, Tailwind CSS, and shadcn-style UI components.
- Supabase Auth for user sessions.
- Supabase/PostgreSQL for the lead engine schema and row-level security.
- Prisma remains in use for the existing accessibility scanning, billing, and user-domain models.
- Service-role Supabase access is server-only through `src/lib/supabaseAdmin.ts`.
- Lead Intelligence tenant isolation uses the new `lead_workspaces` and `lead_workspace_members` tables. This is the smallest clean workspace model added because the existing app has users and teams but no generic Supabase RLS tenant boundary for lead data.
- Lead Intelligence tables are managed by Supabase migrations, not Prisma migrations. Do not add these tables to Prisma unless the team intentionally decides to move the boundary; otherwise Prisma introspection can create noisy schema churn and future Prisma migrations must not drop or redefine the Lead Intelligence tables.

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Database commands:

```bash
npx supabase migration list
npx supabase db push
npx prisma validate
npx prisma migrate status
```

## Testing Requirements

- Add Vitest unit tests for domain logic, validation, duplicate handling, and outreach eligibility.
- Database integration tests live in `src/lib/lead-intelligence/integration.test.ts` and are opt-in. They require `LEAD_INT_TEST_DATABASE_IS_SAFE=true` plus test Supabase URL, anon key, service-role key, and either a local URL or `LEAD_INT_TEST_ALLOW_REMOTE_STAGING=true`.
- Run targeted tests while developing and the full test suite before release when practical.
- Do not claim a command passed unless it was actually run.
- Playwright is reserved for end-to-end flows already covered by the existing configuration.

## Database Migration Conventions

- New Supabase migrations live in `supabase/migrations`.
- Prefer additive migrations with explicit constraints, indexes, foreign keys, and RLS policies.
- Use `gen_random_uuid()` UUID primary keys unless a table already follows another convention.
- Use `timestamptz` for recorded events and audit timestamps.
- Keep service-role-only operations server-side.

## TypeScript and Validation Requirements

- Keep strict TypeScript enabled.
- Validate external input with Zod at the server boundary.
- Keep domain rules in reusable server-side modules under `src/lib`.
- Frontend code may display eligibility, but it must never override `canSendCommercialEmail`.

## Security Rules

- Never commit secrets, real API keys, production URLs with credentials, or service-role keys.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser bundles.
- Unauthenticated users must not browse lead, contact, consent, suppression, draft, scan, or audit data.
- Sensitive contact and consent data must be tenant-scoped and protected by RLS.
- Audit administrative imports and security-relevant lead decisions.

## Consent-First Outreach

- No commercial email may be sent merely because an address is publicly available.
- Imported contacts default to `permission_required` unless a separate consent or existing-customer event proves eligibility.
- Commercial email requires active recorded consent for commercial outreach or a qualifying existing-customer relationship.
- Suppression, unsubscribe, do-not-contact, withdrawn consent, expired consent, and missing evidence always block outreach.
- AI-generated claims must eventually be supported by stored evidence before they are used in customer-facing analysis or outreach.
