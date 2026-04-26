import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['en', 'nl', 'de', 'fr', 'es', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

function mergeMessages(
  fallback: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...fallback };

  for (const [key, value] of Object.entries(overrides)) {
    const fallbackValue = fallback[key];
    if (
      value &&
      fallbackValue &&
      typeof value === 'object' &&
      typeof fallbackValue === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(fallbackValue)
    ) {
      merged[key] = mergeMessages(
        fallbackValue as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

export default getRequestConfig(async () => {
  // Get locale from cookie, fallback to default
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const fallbackMessages = (await import('../messages/en.json')).default;
  const localeMessages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: mergeMessages(fallbackMessages, localeMessages)
  };
});
