import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import {
  transformScanToReport,
  extractQueryOverrides,
  fetchImageAsBuffer,
  computeLogoDimensions,
  resolveReportLabels,
} from "@/lib/report";
import {
  formatReportDate,
  getDocxCopy,
  localizeMaturity,
  localizeRating,
  localizeRiskLevel,
  localizeSeverity,
  localizeWcagStatus,
} from "@/lib/report/docx-copy";
import { assertWithinLimits } from "@/lib/billing/entitlements";
import { resolveExportWhiteLabel } from "@/lib/report/get-stored-white-label";
import { exportAccessErrorResponse } from "@/lib/report/export-error";
import type { ReportData, ReportIssue, Severity, WcagMatrixRow, TopPriorityFix } from "@/lib/report/types";
import {
  EAA_LEARN_MORE_URL,
} from "@/lib/report/eaa-readiness-copy";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  TableOfContents,
  TableLayoutType,
  Header,
  Footer,
  PageNumber,
  TabStopPosition,
  TabStopType,
  VerticalAlign,
} from "docx";

// A4 usable width ≈ 9072 twips (158.75mm at 1440 twips/inch)
const DOCX_TABLE_WIDTH = 9072;
const DOCX_COL_HASH = Math.round(DOCX_TABLE_WIDTH * 0.05);   // # col ~454
const DOCX_COL_URL = Math.round(DOCX_TABLE_WIDTH * 0.25);    // URL col ~2268
const DOCX_COL_SEL = Math.round(DOCX_TABLE_WIDTH * 0.25);    // Selector col ~2268
const DOCX_COL_HTML = DOCX_TABLE_WIDTH - DOCX_COL_HASH - DOCX_COL_URL - DOCX_COL_SEL; // HTML col ~4082

const DOCX_CELL_MARGINS = {
  top: 60, bottom: 60, left: 80, right: 80,
} as const;

// WCAG matrix column widths (fixed DXA) — ~37% / 13% / 18% / 32%
const WCAG_COL_CRITERION = Math.round(DOCX_TABLE_WIDTH * 0.37);  // ~3357
const WCAG_COL_LEVEL     = Math.round(DOCX_TABLE_WIDTH * 0.13);  // ~1179
const WCAG_COL_STATUS    = Math.round(DOCX_TABLE_WIDTH * 0.18);  // ~1633
const WCAG_COL_FINDINGS  = DOCX_TABLE_WIDTH - WCAG_COL_CRITERION - WCAG_COL_LEVEL - WCAG_COL_STATUS; // remainder ~2903

/** Insert zero-width spaces after URL break characters for Word wrapping */
function softBreakUrl(url: string): string {
  return url.replace(/([/?.&=])/g, "$1\u200B");
}

export const runtime = "nodejs";

export function buildDocx(data: ReportData, logoBuffer?: Buffer | null): Document {
  const labels = data.labels;
  const copy = getDocxCopy(labels.locale);
  const localizedRisk = localizeRiskLevel(labels.locale, data.riskLevel);
  const primary = data.whiteLabelConfig.primaryColor || data.themeConfig.primaryColor;
  const primaryHex = primary.replace("#", "");

  const children: Paragraph[] = [];

  // ── Cover: Brand Block (top-left, prominent) ──

  // Logo image (if available) — aspect-ratio-preserving sizing
  if (logoBuffer) {
    const logoDims = computeLogoDimensions(logoBuffer);
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: logoDims.width, height: logoDims.height },
            type: "png",
          }),
        ],
      })
    );
  }

  // Company name (large, prominent, primary color)
  if (data.companyName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: data.companyName, bold: true, size: 44, color: primaryHex }),
        ],
      })
    );
  }

  // Domain
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: data.domain, size: 24, color: "6B7280" }),
      ],
    })
  );

  // Accent divider line (uses primary color via border)
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: primaryHex } },
      children: [],
    })
  );

  // Report title
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: labels.reportTitle, bold: true, size: 56, color: "1E1E1E" }),
      ],
    })
  );

  // Score + Grade
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: copy.scoreGrade(data.score, scoreGrade(data.score)), bold: true, size: 40, color: data.score >= 80 ? "16A34A" : data.score >= 60 ? "D97706" : "DC2626" }),
      ],
    })
  );

  // Meta row
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: copy.meta(data.complianceLevel, localizedRisk, data.eaaReady ? labels.onTrack : labels.needsWork), size: 22, color: "6B7280" }),
      ],
    })
  );

  // Date + footer
  const footerRuns: TextRun[] = [
    new TextRun({ text: copy.reportGenerated(formatReportDate(data.scanDate, labels.locale)), size: 20, color: "9CA3AF" }),
  ];
  if (data.whiteLabelConfig.footerText) {
    footerRuns.push(new TextRun({ text: `  •  ${data.whiteLabelConfig.footerText}`, size: 20, color: "9CA3AF" }));
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 600 },
      children: footerRuns,
    }),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Table of Contents (Word auto-generates from heading styles) ──
  children.push(
    new TableOfContents(labels.tableOfContents, {
      hyperlink: true,
      headingStyleRange: "1-3",
    }) as unknown as Paragraph,
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Executive Summary ──
  const hs = data.healthScore;
  const hsHex = hs.value >= 80 ? "16A34A" : hs.value >= 60 ? "D97706" : "DC2626";

  children.push(
    heading(labels.executiveSummary),
    // Health Score badge
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `${labels.healthScore}: `, bold: true, size: 24, color: "374151" }),
        new TextRun({ text: `${hs.value}/100`, bold: true, size: 36, color: hsHex }),
        new TextRun({ text: `  (${labels.grade} ${hs.grade} - ${localizeRating(labels, hs.label)})`, size: 22, color: "6B7280" }),
      ],
    }),
    para(copy.healthScoreExplanation),
    para(copy.healthSummary(data.domain, hs.value, hs.grade, data.issueBreakdown.critical)),
    spacer(),
    subheading(labels.severityDistribution),
  );

  // Severity distribution table
  const sevTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([labels.critical, labels.serious, labels.moderate, labels.minor, labels.totalIssues], true),
      tableRow([
        String(data.issueBreakdown.critical),
        String(data.issueBreakdown.serious),
        String(data.issueBreakdown.moderate),
        String(data.issueBreakdown.minor),
        String(data.issueBreakdown.total),
      ]),
    ],
  });
  children.push(sevTable as unknown as Paragraph);

  children.push(
    spacer(),
    subheading(labels.riskLevel),
    para(copy.riskSummary(localizedRisk, data.riskSummary)),
    spacer(),
    subheading(labels.estimatedFixTime),
    para(copy.estimatedRemediation(data.issueBreakdown.total, data.estimatedFixTime)),
    spacer(),
  );

  // Top Priority Fixes (Task 1)
  if (data.topPriorityFixes && data.topPriorityFixes.length > 0) {
    children.push(subheading(labels.topPriorityFixes));
    const tpfTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRow(["#", labels.issue, labels.severity, labels.elements, labels.impact], true),
        ...data.topPriorityFixes.map((f: TopPriorityFix) =>
          tableRow([String(f.rank), f.title, localizeSeverity(labels, f.severity), String(f.affectedElements), String(f.weightedImpact)])
        ),
      ],
    });
    children.push(tpfTable as unknown as Paragraph);
    children.push(spacer());
  }

  // Key Metrics
  children.push(subheading(labels.keyMetrics));
  const metricsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(
        [labels.healthScore, labels.totalIssues, labels.critical, labels.serious, labels.moderate, labels.minor, labels.wcagChecksPassed, labels.estimatedShort],
        true
      ),
      tableRow([
        `${hs.value}/100`,
        String(data.issueBreakdown.total),
        String(data.issueBreakdown.critical),
        String(data.issueBreakdown.serious),
        String(data.issueBreakdown.moderate),
        String(data.issueBreakdown.minor),
        `${data.compliancePercentage}%`,
        data.estimatedFixTime,
      ]),
    ],
  });
  children.push(metricsTable as unknown as Paragraph);

  // Coverage note
  children.push(
    spacer(),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${labels.note}: `, bold: true, size: 20, color: "92400E" }),
        new TextRun({ text: copy.coverageNote, size: 20, color: "92400E", italics: true }),
      ],
    }),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Visual Breakdown ──
  children.push(
    heading(labels.visualBreakdown),
    subheading(labels.severityDistribution),
    para(copy.distribution(data.issueBreakdown.critical, data.issueBreakdown.serious, data.issueBreakdown.moderate, data.issueBreakdown.minor)),
    spacer(),
    subheading(labels.wcagLevelStatus),
    para(copy.wcagStatus("WCAG 2.2 Level AA", data.wcagAAStatus === "pass" ? labels.statusCompliant : data.wcagAAStatus === "partial" ? labels.statusPartial : labels.statusNonCompliant, data.compliancePercentage)),
    para(copy.wcagStatus("WCAG 2.2 Level AAA", data.wcagAAAStatus === "pass" ? labels.statusCompliant : data.wcagAAAStatus === "partial" ? labels.statusPartial : labels.statusNonCompliant)),
    para(copy.wcagStatus("EAA 2025", data.eaaReady ? labels.onTrack : labels.needsWork)),
    spacer(),
    subheading(labels.accessibilityMaturityLevel),
    para(copy.currentMaturity(localizeMaturity(labels, data.maturityLevel))),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── WCAG 2.2 Compliance Matrix (Task 2) ──
  if (data.wcagMatrix && data.wcagMatrix.length > 0) {
    const failing = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Fail");
    const manualReview = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Needs Manual Review");
    const passing = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Pass");
    const notTested = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Not Tested");

    children.push(
      heading(labels.wcagComplianceMatrix),
      // Legend
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${copy.legend.prefix} `, bold: true, size: 20, color: "374151" }),
          new TextRun({ text: labels.statusPass, bold: true, size: 18, color: "16A34A" }),
          new TextRun({ text: ` - ${copy.legend.pass}  |  `, size: 18, color: "6B7280" }),
          new TextRun({ text: labels.statusFail, bold: true, size: 18, color: "DC2626" }),
          new TextRun({ text: ` - ${copy.legend.fail}  |  `, size: 18, color: "6B7280" }),
          new TextRun({ text: labels.statusNeedsManualReview, bold: true, size: 18, color: "EA580C" }),
          new TextRun({ text: ` - ${copy.legend.manual}  |  `, size: 18, color: "6B7280" }),
          new TextRun({ text: labels.statusNotTested, bold: true, size: 18, color: "9CA3AF" }),
          new TextRun({ text: ` - ${copy.legend.notTested}`, size: 18, color: "6B7280" }),
        ],
      }),
      para(copy.testedSummary(data.wcagMatrix.length, passing.length, failing.length, manualReview.length, notTested.length)),
      spacer(),
    );

    // Show all failing, then manual review, then sample of passing
    const matrixRows = [...failing, ...manualReview, ...passing.slice(0, 10), ...notTested.slice(0, 5)];
    const wcagTable = new Table({
      width: { size: DOCX_TABLE_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [
        wcagMatrixRow([labels.successCriterion, labels.level, labels.status, labels.findings], true),
        ...matrixRows.map((row: WcagMatrixRow) =>
          wcagMatrixRow([row.criterion, row.level, localizeWcagStatus(labels, row.status), row.relatedFindings > 0 ? String(row.relatedFindings) : "-"])
        ),
      ],
    });
    children.push(wcagTable as unknown as Paragraph);
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
  }

  // ── Priority Issues (with Enterprise Evidence Tables) ──
  children.push(heading(labels.auditFindings));

  if (data.priorityIssues.length === 0) {
    children.push(para(labels.noIssuesDetected));
  } else {
    const DOCX_EVIDENCE_CHUNK = 50;
    const evBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" } };
    const evShading = { type: ShadingType.SOLID, color: "F3F4F6" } as const;

    function evHeaderRow(): TableRow {
      return new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: DOCX_COL_HASH, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, size: 18 })] })] }),
          new TableCell({ width: { size: DOCX_COL_URL, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: labels.pageUrl, bold: true, size: 18 })] })] }),
          new TableCell({ width: { size: DOCX_COL_SEL, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: labels.selector, bold: true, size: 18 })] })] }),
          new TableCell({ width: { size: DOCX_COL_HTML, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: labels.htmlSnippet, bold: true, size: 18 })] })] }),
        ],
      });
    }

    data.priorityIssues.forEach((issue: ReportIssue, idx: number) => {
      // Heading 3 for each finding — enables Word TOC navigation
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: `#${idx + 1}  `, bold: true, size: 22, color: primaryHex }),
            new TextRun({ text: `[${localizeSeverity(labels, issue.severity).toUpperCase()}]  `, bold: true, size: 20, color: sevColor(issue.severity) }),
            new TextRun({ text: issue.title, bold: true, size: 22 }),
          ],
        }),
        labeledPara(labels.whatsHappening, issue.explanation),
        labeledPara(labels.businessImpact, issue.impact),
        labeledPara(labels.howToFix, issue.recommendation),
        para(copy.affectedCount(issue.affectedElements, issue.estimatedFixTime, issue.wcagCriteria.join(", ")), "9CA3AF"),
      );

      // Evidence tables — chunked for large lists, header row repeats on page breaks
      const details = issue.affectedElementDetails ?? [];
      if (details.length > 0) {
        const totalChunks = Math.ceil(details.length / DOCX_EVIDENCE_CHUNK);
        for (let ci = 0; ci < totalChunks; ci++) {
          const chunk = details.slice(ci * DOCX_EVIDENCE_CHUNK, (ci + 1) * DOCX_EVIDENCE_CHUNK);
          const offset = ci * DOCX_EVIDENCE_CHUNK;
          const chunkLabel = totalChunks > 1 ? ` (${ci + 1}/${totalChunks})` : "";
          children.push(
            new Paragraph({
              spacing: { before: 80, after: 40 },
              children: [new TextRun({ text: `${labels.affectedElements}${chunkLabel}:`, bold: true, size: 20, color: "6B7280" })],
            })
          );
          const evidenceTable = new Table({
            width: { size: DOCX_TABLE_WIDTH, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            rows: [
              evHeaderRow(),
              ...chunk.map((el, elIdx: number) =>
                new TableRow({
                  children: [
                    new TableCell({ width: { size: DOCX_COL_HASH, type: WidthType.DXA }, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(offset + elIdx + 1), size: 18, color: "6B7280" })] })] }),
                    new TableCell({ width: { size: DOCX_COL_URL, type: WidthType.DXA }, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: softBreakUrl(el.pageUrl || data.domain), size: 18, color: "6B7280" })] })] }),
                    new TableCell({ width: { size: DOCX_COL_SEL, type: WidthType.DXA }, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: el.selector, size: 18, font: "Consolas", color: "374151" })] })] }),
                    new TableCell({ width: { size: DOCX_COL_HTML, type: WidthType.DXA }, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: el.html || "\u2014", size: 16, font: "Consolas", color: "6B7280" })] })] }),
                  ],
                })
              ),
            ],
          });
          children.push(evidenceTable as unknown as Paragraph);
        }
      }

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${labels.rule}: `, bold: true, size: 18, color: "9CA3AF" }),
            new TextRun({ text: issue.id, size: 18, font: "Consolas", color: "9CA3AF" }),
          ],
        })
      );
    });
  }

  // ── EAA Readiness (after findings, before scan configuration) ──
  const eaaCtx = `${labels.domain}: ${data.domain}  |  ${labels.score}: ${data.score}/100  |  ${labels.totalIssues}: ${data.issueBreakdown.total}`;
  children.push(
    heading(labels.eaaReadiness),
    ...(eaaCtx
      ? [para(eaaCtx)]
      : [
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `${copy.automatedScan} - `, bold: true, size: 20, color: "6B7280" }),
              new TextRun({
                text: copy.indicatorsOnly,
                size: 20,
                color: "6B7280",
                italics: true,
              }),
            ],
          }),
        ]),
    para(copy.eaaIntro),
    spacer(),
    subheading(copy.relevantStandards),
    para(copy.standardsBody),
    spacer(),
    subheading(copy.scanCovers),
    para(copy.scanCoversBody),
    spacer(),
    subheading(copy.importantNote),
    para(copy.importantNoteBody),
    spacer(),
    para(copy.recommendationClosing),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `${copy.learnMore}: `, size: 20, color: "374151" }),
        new TextRun({ text: EAA_LEARN_MORE_URL, size: 20, color: "2563EB" }),
      ],
    }),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Scan Configuration (Task 3) ──
  if (data.scanConfig) {
    const sc = data.scanConfig;
    children.push(
      heading(labels.scanConfiguration),
    );
    const scanConfigTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        configRow(labels.domainScanned, sc.domain),
        configRow(labels.pagesAnalyzed, String(sc.pagesAnalyzed)),
        configRow(
          labels.crawlDepth,
          sc.crawlDepth === "Single page"
            ? labels.singlePage
            : sc.crawlDepth === "Multi-page"
              ? labels.multiPage
              : sc.crawlDepth,
        ),
        configRow(labels.scanDateTime, formatReportDate(sc.scanDateTime, labels.locale)),
        configRow(labels.userAgent, sc.userAgent),
        configRow(labels.viewport, sc.viewport),
        configRow(labels.standardsTested, sc.standardsTested.join(", ")),
        configRow(labels.engine, `${sc.engineName} v${sc.engineVersion}`),
      ],
    });
    children.push(scanConfigTable as unknown as Paragraph);
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
  }

  // ── Compliance & Legal ──
  children.push(
    heading(labels.complianceLegal),
    subheading(labels.legalNotice),
    para(copy.legalNoticeBody),
    para(labels.complianceLegalAutomated),
    spacer(),
    subheading(labels.continuousMonitoringRecommendation),
    para(labels.continuousMonitoringCopy),
    spacer(),
    subheading(labels.auditTraceability),
    para(`${labels.scan} ID: ${data.scanId}`),
    para(`${labels.scanDate}: ${formatReportDate(data.scanDate, labels.locale)}`),
    para(`${labels.engine}: ${data.engineName} v${data.engineVersion}`),
    para(`${labels.standard}: ${data.complianceLevel}`),
    para(`${labels.domain}: ${data.domain}`),
  );

  // ── Footer ──
  if (data.whiteLabelConfig.footerText) {
    children.push(
      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: data.whiteLabelConfig.footerText, size: 18, color: "9CA3AF" })],
      })
    );
  }

  const brandName = data.reportBranding?.companyName || data.whiteLabelConfig.companyNameOverride || "VexNexa";

  return new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: data.domain, size: 16, color: "9CA3AF" }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: formatReportDate(data.scanDate, labels.locale), size: 16, color: "9CA3AF" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              tabStops: [
                { type: TabStopType.CENTER, position: Math.round(TabStopPosition.MAX / 2) },
                { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
              ],
              children: [
                new TextRun({ text: copy.generatedBy(brandName), size: 14, color: "B0B5BD" }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: labels.reportVersion, size: 14, color: "B0B5BD" }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `${copy.page} `, size: 14, color: "B0B5BD" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "B0B5BD" }),
                new TextRun({ text: ` ${copy.of} `, size: 14, color: "B0B5BD" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "B0B5BD" }),
              ],
            }),
          ],
        }),
      },
      children: [...children],
    }],
  });
}

/* ── DOCX Helpers ──────────────────────────────────────── */

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36 })],
  });
}

function subheading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 160, after: 100 },
    children: [new TextRun({ text, bold: true, size: 26 })],
  });
}

function para(text: string, color?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, color: color?.replace("#", "") })],
  });
}

function labeledPara(label: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, color: "6B7280" }),
      new TextRun({ text, size: 21 }),
    ],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

function configRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: "F9FAFB" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
        },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: "374151" })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
        },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
      }),
    ],
  });
}

const WCAG_COL_WIDTHS = [WCAG_COL_CRITERION, WCAG_COL_LEVEL, WCAG_COL_STATUS, WCAG_COL_FINDINGS];
const WCAG_COL_ALIGNS = [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER];

function wcagMatrixRow(cells: string[], isHeader: boolean = false): TableRow {
  return new TableRow({
    children: cells.map((text, idx) => {
      const isFirstCol = idx === 0;
      return new TableCell({
        width: { size: WCAG_COL_WIDTHS[idx] ?? Math.floor(DOCX_TABLE_WIDTH / cells.length), type: WidthType.DXA },
        verticalAlign: VerticalAlign.TOP,
        shading: isHeader ? { type: ShadingType.SOLID, color: "F3F4F6" } : undefined,
        margins: DOCX_CELL_MARGINS,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
        },
        children: [
          new Paragraph({
            alignment: isHeader ? AlignmentType.CENTER : (WCAG_COL_ALIGNS[idx] ?? AlignmentType.CENTER),
            spacing: { before: 0, after: 0, line: 240 },
            indent: isFirstCol && !isHeader ? { left: 0, hanging: 0 } : undefined,
            children: [new TextRun({ text, bold: isHeader, size: 20 })],
          }),
        ],
      });
    }),
  });
}

function tableRow(cells: string[], isHeader: boolean = false): TableRow {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
          shading: isHeader ? { type: ShadingType.SOLID, color: "F3F4F6" } : undefined,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: isHeader, size: 20 })],
            }),
          ],
        })
    ),
  });
}

function scoreGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

function sevColor(s: Severity): string {
  switch (s) {
    case "critical": return "DC2626";
    case "serious": return "EA580C";
    case "moderate": return "D97706";
    case "minor": return "2563EB";
  }
}

/* ── Route Handler ─────────────────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<Response> {
  const { scanId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { site: true, page: true },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    if (scan.site.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await assertWithinLimits({
      userId: user.id,
      action: "export_word",
    });

    // Resolve white-label: query params > stored DB settings > defaults
    const url = new URL(req.url);
    const labels = resolveReportLabels(
      req.headers.get("accept-language"),
      url.searchParams.get("language"),
    );
    const qp = extractQueryOverrides(url);
    const resolved = await resolveExportWhiteLabel(user.id, qp);

    // Fetch logo as buffer for DOCX embedding
    let logoBuffer: Buffer | null = null;
    if (resolved.whiteLabelConfig.logoUrl) {
      logoBuffer = await fetchImageAsBuffer(resolved.whiteLabelConfig.logoUrl);
    }

    const reportData = transformScanToReport(
      {
        id: scan.id,
        score: scan.score,
        issues: scan.issues,
        impactCritical: scan.impactCritical,
        impactSerious: scan.impactSerious,
        impactModerate: scan.impactModerate,
        impactMinor: scan.impactMinor,
        wcagAACompliance: (scan as Record<string, unknown>).wcagAACompliance as number | null | undefined,
        wcagAAACompliance: (scan as Record<string, unknown>).wcagAAACompliance as number | null | undefined,
        createdAt: scan.createdAt.toISOString(),
        raw: scan.raw,
        site: { url: scan.site.url },
        page: scan.page ? { url: scan.page.url, title: scan.page.title ?? undefined } : null,
      },
      resolved.themeConfig,
      resolved.whiteLabelConfig,
      resolved.ctaConfig,
      resolved.reportStyle,
      labels
    );

    const doc = buildDocx(reportData, logoBuffer);
    const arrayBuf = await Packer.toBuffer(doc);

    const filename = `accessibility-report-${labels.locale}-${scan.site.url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.docx`;

    return new Response(new Uint8Array(arrayBuf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const denied = exportAccessErrorResponse(error, "Word export is not available for this plan.");
    if (denied) return denied;
    if ((error as { code?: string })?.code === "UPGRADE_REQUIRED") {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Word export is not available for this plan.",
          code: "UPGRADE_REQUIRED",
          feature: (error as { feature?: string }).feature,
        },
        { status: 402 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[reports/docx] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
