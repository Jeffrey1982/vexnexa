"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
];

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = React.useState<Language>(languages[0]); // English is first

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);

    // Store preference in localStorage and cookie
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-language", language.code);

      // Set the NEXT_LOCALE cookie
      document.cookie = `NEXT_LOCALE=${language.code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      // Reload the page to apply the new locale
      window.location.reload();
    }
  };

  // Load saved language preference on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Check cookie first (source of truth for next-intl)
      const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      const cookieLocale = cookieMatch ? cookieMatch[1] : null;

      const savedLanguage = cookieLocale || localStorage.getItem("preferred-language");
      if (savedLanguage) {
        const language = languages.find(lang => lang.code === savedLanguage);
        if (language) {
          setCurrentLanguage(language);
        }
      }
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-2xl px-2"
          aria-label="Select language"
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
