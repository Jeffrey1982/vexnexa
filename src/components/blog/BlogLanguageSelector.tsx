"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BlogLanguageSelectorProps {
  currentLocale: string;
  availableLocales: string[];
  baseSlug: string; // Slug without language suffix
}

const localeNames: Record<string, string> = {
  en: 'English',
  nl: 'Nederlands',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
};

export function BlogLanguageSelector({
  currentLocale,
  availableLocales,
  baseSlug,
}: BlogLanguageSelectorProps) {
  const router = useRouter();

  const handleLocaleChange = (locale: string) => {
    // Set the locale cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;

    // Redirect to the blog post in the new locale
    router.push(`/blog/${baseSlug}-${locale}`);
    router.refresh();
  };

  if (availableLocales.length <= 1) {
    return null; // Don't show selector if only one language available
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {localeNames[currentLocale] || currentLocale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={locale === currentLocale ? 'bg-accent' : ''}
          >
            {localeNames[locale] || locale.toUpperCase()}
            {locale === currentLocale && (
              <span className="ml-2 text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
