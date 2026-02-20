"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { openPdf } from "@/lib/pdf/open-pdf";
import { shouldUseInlinePdfOpen } from "@/lib/device";
import { toast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  scanId: string;
  className?: string;
}

export function ExportButtons({ scanId, className }: ExportButtonsProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      // On iOS / PWA, navigate directly to the PDF URL for inline viewing
      // because <a download> and blob downloads silently fail.
      if (shouldUseInlinePdfOpen()) {
        openPdf({ url: `/api/reports/${scanId}/pdf` });
        toast({
          title: "PDF opened",
          description: "Use Share \u2192 Save to Files to download.",
        });
        return;
      }

      const response = await fetch(`/api/reports/${scanId}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const ct = response.headers.get("Content-Type") ?? "";
      if (ct.includes("application/pdf")) {
        const blob = await response.blob();
        openPdf({ blob, filename: `accessibility-report-${scanId}.pdf` });
      } else {
        // Puppeteer unavailable — open v2 HTML for browser print
        const html = await response.text();
        const w = window.open("", "_blank");
        if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
      }
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const exportWord = async () => {
    setExportingWord(true);
    try {
      const response = await fetch(`/api/reports/${scanId}/docx`);

      if (!response.ok) {
        throw new Error("Failed to export Word document");
      }

      const blob = await response.blob();
      openPdf({ blob, filename: `accessibility-report-${scanId}.docx` });

      if (shouldUseInlinePdfOpen()) {
        toast({
          title: "Document opened",
          description: "Use Share \u2192 Save to Files to download.",
        });
      }
    } catch (error) {
      console.error("Word export failed:", error);
      alert("Failed to export Word document. Please try again.");
    } finally {
      setExportingWord(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
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

      <Button
        variant="outline"
        onClick={exportWord}
        disabled={exportingWord}
        className="flex items-center gap-2"
      >
        {exportingWord ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exportingWord ? "Exporting..." : "Export Word"}
      </Button>
    </div>
  );
}