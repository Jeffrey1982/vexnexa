"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

interface ExportButtonsProps {
  scanId: string;
  className?: string;
}

export function ExportButtons({ scanId, className }: ExportButtonsProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await fetch(`/api/reports/${scanId}/pdf?reportStyle=premium`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      downloadBlob(blob, `accessibility-report-${scanId}.pdf`);
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
      const response = await fetch(`/api/reports/${scanId}/docx?reportStyle=premium`);

      if (!response.ok) {
        throw new Error("Failed to export Word document");
      }

      const blob = await response.blob();
      downloadBlob(blob, `accessibility-report-${scanId}.docx`);
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