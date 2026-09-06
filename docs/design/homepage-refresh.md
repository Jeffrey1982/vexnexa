# Public homepage refresh

## Scope

The public homepage and shared marketing navigation/footer were refined for agencies and business teams. Scanning, billing, database migrations and consent-first outreach rules were not replaced. This change is local until it is committed and deployed.

## Design direction

- An audit-desk composition: warm paper, ink, green status signals and a copper report stage.
- Existing Inter Tight and JetBrains Mono families retained. Product evidence replaces decorative stock imagery.
- One primary action: run a free scan. Sample reports are the secondary evaluation path.
- Sample data is explicitly labelled. Real scan results replace the sample, including the caption. Zero findings are not described as legal compliance.
- The report preview uses accessible HTML and SVG, not a raster image or animation library.
- Native disclosures, visible focus, 52px scan controls and reduced-motion support.
- The old percentage-based savings calculator and broad AI marketing claims are no longer on the homepage.
- Six localized copy sets; marketing links retain the active locale.

The new homepage tokens are scoped in `src/components/marketing/home/home.module.css`, so the authenticated application retains its existing design.

## Performance

The homepage narrative is a Server Component. Recovery-link handling, the scan form and tracked actions remain small client components. Navbar authentication is code-split and loaded at idle. White-label settings and PWA registration are enabled only for application routes; their provider remains mounted to preserve client state.

Returning visitors' previously installed service workers are not unregistered by this change.
First-time service-worker activation does not reload an application form; updates of an already-controlled application page retain the existing once-only reload behavior.

Production manifest comparison against the original working tree at `f7524e3`, using Node's default gzip compression:

| Asset definition | Before, raw / gzip | After, raw / gzip |
| --- | ---: | ---: |
| Homepage client-entry files, excluding framework bootstrap | 457,643 / 138,616 B | 260,862 / 85,021 B |
| Homepage-only JS over the marketing layout | 70,477 / 18,992 B | 24,030 / 7,485 B |
| Homepage CSS | 183,709 / 30,478 B | 202,966 / 35,443 B |

The page-specific JavaScript is 60.6% smaller when gzipped. Initial client-entry JavaScript is 38.7% smaller when gzipped; deferred authentication code may still load later. The new art direction adds 4,965 compressed CSS bytes. These are build-artifact measurements, not Lighthouse scores, complete network transfer sizes, or a claim about real-user LCP/INP. Field metrics require measurement after deployment.

## Verification

- Full Vitest suite: 524 passed, 2 opt-in database integration tests skipped.
- Production build: passed, including TypeScript and generation of all 193 static-page tasks.
- Playwright public-site smoke suite: 16 passed against the final local production build, including Dutch/German homepage overflow checks at 320px.
- Hero tests cover validation, real results, zero findings, rate limiting, network failure, duplicate submits, six locales and demo/live captions.
- FAQ tests cover native disclosures, safe links, JSON-LD escaping and axe checks.
- Route tests cover public/app service gating, stable child state and stale-request cleanup.
- PWA tests cover first-install activation, update reloads and listener cleanup.
- Link tests cover locale preservation, external destinations, query strings, fragments and forwarded refs.
- Manual browser review: desktop light/dark, Dutch mobile layout, German at 320px, report disclosure. The final German page has matching 312px client/scroll widths in the in-app browser; decorative report overflow is clipped locally, and long footer words can wrap.
- Calculated text-token contrast: body 15.49:1, muted body 6.35:1, green heading 8.65:1, copper-stage label 5.10:1, report secondary text 6.58:1. Dark-mode error and report focus colors have their own overrides.
- ESLint: no errors; four pre-existing warnings remain in billing settings and SVG logo markup.

No real customer scan, email campaign, cron invocation or production database mutation was used for verification.
The public updates page renders its fallback locally because the production database is not reachable from this environment; database-backed content and production field-performance metrics were not validated.
