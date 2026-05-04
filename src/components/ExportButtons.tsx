"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { openPdf } from "@/lib/pdf/open-pdf";
import { shouldUseInlinePdfOpen } from "@/lib/device";
import { toast } from "@/hooks/use-toast";
import {
  PdfLanguageSelector,
  detectInitialPdfLocale,
  type PdfLocale,
} from "@/components/PdfLanguageSelector";

interface ExportButtonsProps {
  scanId: string;
  className?: string;
  includeVNI?: boolean;
  /**
   * Hide the language selector when the surrounding page already controls the
   * export language (e.g. report-v2). Defaults to showing the selector.
   */
  showLanguageSelector?: boolean;
}

export function ExportButtons({
  scanId,
  className,
  includeVNI = true,
  showLanguageSelector = true,
}: ExportButtonsProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfLocale, setPdfLocale] = useState<PdfLocale>(detectInitialPdfLocale());

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const pdfUrl = `/api/reports/${scanId}/pdf?language=${encodeURIComponent(pdfLocale)}&includeVNI=${includeVNI ? "true" : "false"}`;
      if (shouldUseInlinePdfOpen()) {
        openPdf({ url: pdfUrl });
        toast({
          title: "PDF opened",
          description: "Use Share -> Save to Files to download.",
        });
        return;
      }

      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const ct = response.headers.get("Content-Type") ?? "";
      if (ct.includes("application/pdf")) {
        const blob = await response.blob();
        openPdf({
          blob,
          filename: `vexnexa-report-${scanId}-${pdfLocale}.pdf`,
        });
      } else {
        const html = await response.text();
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(html);
          w.document.close();
          w.focus();
          w.print();
        }
      }
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {showLanguageSelector && (
        <PdfLanguageSelector
          value={pdfLocale}
          onChange={setPdfLocale}
          disabled={exportingPdf}
          ariaLabel="PDF export language"
        />
      )}
      <Button
        variant="outline"
        onClick={exportPdf}
        disabled={exportingPdf}
        className="flex items-center gap-2"
      >
        {exportingPdf ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {exportingPdf ? "Exporting..." : "Export PDF"}
      </Button>
    </div>
  );
}
