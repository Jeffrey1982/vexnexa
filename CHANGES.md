# CHANGES — Conversion-improvement work (2026-07-02)

One commit per numbered task. A baseline commit (`b647d28`) landed
pre-existing WIP from a previous session first so the task commits stay
clean; `messages/en.json` / `messages/nl.json` in Task 1 also carry some
pending i18n additions from that session.

## Task 1 — Free scan without an account (`7c6a009`)

The hero no longer routes to a registration wall. It submits to
`/free-scan`, which runs an anonymous single-page scan via
`POST /api/free-scan` (no persistence, VNI/AI disabled, SSRF-guarded,
3 scans per IP per day) and shows score, severity counts, and up to 3
example findings. The full report is gated behind a free-account CTA; the
URL carries through signup via the existing pending-scan mechanism.

Files:
- `src/app/api/free-scan/route.ts` (new)
- `src/app/(marketing)/free-scan/page.tsx` (new, noindex)
- `src/app/(marketing)/free-scan/FreeScanClient.tsx` (new)
- `src/lib/scan-url-validation.ts` (new — extracted from the scan route)
- `src/app/api/scan/route.ts` (uses the shared validator)
- `src/lib/rate-limit.ts` (`freeScanLimiter`, 3/day/IP)
- `src/lib/analytics-events.ts` (new funnel events)
- `src/lib/marketing-seo.ts` (`/free-scan` in locale routing)
- `src/components/marketing/home/Hero.tsx` (submit → `/free-scan`)
- `messages/en.json`, `messages/nl.json` (freeScan namespace; FAQ
  "Do I need an account to scan?" now answers "No")

## Task 2 — Pricing simplified to 3 plans (`dbe62ce`)

Plan grid is exactly Starter (free) / Pro (Most Popular) / Agency (Best
for agencies), Enterprise reduced to a contact-sales line, Pioneer card
removed. All user-facing "Business" copy renamed to "Agency". Audits and
bundles moved to a new `/audits` page; add-ons and overflow pricing
collapsed into accordions.

Files:
- `src/app/(marketing)/pricing/page.tsx` (restructured)
- `src/app/(marketing)/audits/page.tsx`, `.../AuditsClient.tsx` (new)
- `src/components/pricing/DirectCheckoutButton.tsx` (new, extracted)
- `src/lib/marketing-seo.ts`, `src/app/robots.ts`,
  `src/app/sitemap_pages.xml/route.ts` (`/audits` registered)
- `messages/en.json`, `messages/nl.json` (Business→Agency sweep, new
  keys, fixed doubled "Agency Business includes…" label bug)
- `src/app/settings/white-label/page.tsx`,
  `src/app/admin/white-label/page.tsx`, `src/app/admin/page.tsx`,
  `src/app/api/white-label/route.ts`,
  `src/app/api/white-label/upload/route.ts`,
  `src/lib/billing/entitlements.ts` (Business→Agency in strings)
- `src/components/partner-apply/PartnerApplyView.tsx`,
  `src/components/partner-apply/PartnerHero.tsx` (Business→Agency)

## Task 3 — Pilot Partner Program as hero offer (`0f7bf7c`)

Homepage banner directly below the hero, "Pilot Program" in the main nav,
application form cut to 4 fields, and one consistent offer everywhere:
**first 10 agencies get 3 months of the Agency plan for the Pro price
(€34.95/mo), a direct line to the founder, and input on the roadmap.**

Files:
- `src/components/marketing/home/PilotProgramBanner.tsx` (new)
- `src/app/(marketing)/HomePageClient.tsx` (banner below hero)
- `src/components/marketing/Navbar.tsx` (nav item)
- `src/components/partner-apply/PartnerApplicationForm.tsx` (4 fields)
- `src/app/actions/partner-application.ts` (schema matches; dropped DB
  columns get empty values pending a migration)
- `src/lib/pilot-partner.ts` (default capacity 20 → 10)
- `src/components/partner-apply/PartnerApplyView.tsx` (offer points)
- `src/components/partner-apply/PartnerHero.tsx` (offer line)
- `src/app/(marketing)/pilot-partner-program/page.tsx` (offer in hero,
  4-field apply step)
- `messages/en.json`, `messages/nl.json` (home.pilotProgram,
  nav.pilotProgram, pricing pilot banner aligned to the offer)

## Task 4 — Homepage focused on agencies (`e8e9aad`)

Files:
- `messages/en.json`, `messages/nl.json` — hero rewritten ("White-label
  WCAG reports for your clients, on autopilot." / NL equivalent);
  "Trusted by agencies…" → "Built on trusted technology"; Enterprise
  Portfolio pillar → "Client Portfolio Dashboard" (agency framing, no
  BU/SIEM/board copy); founderNote + reportPreview namespaces
- `src/components/marketing/home/SampleReportPreview.tsx` (new — HTML
  report mock, one shared dataset 72/100 with 3/8/14/6 issues, replaces
  the contradictory 100/100 Screenshot1.png in both places; TODO to swap
  in a real mid-range screenshot)
- `src/components/marketing/home/Hero.tsx` (preview panel uses the mock)
- `src/components/marketing/home/EnterpriseFeatures.tsx` (figure uses the
  mock, links to /sample-report)
- `src/components/marketing/home/FounderNote.tsx` (new — placeholder
  first-person note, TODO(founder) marker)
- `src/app/(marketing)/HomePageClient.tsx` (FounderNote before final CTA)

## Task 5 — Dutch market visibility + content audit (`58f693a`)

Files:
- `src/components/marketing/home/DutchMarketSection.tsx` (new — "Voor
  Nederlandse bedrijven" section linking the three Dutch landing pages)
- `src/app/(marketing)/HomePageClient.tsx` (section added)
- `messages/en.json`, `messages/nl.json` (home.dutchMarket)
- `SEO-NOTES.md` (new — thin/duplicate-content audit, hreflang review)
- `keywords` meta removed from 14 files: `src/app/layout.tsx`,
  `src/app/(marketing)/layout.tsx`, `src/app/blog/[slug]/page.tsx`,
  and the (marketing) pages: about, eaa-compliance,
  digitale-toegankelijkheid-audit, website-toegankelijkheid-testen,
  toegankelijkheid-webshop-eaa, accessibility-regression-testing,
  accessibility-overlay-alternative, legal/privacy, legal/security,
  legal/sla, legal/terms

## Task 6 — Technical SEO basics

Mostly verification; findings and evidence in `SEO-NOTES.md` §4–6:
- `robots.txt` references `sitemap.xml` ✔; sitemap index → pages/blog/
  reports sitemaps; no dead paths; `/audits` included (added in Task 2)
- Structured data already present: Organization + WebSite sitewide,
  SoftwareApplication on the homepage, Product-with-offers on pricing,
  FAQPage on the homepage FAQ component ✔
- Status codes: `/demo` is a 308 permanent redirect to `/sample-report`;
  no redirect chains or 404s found

Files:
- `src/lib/marketing-seo.ts` (removed `/demo` from `MARKETING_PATHS` so a
  redirecting URL no longer gets hreflang/locale variants)
- `SEO-NOTES.md` (status-code / sitemap / structured-data sections)
- `CHANGES.md` (this file)

## Follow-up — Business→Agency rename in the remaining locales

Task 2's rename covered EN/NL and code; this follow-up finishes the
secondary locales and aligns their pilot-banner offer with Task 3.

Files:
- `messages/de.json`, `messages/es.json`, `messages/fr.json`,
  `messages/pt.json` (plan name "Business" → "Agency" everywhere it
  refers to the plan; pricing pilot banner updated to the 3-months-at-
  Pro-price offer; page-pack note label fix)
- `src/app/api/white-label/route.ts`,
  `src/app/api/white-label/upload/route.ts` (stale comments)
