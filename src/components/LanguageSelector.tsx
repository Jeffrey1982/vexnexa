"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isMarketingPath } from "@/lib/marketing-seo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
];

export function LanguageSelector() {
  const t = useTranslations("nav");
  const [currentLanguage, setCurrentLanguage] = React.useState<Language>(languages[0]); // English is first

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);

    if (typeof window === "undefined") return;
    try { localStorage.setItem("preferred-language", language.code); } catch {}
    document.cookie = `NEXT_LOCALE=${language.code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    // On marketing pages, navigate to the locale-prefixed URL so each language
    // has a real, indexable address (en = un-prefixed). Elsewhere (dashboard,
    // blog) keep the cookie-based reload.
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
    try {
      const pathMatch = window.location.pathname.match(/^\/(en|nl|de|fr|es|pt)(?=\/|$)/);
      const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      const cookieLocale = cookieMatch ? cookieMatch[1] : null;
      const savedLanguage =
        (pathMatch ? pathMatch[1] : null) || cookieLocale || localStorage.getItem("preferred-language");
      if (savedLanguage) {
        const language = languages.find(lang => lang.code === savedLanguage);
        if (language) {
          setCurrentLanguage(language);
        }
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-2xl px-2"
          aria-label={t("language")}
          title={currentLanguage.nativeName}
        >
          {currentLanguage.flag}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-lg">{language.flag}</span>
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
