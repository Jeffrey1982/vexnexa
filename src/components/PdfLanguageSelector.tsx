"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

/**
 * PdfLanguageSelector — compact dropdown that picks the locale used for the
 * next PDF export. It does NOT change the user's site locale (NEXT_LOCALE
 * cookie) — selection here is one-shot, only for the next export click.
 *
 * Default: read from NEXT_LOCALE cookie (or "en" fallback).
 *
 * Use as a controlled component:
 *   const [pdfLocale, setPdfLocale] = useState<PdfLocale>(detectInitialPdfLocale());
 *   <PdfLanguageSelector value={pdfLocale} onChange={setPdfLocale} />
 *
 * Pass `pdfLocale` to the PDF route as `?language={pdfLocale}`.
 */

export const PDF_LOCALES = ["en", "nl", "de", "fr", "es", "pt"] as const;
export type PdfLocale = (typeof PDF_LOCALES)[number];

const LABELS: Record<PdfLocale, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  nl: { native: "Nederlands", flag: "🇳🇱" },
  de: { native: "Deutsch", flag: "🇩🇪" },
  fr: { native: "Français", flag: "🇫🇷" },
  es: { native: "Español", flag: "🇪🇸" },
  pt: { native: "Português", flag: "🇵🇹" },
};

export function detectInitialPdfLocale(): PdfLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const raw = (m?.[1] || "en").split("-")[0].toLowerCase();
  return (PDF_LOCALES as readonly string[]).includes(raw) ? (raw as PdfLocale) : "en";
}

interface Props {
  value: PdfLocale;
  onChange: (next: PdfLocale) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function PdfLanguageSelector({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className,
}: Props) {
  // Avoid SSR hydration mismatch — render the static label until mounted,
  // then upgrade to the cookie-derived initial value on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const display = LABELS[value] ?? LABELS.en;

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      } ${className ?? ""}`}
    >
      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="sr-only">{ariaLabel ?? "PDF export language"}</span>
      <span aria-hidden className="text-base leading-none">
        {display.flag}
      </span>
      <select
        value={mounted ? value : "en"}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PdfLocale)}
        className="cursor-pointer bg-transparent pr-1 text-sm font-medium text-foreground outline-none disabled:cursor-not-allowed"
        aria-label={ariaLabel ?? "PDF export language"}
      >
        {PDF_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {LABELS[loc].native}
          </option>
        ))}
      </select>
    </label>
  );
}
