"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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

const COPY: Record<PdfLocale, {
  title: string;
  description: string;
  pdf: string;
  word: string;
  generating: string;
  ready: string;
  retry: string;
  errorTitle: string;
  errorDescription: string;
  pdfOpened: string;
  pdfOpenedDescription: string;
}> = {
  en: {
    title: "Export report",
    description: "Download this report as PDF or Word.",
    pdf: "Download PDF",
    word: "Download Word",
    generating: "Generating...",
    ready: "Downloaded",
    retry: "Try again",
    errorTitle: "Export failed",
    errorDescription: "The report could not be generated. Please try again.",
    pdfOpened: "PDF opened",
    pdfOpenedDescription: "Use Share > Save to Files to download.",
  },
  nl: {
    title: "Rapport exporteren",
    description: "Download dit rapport als PDF of Word.",
    pdf: "PDF downloaden",
    word: "Word downloaden",
    generating: "Genereren...",
    ready: "Gedownload",
    retry: "Opnieuw proberen",
    errorTitle: "Export mislukt",
    errorDescription: "Het rapport kon niet worden gegenereerd. Probeer het opnieuw.",
    pdfOpened: "PDF geopend",
    pdfOpenedDescription: "Gebruik Delen > Bewaar in Bestanden om te downloaden.",
  },
  de: {
    title: "Bericht exportieren",
    description: "Laden Sie diesen Bericht als PDF oder Word herunter.",
    pdf: "PDF herunterladen",
    word: "Word herunterladen",
    generating: "Wird erstellt...",
    ready: "Heruntergeladen",
    retry: "Erneut versuchen",
    errorTitle: "Export fehlgeschlagen",
    errorDescription: "Der Bericht konnte nicht erstellt werden. Versuchen Sie es erneut.",
    pdfOpened: "PDF geöffnet",
    pdfOpenedDescription: "Wählen Sie Teilen > In Dateien sichern.",
  },
  fr: {
    title: "Exporter le rapport",
    description: "Téléchargez ce rapport au format PDF ou Word.",
    pdf: "Télécharger le PDF",
    word: "Télécharger Word",
    generating: "Génération...",
    ready: "Téléchargé",
    retry: "Réessayer",
    errorTitle: "Échec de l'export",
    errorDescription: "Le rapport n'a pas pu être généré. Veuillez réessayer.",
    pdfOpened: "PDF ouvert",
    pdfOpenedDescription: "Utilisez Partager > Enregistrer dans Fichiers.",
  },
  es: {
    title: "Exportar informe",
    description: "Descargue este informe en PDF o Word.",
    pdf: "Descargar PDF",
    word: "Descargar Word",
    generating: "Generando...",
    ready: "Descargado",
    retry: "Reintentar",
    errorTitle: "Error de exportación",
    errorDescription: "No se pudo generar el informe. Inténtelo de nuevo.",
    pdfOpened: "PDF abierto",
    pdfOpenedDescription: "Use Compartir > Guardar en Archivos.",
  },
  pt: {
    title: "Exportar relatório",
    description: "Descarregue este relatório em PDF ou Word.",
    pdf: "Descarregar PDF",
    word: "Descarregar Word",
    generating: "A gerar...",
    ready: "Descarregado",
    retry: "Tentar novamente",
    errorTitle: "Falha na exportação",
    errorDescription: "Não foi possível gerar o relatório. Tente novamente.",
    pdfOpened: "PDF aberto",
    pdfOpenedDescription: "Utilize Partilhar > Guardar em Ficheiros.",
  },
};

export function ExportBar({ scanId, includeVNI = true, className }: ExportBarProps) {
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>("idle");
  const [wordStatus, setWordStatus] = useState<ExportStatus>("idle");
  const [pdfLocale, setPdfLocale] = useState<PdfLocale>(detectInitialPdfLocale());
  const copy = COPY[pdfLocale];

  const resetStatus = (
    setter: React.Dispatch<React.SetStateAction<ExportStatus>>,
  ) => setTimeout(() => setter("idle"), 3000);

  const showExportError = (
    setter: React.Dispatch<React.SetStateAction<ExportStatus>>,
  ) => {
    setter("error");
    resetStatus(setter);
    toast({
      title: copy.errorTitle,
      description: copy.errorDescription,
      variant: "destructive",
    });
  };

  const exportPdf = async () => {
    setPdfStatus("loading");
    try {
      const pdfUrl = `/api/reports/${scanId}/pdf?language=${encodeURIComponent(pdfLocale)}&includeVNI=${includeVNI ? "true" : "false"}`;
      if (shouldUseInlinePdfOpen()) {
        openPdf({ url: pdfUrl });
        setPdfStatus("success");
        resetStatus(setPdfStatus);
        toast({
          title: copy.pdfOpened,
          description: copy.pdfOpenedDescription,
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
      resetStatus(setPdfStatus);
    } catch (error) {
      console.error("PDF export failed:", error);
      showExportError(setPdfStatus);
    }
  };

  const exportWord = async () => {
    setWordStatus("loading");
    try {
      const response = await fetch(
        `/api/reports/${scanId}/docx?language=${encodeURIComponent(pdfLocale)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to generate Word report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vexnexa-report-${scanId}-${pdfLocale}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setWordStatus("success");
      resetStatus(setWordStatus);
    } catch (error) {
      console.error("Word export failed:", error);
      showExportError(setWordStatus);
    }
  };

  const getButtonLabel = (status: ExportStatus, idleLabel: string) => {
    switch (status) {
      case "loading": return copy.generating;
      case "success": return copy.ready;
      case "error": return copy.retry;
      default:
        return idleLabel;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-5 text-foreground">
                {copy.title}
              </h3>
              <p className="mt-1 max-w-[34ch] text-xs leading-5 text-muted-foreground">
                {copy.description}
              </p>
            </div>
            <PdfLanguageSelector
              value={pdfLocale}
              onChange={setPdfLocale}
              disabled={pdfStatus === "loading" || wordStatus === "loading"}
              ariaLabel="Report export language"
              className="shrink-0"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
            <Button
              variant={pdfStatus === "error" ? "destructive" : "outline"}
              size="sm"
              onClick={exportPdf}
              disabled={pdfStatus === "loading" || wordStatus === "loading"}
              className={cn(
                "h-10 min-w-0 justify-center gap-2 px-3 text-xs sm:text-sm",
                pdfStatus === "success" && "border-success text-success",
              )}
            >
              {pdfStatus === "loading" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : pdfStatus === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : pdfStatus === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {getButtonLabel(pdfStatus, copy.pdf)}
              </span>
            </Button>

            <Button
              variant={wordStatus === "error" ? "destructive" : "default"}
              size="sm"
              onClick={exportWord}
              disabled={wordStatus === "loading" || pdfStatus === "loading"}
              className={cn(
                "h-10 min-w-0 justify-center gap-2 px-3 text-xs sm:text-sm",
                wordStatus === "success" && "bg-success text-success-foreground hover:bg-success/90",
              )}
            >
              {wordStatus === "loading" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : wordStatus === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : wordStatus === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {getButtonLabel(wordStatus, copy.word)}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
