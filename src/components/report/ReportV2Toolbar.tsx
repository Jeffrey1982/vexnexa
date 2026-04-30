"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Download } from "lucide-react";
import {
  PdfLanguageSelector,
  PDF_LOCALES,
  type PdfLocale,
} from "@/components/PdfLanguageSelector";

/**
 * Toolbar for the /scans/[id]/report-v2 page.
 *
 * Wraps three controls:
 *   1. PDF language selector — when changed, navigates to the same URL with
 *      an updated `?language=` query so the preview iframe re-renders in the
 *      new locale and the Download PDF button below also targets that locale.
 *   2. Style switcher — toggles between "premium" and "corporate".
 *   3. Download PDF — links straight to the API with the chosen language and
 *      style, so the file content matches what's previewed.
 *
 * This component lives client-side so the language change is instant and the
 * server can re-render the iframe and PDF route consistently.
 */

interface Props {
  scanId: string;
  currentLocale: string;
  currentStyle: "premium" | "corporate";
}

function isPdfLocale(s: string): s is PdfLocale {
  return (PDF_LOCALES as readonly string[]).includes(s);
}

export function ReportV2Toolbar({ scanId, currentLocale, currentStyle }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Normalise to a known locale; fall back to "en" if the URL had something else.
  const initial: PdfLocale = isPdfLocale(currentLocale) ? currentLocale : "en";
  const [pdfLocale, setPdfLocale] = useState<PdfLocale>(initial);

  /** Build a URL on this same page with overridden query params. */
  const buildPageHref = (overrides: { language?: PdfLocale; style?: "premium" | "corporate" }) => {
    const params = new URLSearchParams();
    params.set("language", overrides.language ?? pdfLocale);
    const style = overrides.style ?? currentStyle;
    if (style === "corporate") params.set("reportStyle", "corporate");
    return `${pathname}?${params.toString()}`;
  };

  /** Build the API URL that produces the actual PDF. */
  const pdfHref = (() => {
    const params = new URLSearchParams();
    params.set("language", pdfLocale);
    if (currentStyle === "corporate") params.set("reportStyle", "corporate");
    return `/api/reports/${scanId}/pdf?${params.toString()}`;
  })();

  const handleLocaleChange = (next: PdfLocale) => {
    setPdfLocale(next);
    // Re-render the page so the iframe preview matches the chosen locale.
    router.replace(buildPageHref({ language: next }));
  };

  const styleSwitchLabel =
    currentStyle === "corporate" ? "Premium Style" : "Corporate Style";
  const styleSwitchHref = buildPageHref({
    style: currentStyle === "corporate" ? "premium" : "corporate",
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PdfLanguageSelector
        value={pdfLocale}
        onChange={handleLocaleChange}
        ariaLabel="Choose report language"
      />

      <a
        href={styleSwitchHref}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--vn-border)] bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
      >
        {styleSwitchLabel}
      </a>

      <a
        href={pdfHref}
        // No `download` attr: the PDF route streams `application/pdf` so the
        // browser will offer a save dialog with the right filename anyway.
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--vn-primary-aaa-btn-hover)] transition-colors"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </a>
    </div>
  );
}
