/**
 * Multilingual SEO helpers for the marketing site.
 *
 * Marketing pages are served at un-prefixed paths for the default locale (en)
 * and at locale-prefixed paths for Dutch (e.g. /nl/pricing).
 * The proxy (middleware) rewrites prefixed paths to the un-prefixed route and
 * sets the `x-vn-locale` / `x-vn-path` headers so the page renders in the right
 * language. This module centralises the URL math + hreflang/canonical building.
 */

export const SITE_URL = "https://vexnexa.com";

export const MARKETING_LOCALES = ["en", "nl", "de", "fr", "es", "pt"] as const;
export type MarketingLocale = (typeof MARKETING_LOCALES)[number];
export const INDEXABLE_MARKETING_LOCALES = ["en", "nl", "de", "fr", "es", "pt"] as const;
export type IndexableMarketingLocale = (typeof INDEXABLE_MARKETING_LOCALES)[number];
export const DEFAULT_MARKETING_LOCALE: IndexableMarketingLocale = "en";

export function isMarketingLocale(value: string | undefined | null): value is MarketingLocale {
  return !!value && (MARKETING_LOCALES as readonly string[]).includes(value);
}

export function resolveMarketingLocale(value: string | undefined | null): MarketingLocale {
  return isMarketingLocale(value) ? value : DEFAULT_MARKETING_LOCALE;
}

export function isIndexableMarketingLocale(
  value: string | undefined | null
): value is IndexableMarketingLocale {
  return !!value && (INDEXABLE_MARKETING_LOCALES as readonly string[]).includes(value);
}

/**
 * Un-prefixed marketing paths that participate in locale routing.
 * Keep in sync with the routes under src/app/(marketing).
 */
export const MARKETING_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/about",
  "/accessibe-alternative",
  "/accessibility-monitoring-agencies",
  "/bfsg-compliance",
  "/siteimprove-alternative",
  "/accessibility-overlay-alternative",
  "/accessibility-regression-testing",
  "/audits",
  "/compliance",
  "/contact",
  // "/demo" intentionally omitted — it permanently redirects to /sample-report,
  // so it should not get locale variants or hreflang alternates.
  "/digitale-toegankelijkheid-audit",
  "/eaa-compliance",
  "/eaa-compliance-monitoring",
  "/features",
  "/free-scan",
  "/government-accessibility",
  "/for-agencies",
  "/get-started",
  "/methodology",
  "/partner-apply",
  "/pilot-partner-program",
  "/pricing",
  "/sample-report",
  "/updates",
  "/wcag-compliance-report",
  "/wcag-scan",
  "/toegankelijkheid-webshop-eaa",
  "/website-toegankelijkheid-testen",
  "/website-accessibility-checker",
  "/white-label-accessibility-reports",
  "/legal/privacy",
  "/legal/security",
  "/legal/sla",
  "/legal/terms",
]);

export function isMarketingPath(path: string): boolean {
  return MARKETING_PATHS.has(normalizePath(path));
}

/** Strip a trailing slash (except root) and ensure a leading slash. */
export function normalizePath(path: string): string {
  if (!path) return "/";
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/** Absolute URL for a given locale + un-prefixed marketing path. */
export function localizedUrl(locale: MarketingLocale, path: string): string {
  const p = normalizePath(path);
  if (locale === DEFAULT_MARKETING_LOCALE) {
    return p === "/" ? `${SITE_URL}/` : `${SITE_URL}${p}`;
  }
  return p === "/" ? `${SITE_URL}/${locale}` : `${SITE_URL}/${locale}${p}`;
}

/** OpenGraph locale code, e.g. "en_US", "nl_NL". */
export function ogLocale(locale: MarketingLocale): string {
  const map: Record<MarketingLocale, string> = {
    en: "en_US",
    nl: "nl_NL",
    de: "de_DE",
    fr: "fr_FR",
    es: "es_ES",
    pt: "pt_PT",
  };
  return map[locale];
}

export function canonicalMarketingLocale(locale: MarketingLocale): IndexableMarketingLocale {
  return isIndexableMarketingLocale(locale) ? locale : DEFAULT_MARKETING_LOCALE;
}

/** Public social profiles for the Organization `sameAs`. */
export const SOCIAL_PROFILES = ["https://twitter.com/vexnexa", "https://x.com/vexnexa"];
export const ORG_LOGO = `${SITE_URL}/brand/vexnexa-v-mark.png`;
export const CONTACT_EMAIL = "info@vexnexa.com";

/** Human-readable breadcrumb labels for known top-level segments. */
const BREADCRUMB_LABELS: Record<string, string> = {
  about: "About",
  "accessibe-alternative": "accessiBe Alternative",
  "siteimprove-alternative": "Siteimprove Alternative",
  "bfsg-compliance": "BFSG Compliance",
  audits: "Accessibility Audits",
  pricing: "Pricing",
  features: "Features",
  contact: "Contact",
  compliance: "Compliance",
  "eaa-compliance": "EAA Compliance",
  "eaa-compliance-monitoring": "EAA Compliance Monitoring",
  "digitale-toegankelijkheid-audit": "Digitale Toegankelijkheid Audit",
  "for-agencies": "For Agencies",
  "government-accessibility": "Government & Public Sector",
  methodology: "Methodology",
  "pilot-partner-program": "Pilot Partner Program",
  "partner-apply": "Partner Application",
  "sample-report": "Sample Report",
  "wcag-scan": "WCAG Scan",
  "wcag-compliance-report": "WCAG Compliance Report",
  "toegankelijkheid-webshop-eaa": "Toegankelijkheid Webshop & EAA",
  "website-toegankelijkheid-testen": "Website Toegankelijkheid Testen",
  "website-accessibility-checker": "Website Accessibility Checker",
  "white-label-accessibility-reports": "White-Label Reports",
  "accessibility-monitoring-agencies": "Accessibility Monitoring for Agencies",
  "accessibility-overlay-alternative": "Accessibility Overlay Alternative",
  "accessibility-regression-testing": "Accessibility Regression Testing",
  updates: "Updates",
  legal: "Legal",
  privacy: "Privacy Policy",
  security: "Security",
  sla: "SLA & Support",
  terms: "Terms of Service",
};

function segmentLabel(seg: string): string {
  return (
    BREADCRUMB_LABELS[seg] ||
    seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * BreadcrumbList items (Home → … → page) for a marketing path in the active
 * locale. Returns null for the home page (no breadcrumb needed).
 */
export function breadcrumbItems(path: string, locale: MarketingLocale) {
  const p = normalizePath(path);
  if (p === "/") return null;

  const segments = p.slice(1).split("/");
  const items = [{ name: "Home", url: localizedUrl(locale, "/") }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    items.push({ name: segmentLabel(seg), url: localizedUrl(locale, acc) });
  }
  return items;
}

/**
 * Sitewide structured data (@graph) for marketing pages: Organization entity,
 * WebSite, and a per-page BreadcrumbList. Reinforces the brand entity on every
 * indexable page and adds breadcrumb trails in search results.
 */
export function marketingStructuredData(path: string, locale: MarketingLocale) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "VexNexa",
      url: SITE_URL,
      logo: ORG_LOGO,
      description:
        "White-label WCAG monitoring for agencies and EU-facing teams. Scan websites, catch regressions, deliver branded reports.",
      sameAs: SOCIAL_PROFILES,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: CONTACT_EMAIL,
        url: `${SITE_URL}/contact`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "VexNexa",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: [...INDEXABLE_MARKETING_LOCALES],
    },
  ];

  const crumbs = breadcrumbItems(path, locale);
  if (crumbs) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.url,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Build Next.js `alternates` (self-referencing canonical + hreflang languages
 * incl. x-default) for an un-prefixed marketing path in the active locale.
 */
export function buildAlternates(path: string, locale: MarketingLocale) {
  const languages: Record<string, string> = {};
  for (const l of INDEXABLE_MARKETING_LOCALES) {
    languages[l] = localizedUrl(l, path);
  }
  languages["x-default"] = localizedUrl(DEFAULT_MARKETING_LOCALE, path);

  return {
    canonical: localizedUrl(canonicalMarketingLocale(locale), path),
    languages,
  };
}
