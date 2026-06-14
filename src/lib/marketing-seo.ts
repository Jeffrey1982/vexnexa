/**
 * Multilingual SEO helpers for the marketing site.
 *
 * Marketing pages are served at un-prefixed paths for the default locale (en)
 * and at locale-prefixed paths for the others (e.g. /nl/pricing, /de/features).
 * The proxy (middleware) rewrites prefixed paths to the un-prefixed route and
 * sets the `x-vn-locale` / `x-vn-path` headers so the page renders in the right
 * language. This module centralises the URL math + hreflang/canonical building.
 */

export const SITE_URL = "https://vexnexa.com";

export const MARKETING_LOCALES = ["en", "nl", "de", "fr", "es", "pt"] as const;
export type MarketingLocale = (typeof MARKETING_LOCALES)[number];
export const DEFAULT_MARKETING_LOCALE: MarketingLocale = "en";

export function isMarketingLocale(value: string | undefined | null): value is MarketingLocale {
  return !!value && (MARKETING_LOCALES as readonly string[]).includes(value);
}

/**
 * Un-prefixed marketing paths that participate in locale routing.
 * Keep in sync with the routes under src/app/(marketing).
 */
export const MARKETING_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/about",
  "/accessibility-monitoring-agencies",
  "/compliance",
  "/contact",
  "/demo",
  "/eaa-compliance",
  "/eaa-compliance-monitoring",
  "/features",
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

/**
 * Build Next.js `alternates` (self-referencing canonical + hreflang languages
 * incl. x-default) for an un-prefixed marketing path in the active locale.
 */
export function buildAlternates(path: string, locale: MarketingLocale) {
  const languages: Record<string, string> = {};
  for (const l of MARKETING_LOCALES) {
    languages[l] = localizedUrl(l, path);
  }
  languages["x-default"] = localizedUrl(DEFAULT_MARKETING_LOCALE, path);

  return {
    canonical: localizedUrl(locale, path),
    languages,
  };
}
