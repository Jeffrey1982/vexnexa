# VexNexa Game Studio

## Purpose and boundary

The owner approved converting VexNexa from an accessibility SaaS to a seven-language game studio website featuring IpiWow, retaining Vercel and Resend. There are no paying SaaS customers or running subscriptions. The former Lead Intelligence architecture is retired.

- Active Next.js App Router code lives in root `app/`, with reusable modules in `studio/`.
- Root `proxy.ts` blocks retired APIs and redirects retired SaaS pages to support.
- Historical `src/`, `prisma/`, `supabase/` and old documents are inactive archives. Do not restore dependencies, migrations, payment APIs or crons without a new explicit request.
- Public pages are statically generated in `nl`, `en`, `de`, `fr`, `es`, `pt` and `tl`.
- Only `/api/contact` and `/api/health` are active application APIs.

## Commands and verification

Use Node.js 22. Run `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:smoke`, `npm run build` and `npm run test:e2e` as appropriate.

Add Vitest tests for validation, translations, routing and contact behavior. Use the browser suite for multilingual navigation, responsive changes and contact flows. Keep existing coverage minimums; never claim tests passed unless executed. CI and browser tests must not send real email or create payments.

## Design and content

Use current `PRODUCT.md` and `DESIGN.md`. Preserve the approved cyan, ivory, mint and navy design, original IpiWow assets, semantic controls, reduced-motion behavior and mobile layouts. Never invent reviews, customer numbers, awards, platforms or pricing. Keep seven translations complete and metadata consistent.

## Security and operations

- Keep TypeScript strict. Validate external input with Zod at the server boundary.
- Never commit secrets, real keys, credential-bearing URLs, private sales files or account screenshots.
- Keep Resend keys server-only. Contact sends only to the studio inbox with visitor Reply-To, a fixed subject and plain text.
- Preserve same-origin checks, input/body limits, honeypot, idempotent retries and best-effort per-instance throttling. Do not describe in-memory throttling as a global spending cap.
- No automatic subscriptions, harvesting, outbound marketing, billing, tracking or database storage.
- Removing provider code does not cancel billing. Check the exact account and other projects before downgrading. Never permanently delete a project as a substitute for canceling charges.
- Preserve historical data and user-owned files. Prefer reversible changes; no destructive Git resets.

## Historical data

If separately authorized to work on archived SaaS data, retain tenant isolation and consent/suppression rules. Public addresses do not authorize commercial email. Do not re-enable old migrations or service-role access for routine studio maintenance.
