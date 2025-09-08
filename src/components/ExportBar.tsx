"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportBarProps {
  scanId: string;
  className?: string;
}

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ExportBar({ scanId, className }: ExportBarProps) {
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle');
  const [wordStatus, setWordStatus] = useState<ExportStatus>('idle');

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
    setPdfStatus('loading');
    try {
      const response = await fetch("/api/export/pdf-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scanId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const htmlContent = await response.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
        setPdfStatus('success');
        setTimeout(() => setPdfStatus('idle'), 3000);
      }
    } catch (error) {
      console.error("PDF export failed:", error);
      setPdfStatus('error');
      setTimeout(() => setPdfStatus('idle'), 3000);
    }
  };

  const exportWord = async () => {
    setWordStatus('loading');
    try {
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scanId }),
      });

      if (!response.ok) {
        throw new Error("Failed to export Word document");
      }

      const blob = await response.blob();
      downloadBlob(blob, `tutusporta-${scanId}.docx`);
      
      setWordStatus('success');
      setTimeout(() => setWordStatus('idle'), 3000);
    } catch (error) {
      console.error("Word export failed:", error);
      setWordStatus('error');
      setTimeout(() => setWordStatus('idle'), 3000);
    }
  };

  const getButtonContent = (status: ExportStatus, loadingText: string, defaultText: string) => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            Ready!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            Try Again
          </>
        );
      default:
        return defaultText;
    }
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm">Export Report</h3>
            <p className="text-xs text-muted-foreground">
              Download your accessibility report in PDF or Word format
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={pdfStatus === 'error' ? 'destructive' : 'outline'}
              size="sm"
              onClick={exportPdf}
              disabled={pdfStatus === 'loading'}
              className={cn(
                "flex items-center gap-2 transition-all",
                pdfStatus === 'success' && "border-success text-success hover:bg-success/10"
              )}
            >
              {pdfStatus === 'idle' && <FileText className="w-4 h-4" />}
              {getButtonContent(pdfStatus, "Generating...", "PDF")}
            </Button>

            <Button
              variant={wordStatus === 'error' ? 'destructive' : 'outline'}
              size="sm"
              onClick={exportWord}
              disabled={wordStatus === 'loading'}
              className={cn(
                "flex items-center gap-2 transition-all",
                wordStatus === 'success' && "border-success text-success hover:bg-success/10"
              )}
            >
              {wordStatus === 'idle' && <Download className="w-4 h-4" />}
              {getButtonContent(wordStatus, "Exporting...", "Word")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}