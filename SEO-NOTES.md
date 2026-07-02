# SEO Notes — landing-page content audit & technical checks

Date: 2026-07-02 (Tasks 5 & 6 of the conversion-improvement work)

## 1. Meta titles / descriptions

Every indexable marketing page was checked. **All pages have a unique meta
title and description** (most via hardcoded `metadata`, the localized pages
via `generateMetadata` + i18n keys). No action needed beyond:

- **`keywords` meta removed site-wide** (obsolete, spam signal). Removed from
  14 files: root layout, marketing layout, blog post pages
  (`post.metaKeywords` no longer emitted), about, eaa-compliance,
  digitale-toegankelijkheid-audit, website-toegankelijkheid-testen,
  toegankelijkheid-webshop-eaa, accessibility-regression-testing,
  accessibility-overlay-alternative, and the four legal pages.

## 2. hreflang / canonicals

- The marketing layout (`src/app/(marketing)/layout.tsx` +
  `src/lib/marketing-seo.ts`) emits a self-referencing canonical per locale
  and hreflang alternates (en/nl/de/fr/es/pt + x-default) for every path in
  `MARKETING_PATHS`. The three Dutch landing pages are included, so EN/NL
  hreflang is correctly set. `sitemap_pages.xml` repeats the same alternates.
- **Fixed:** `/demo` (a permanent redirect to `/sample-report`) was listed in
  `MARKETING_PATHS`, generating locale variants and hreflang for a redirecting
  URL. Removed.

### ✔ Resolved (2026-07-02): untranslated locale variants

Previously every path in `MARKETING_PATHS` was expanded to 6 locale URLs in
the sitemap and hreflang set while several pages only have English body
copy — ~30 paths × 6 locales of near-duplicate "translations".

**Implemented:** `INDEXABLE_MARKETING_LOCALES = ["en", "nl"]` in
`src/lib/marketing-seo.ts`. Only EN/NL appear in hreflang and
`sitemap_pages.xml`; de/fr/es/pt pages still render (language switcher
keeps working) but are `noindex` with a canonical to the EN URL. The
post-deploy smoke test enforces this policy on every production deploy.
When a locale's marketing copy is actually finished, add it to
`INDEXABLE_MARKETING_LOCALES` to re-enable indexing.

## 3. Thin / near-duplicate page review

| Page(s) | Verdict | Notes / recommendation |
| --- | --- | --- |
| `/wcag-scan` vs `/website-accessibility-checker` | Overlapping intent, keep both for now | Both are "scan/check your site" pages with a similar structure. Titles and body copy differ, but they can cannibalize each other for queries like "wcag checker". Watch GSC; if they compete, canonicalize the weaker to the stronger. Both should link the new `/free-scan` tool as the primary CTA. |
| `/eaa-compliance` vs `/eaa-compliance-monitoring` vs `/compliance` | OK — distinct intents | Long-form EAA guide vs monitoring product page vs trust/compliance overview. Interlinked; no canonical needed. |
| `/accessibility-monitoring-agencies` vs `/for-agencies` | Some overlap, acceptable | `/for-agencies` is the commercial hub; the monitoring page targets a specific keyword. Keep the monitoring page focused on "monitoring" language and link up to `/for-agencies`. |
| `/bfsg-compliance` vs `/eaa-compliance` | OK — distinct | BFSG is the German transposition of the EAA; page is DE-market specific (localized via i18n, FAQ schema present). |
| `/website-toegankelijkheid-testen` (NL) vs `/nl/website-accessibility-checker` | Potential Dutch-SERP competition | The dedicated Dutch keyword page and the NL locale variant of the EN checker page both target Dutch "toegankelijkheid testen/checker" queries. Prefer the dedicated NL pages for the Dutch market; consider dropping the `nl` hreflang/sitemap variant of `website-accessibility-checker` (see §2 recommendation). |
| `/accessibe-alternative` vs `/siteimprove-alternative` | Template siblings, acceptable | Shared `ComparisonContent` component but competitor-specific copy and FAQ schema from i18n. Fine as comparison pages; expand copy over time. |
| `/accessibility-overlay-alternative` | OK | Distinct topic (overlay category, not a specific competitor). Cross-link with the two competitor pages. |
| `/accessibility-regression-testing` | OK | Unique topic (CI/regression). |
| `/government-accessibility` | OK | Sector page, localized, Service schema. |
| Dutch trio (`/digitale-toegankelijkheid-audit`, `/website-toegankelijkheid-testen`, `/toegankelijkheid-webshop-eaa`) | OK — distinct intents (audit vs testing vs webshop/EAA) | Now also linked from the homepage "Voor Nederlandse bedrijven" section, not just the footer. |

## 4. Status codes / redirects (Task 6)

- `/demo` → **308 permanent redirect** to `/sample-report` (Next
  `permanentRedirect`). Equivalent to 301 for SEO. No internal links to
  `/demo` remain (the legacy components that referenced it were removed
  in the 2026-07-02 dead-code cleanup).
- No redirect chains found among marketing routes.
- No 404s in the sitemap: every `PAGE_PATHS` entry in
  `src/app/sitemap_pages.xml/route.ts` maps to an existing route (including
  `/blog`, `/changelog`, `/legal/cookies`, and the new `/audits`).
- `/get-started` is deliberately in `MARKETING_PATHS` but disallowed in
  robots.txt and absent from the sitemap (funnel page) — consistent.
- `/free-scan` (new) is `noindex, follow` by design (parameterised results
  view) and is excluded from the sitemap.

## 5. Sitemaps & robots (Task 6)

- `robots.txt` (from `src/app/robots.ts`) references
  `https://vexnexa.com/sitemap.xml` ✔ and now allows `/audits`.
- `sitemap.xml` is an index referencing `sitemap_pages.xml`,
  `sitemap_blog.xml`, `sitemap_reports.xml`. `sitemap_content.xml` exists as
  a route but is intentionally empty and unreferenced (placeholder) — fine.
- `sitemap_pages.xml` now includes `/audits`; no dead paths (see §4).

## 6. Structured data (Task 6)

- **Organization + WebSite**: emitted sitewide by the marketing layout
  (`marketingStructuredData`), including the homepage. ✔
- **SoftwareApplication**: homepage adds a product-specific entity. ✔
- **Product with offers**: pricing page emits `Product` with Pro/Agency
  offers (incl. VAT price specification). ✔
- **FAQPage**: the shared `FAQ` component emits FAQPage JSON-LD, used on the
  homepage FAQ section; BFSG, government, and comparison pages emit their own
  FAQPage schema. ✔
- **BreadcrumbList**: emitted per page by the marketing layout. ✔
