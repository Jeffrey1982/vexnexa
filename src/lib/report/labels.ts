import en from "../../../messages/en.json";
import nl from "../../../messages/nl.json";
import de from "../../../messages/de.json";
import es from "../../../messages/es.json";
import fr from "../../../messages/fr.json";
import pt from "../../../messages/pt.json";
import type { ReportLabels } from "./types";

const messages = { en, nl, de, es, fr, pt } as const;
type Locale = keyof typeof messages;

export const DEFAULT_REPORT_LABELS: ReportLabels = {
  vniIndex: "VexNexa Index",
  vniRank: "VNI Rank",
  outOf2500: "out of 2500",
  aiVisionAudit: "AI-Vision Audit",
  imageAltText: "Alt text",
  aiAssessment: "Gemini assessment",
  confidence: "Confidence",
  performanceParadox: "Performance Paradox",
  pageWeight: "Page Weight",
  visualLoadTime: "Visual Load Time",
  domComplexity: "DOM Complexity",
  realWorldQuality: "Real-World Quality",
  technicallyOptimizedHeavy: "Technically optimized, but physically heavy.",
};

export function resolveReportLabels(acceptLanguage?: string | null): ReportLabels {
  const requested = (acceptLanguage || "en").split(",")[0]?.split("-")[0]?.toLowerCase() as Locale;
  const locale: Locale = requested in messages ? requested : "en";
  const pdfLabels = (messages[locale] as any)?.scanReport?.pdf || {};

  return {
    ...DEFAULT_REPORT_LABELS,
    ...pdfLabels,
  };
}
