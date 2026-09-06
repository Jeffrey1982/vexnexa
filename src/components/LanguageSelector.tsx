"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  INDEXABLE_MARKETING_LOCALES,
  isMarketingPath,
  type MarketingLocale,
} from "@/lib/marketing-seo";

interface Language {
  code: MarketingLocale;
  name: string;
  nativeName: string;
  shortLabel: string;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", shortLabel: "EN" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", shortLabel: "NL" },
  { code: "de", name: "German", nativeName: "Deutsch", shortLabel: "DE" },
  { code: "fr", name: "French", nativeName: "Francais", shortLabel: "FR" },
  { code: "es", name: "Spanish", nativeName: "Espanol", shortLabel: "ES" },
  { code: "pt", name: "Portuguese", nativeName: "Portugues", shortLabel: "PT" },
];

type LanguageSelectorProps = {
  marketingOnly?: boolean;
};

export function LanguageSelector({ marketingOnly = false }: LanguageSelectorProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [hydrated, setHydrated] = React.useState(false);
  const availableLanguages = React.useMemo(
    () =>
      marketingOnly
        ? languages.filter((language) =>
            INDEXABLE_MARKETING_LOCALES.includes(
              language.code as (typeof INDEXABLE_MARKETING_LOCALES)[number]
            )
          )
        : languages,
    [marketingOnly]
  );
  const currentLanguage = languages.find((language) => language.code === locale) ?? languages[0];

  const handleLanguageChange = (language: Language) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("preferred-language", language.code);
    } catch {}
    document.cookie = `NEXT_LOCALE=${language.code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    const { pathname, search, hash } = window.location;
    const basePath = pathname.replace(/^\/(en|nl|de|fr|es|pt)(?=\/|$)/, "") || "/";
    if (isMarketingPath(basePath)) {
      const target =
        language.code === "en"
          ? basePath
          : `/${language.code}${basePath === "/" ? "" : basePath}`;
      window.location.href = `${target}${search}${hash}`;
    } else {
      window.location.reload();
    }
  };

  React.useEffect(() => {
    // Radix opens on pointerdown, which cannot be replayed before hydration.
    // Keep the SSR trigger disabled until its interaction handlers are ready.
    setHydrated(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          aria-label={t("language")}
          title={currentLanguage.nativeName}
          disabled={!hydrated}
        >
          <span className="font-mono text-xs font-semibold tracking-normal">
            {currentLanguage.shortLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="cursor-pointer"
          >
            <span className="mr-2 w-6 font-mono text-xs font-semibold text-muted-foreground">
              {language.shortLabel}
            </span>
            <span className="flex-1">{language.nativeName}</span>
            {currentLanguage.code === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
