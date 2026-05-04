"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { openPdf } from "@/lib/pdf/open-pdf";
import { shouldUseInlinePdfOpen } from "@/lib/device";
import { toast } from "@/hooks/use-toast";
import {
  PdfLanguageSelector,
  detectInitialPdfLocale,
  type PdfLocale,
} from "@/components/PdfLanguageSelector";

interface ExportBarProps {
  scanId: string;
  includeVNI?: boolean;
  className?: string;
}

type ExportStatus = "idle" | "loading" | "success" | "error";

export function ExportBar({ scanId, includeVNI = true, className }: ExportBarProps) {
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>("idle");
  const [pdfLocale, setPdfLocale] = useState<PdfLocale>(detectInitialPdfLocale());

  const exportPdf = async () => {
    setPdfStatus("loading");
    try {
      const pdfUrl = `/api/reports/${scanId}/pdf?language=${encodeURIComponent(pdfLocale)}&includeVNI=${includeVNI ? "true" : "false"}`;
      if (shouldUseInlinePdfOpen()) {
        openPdf({ url: pdfUrl });
        setPdfStatus("success");
        setTimeout(() => setPdfStatus("idle"), 3000);
        toast({
          title: "PDF opened",
          description: "Use Share -> Save to Files to download.",
        });
        return;
      }

      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
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

      setPdfStatus("success");
      setTimeout(() => setPdfStatus("idle"), 3000);
    } catch (error) {
      console.error("PDF export failed:", error);
      setPdfStatus("error");
      setTimeout(() => setPdfStatus("idle"), 3000);
    }
  };

  const getButtonContent = (status: ExportStatus) => {
    switch (status) {
      case "loading":
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            Ready!
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            Try Again
          </>
        );
      default:
        return "PDF";
    }
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm">Export Report</h3>
            <p className="text-xs text-muted-foreground">
              Download your professional VexNexa PDF report
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PdfLanguageSelector
              value={pdfLocale}
              onChange={setPdfLocale}
              disabled={pdfStatus === "loading"}
              ariaLabel="PDF export language"
            />
            <Button
              variant={pdfStatus === "error" ? "destructive" : "outline"}
              size="sm"
              onClick={exportPdf}
              disabled={pdfStatus === "loading"}
              className={cn(
                "flex items-center gap-2 border-success bg-success text-success-foreground shadow-sm transition-all hover:bg-success/90",
                "disabled:opacity-80",
                pdfStatus === "success" && "bg-success hover:bg-success/90",
                pdfStatus === "error" && "border-destructive"
              )}
            >
              {pdfStatus === "idle" && <FileText className="w-4 h-4" />}
              {getButtonContent(pdfStatus)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
