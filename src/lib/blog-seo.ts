import type { Locale } from "@/i18n";

export const BLOG_SEO_LOCALES = ["nl", "en", "fr", "es", "pt"] as const;
export type BlogSeoLocale = (typeof BLOG_SEO_LOCALES)[number];

const BLOG_LOCALE_SUFFIXES = ["-en", "-nl", "-de", "-fr", "-es", "-pt"] as const;

export function isBlogSeoLocale(value: string | undefined): value is BlogSeoLocale {
  return BLOG_SEO_LOCALES.includes(value as BlogSeoLocale);
}

export function getBlogBaseSlug(slug: string): string {
  for (const suffix of BLOG_LOCALE_SUFFIXES) {
    if (slug.endsWith(suffix)) {
      return slug.slice(0, -suffix.length);
    }
  }

  return slug;
}

export function getLocaleFromSlug(slug: string): Locale | null {
  for (const suffix of BLOG_LOCALE_SUFFIXES) {
    if (slug.endsWith(suffix)) {
      return suffix.slice(1) as Locale;
    }
  }

  return null;
}

export function getStoredBlogSlug(baseSlug: string, locale: string): string {
  return locale === "en" ? `${baseSlug}-en` : `${baseSlug}-${locale}`;
}

export function getBlogPublicPath(locale: string, baseSlug: string): string {
  if (locale === "nl") {
    return `/blog/${baseSlug}`;
  }

  return `/${locale}/${baseSlug}`;
}

export function getBlogPublicUrl(locale: string, baseSlug: string): string {
  return `https://vexnexa.com${getBlogPublicPath(locale, baseSlug)}`;
}

export function getBlogHreflangAlternates(versions: Array<{ locale: string | null }>, baseSlug: string) {
  return versions.reduce<Record<string, string>>((alternates, version) => {
    const locale = version.locale || "en";
    if (!isBlogSeoLocale(locale)) return alternates;

    alternates[locale] = getBlogPublicUrl(locale, baseSlug);
    return alternates;
  }, {});
}

export function getOriginalBlogLocale(versions: Array<{ locale: string | null; publishedAt?: Date | null; createdAt?: Date | null }>) {
  const dutchVersion = versions.find((version) => version.locale === "nl");
  if (dutchVersion) return "nl";

  const earliest = [...versions].sort((a, b) => {
    const aDate = a.publishedAt || a.createdAt || new Date(0);
    const bDate = b.publishedAt || b.createdAt || new Date(0);
    return aDate.getTime() - bDate.getTime();
  })[0];

  return earliest?.locale || "en";
}
