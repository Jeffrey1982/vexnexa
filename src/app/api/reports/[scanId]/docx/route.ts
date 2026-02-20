import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import {
  transformScanToReport,
  resolveWhiteLabelConfig,
  extractQueryOverrides,
  fetchImageAsBuffer,
  getStoredWhiteLabel,
  computeLogoDimensions,
} from "@/lib/report";
import type { ReportData, ReportIssue, Severity, WcagMatrixRow, TopPriorityFix } from "@/lib/report/types";
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

function severityLabel(s: Severity): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildDocx(data: ReportData, logoBuffer?: Buffer | null): Document {
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
        new TextRun({ text: "Accessibility Compliance Report", bold: true, size: 56, color: "1E1E1E" }),
      ],
    })
  );

  // Score + Grade
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `Score: ${data.score}/100`, bold: true, size: 40, color: data.score >= 80 ? "16A34A" : data.score >= 60 ? "D97706" : "DC2626" }),
        new TextRun({ text: `  •  Grade ${scoreGrade(data.score)}`, bold: true, size: 40, color: "374151" }),
      ],
    })
  );

  // Meta row
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `${data.complianceLevel}  •  Risk: ${data.riskLevel}  •  EAA 2025: ${data.eaaReady ? "Ready" : "Needs Work"}`, size: 22, color: "6B7280" }),
      ],
    })
  );

  // Date + footer
  const footerRuns: TextRun[] = [
    new TextRun({ text: `Report generated ${fmtDate(data.scanDate)}`, size: 20, color: "9CA3AF" }),
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
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }) as unknown as Paragraph,
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Executive Summary ──
  const hs = data.healthScore;
  const hsHex = hs.value >= 80 ? "16A34A" : hs.value >= 60 ? "D97706" : "DC2626";

  children.push(
    heading("Executive Summary"),
    // Health Score badge
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `Health Score: `, bold: true, size: 24, color: "374151" }),
        new TextRun({ text: `${hs.value}/100`, bold: true, size: 36, color: hsHex }),
        new TextRun({ text: `  (Grade ${hs.grade} — ${hs.label})`, size: 22, color: "6B7280" }),
      ],
    }),
    para(`The Health Score is derived from the number and severity of detected issues, normalized by pages analyzed. A higher score indicates fewer and less severe accessibility barriers.`),
    para(`Your website ${data.domain} achieved a health score of ${hs.value}/100 (Grade ${hs.grade}). ${data.issueBreakdown.critical > 0 ? `There are ${data.issueBreakdown.critical} critical issues requiring immediate attention.` : "No critical issues were detected."}`),
    spacer(),
    subheading("Severity Distribution"),
  );

  // Severity distribution table
  const sevTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(["Critical", "Serious", "Moderate", "Minor", "Total"], true),
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
    subheading("Accessibility Risk Summary"),
    para(`${data.riskLevel} Risk — ${data.riskSummary}`),
    spacer(),
    subheading("Estimated Remediation"),
    para(`Based on ${data.issueBreakdown.total} identified issues, the estimated developer effort is ${data.estimatedFixTime}.`),
    spacer(),
  );

  // Top Priority Fixes (Task 1)
  if (data.topPriorityFixes && data.topPriorityFixes.length > 0) {
    children.push(subheading("Top Priority Fixes"));
    const tpfTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRow(["#", "Issue", "Severity", "Elements", "Impact"], true),
        ...data.topPriorityFixes.map((f: TopPriorityFix) =>
          tableRow([String(f.rank), f.title, f.severity.toUpperCase(), String(f.affectedElements), String(f.weightedImpact)])
        ),
      ],
    });
    children.push(tpfTable as unknown as Paragraph);
    children.push(spacer());
  }

  // Key Metrics
  children.push(subheading("Key Metrics"));
  const metricsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(
        ["Health Score", "Total Issues", "Critical", "Serious", "Moderate", "Minor", "WCAG Checks Passed", "Est. Fix"],
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
        new TextRun({ text: "Note: ", bold: true, size: 20, color: "92400E" }),
        new TextRun({ text: "Automated testing does not cover all WCAG requirements. Manual review is recommended.", size: 20, color: "92400E", italics: true }),
      ],
    }),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Visual Breakdown ──
  children.push(
    heading("Visual Breakdown"),
    subheading("Severity Distribution"),
    para(`Critical: ${data.issueBreakdown.critical}  |  Serious: ${data.issueBreakdown.serious}  |  Moderate: ${data.issueBreakdown.moderate}  |  Minor: ${data.issueBreakdown.minor}`),
    spacer(),
    subheading("WCAG Level Status"),
    para(`WCAG 2.2 Level AA: ${data.wcagAAStatus === "pass" ? "Compliant" : data.wcagAAStatus === "partial" ? "Partial" : "Non-compliant"} (${data.compliancePercentage}%)`),
    para(`WCAG 2.2 Level AAA: ${data.wcagAAAStatus === "pass" ? "Compliant" : data.wcagAAAStatus === "partial" ? "Partial" : "Non-compliant"}`),
    para(`EAA 2025 Readiness: ${data.eaaReady ? "Ready" : "Needs Work"}`),
    spacer(),
    subheading("Accessibility Maturity Level"),
    para(`Current level: ${data.maturityLevel}`),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── WCAG 2.2 Compliance Matrix (Task 2) ──
  if (data.wcagMatrix && data.wcagMatrix.length > 0) {
    const failing = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Fail");
    const manualReview = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Needs Manual Review");
    const passing = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Pass");
    const notTested = data.wcagMatrix.filter((r: WcagMatrixRow) => r.status === "Not Tested");

    children.push(
      heading("WCAG 2.2 Compliance Matrix"),
      // Legend
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: "Legend: ", bold: true, size: 20, color: "374151" }),
          new TextRun({ text: "Pass", bold: true, size: 18, color: "16A34A" }),
          new TextRun({ text: " — No violations detected  |  ", size: 18, color: "6B7280" }),
          new TextRun({ text: "Fail", bold: true, size: 18, color: "DC2626" }),
          new TextRun({ text: " — Automated violations detected  |  ", size: 18, color: "6B7280" }),
          new TextRun({ text: "Needs Manual Review", bold: true, size: 18, color: "EA580C" }),
          new TextRun({ text: " — Cannot be fully verified automatically  |  ", size: 18, color: "6B7280" }),
          new TextRun({ text: "Not Tested", bold: true, size: 18, color: "9CA3AF" }),
          new TextRun({ text: " — Outside scan scope", size: 18, color: "6B7280" }),
        ],
      }),
      para(`Tested against ${data.wcagMatrix.length} WCAG 2.2 success criteria. ${passing.length} Pass, ${failing.length} Fail, ${manualReview.length} Needs Manual Review, ${notTested.length} Not Tested.`),
      spacer(),
    );

    // Show all failing, then manual review, then sample of passing
    const matrixRows = [...failing, ...manualReview, ...passing.slice(0, 10), ...notTested.slice(0, 5)];
    const wcagTable = new Table({
      width: { size: DOCX_TABLE_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [
        wcagMatrixRow(["Success Criterion", "Level", "Status", "Findings"], true),
        ...matrixRows.map((row: WcagMatrixRow) =>
          wcagMatrixRow([row.criterion, row.level, row.status, row.relatedFindings > 0 ? String(row.relatedFindings) : "—"])
        ),
      ],
    });
    children.push(wcagTable as unknown as Paragraph);
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
  }

  // ── Priority Issues (with Enterprise Evidence Tables) ──
  children.push(heading("Audit Findings"));

  if (data.priorityIssues.length === 0) {
    children.push(para("No accessibility issues were detected. Excellent work!"));
  } else {
    const DOCX_EVIDENCE_CHUNK = 50;
    const evBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" } };
    const evShading = { type: ShadingType.SOLID, color: "F3F4F6" } as const;

    function evHeaderRow(): TableRow {
      return new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: DOCX_COL_HASH, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, size: 18 })] })] }),
          new TableCell({ width: { size: DOCX_COL_URL, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: "Page / URL", bold: true, size: 18 })] })] }),
          new TableCell({ width: { size: DOCX_COL_SEL, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: "Selector", bold: true, size: 18 })] })] }),
          new TableCell({ width: { size: DOCX_COL_HTML, type: WidthType.DXA }, shading: evShading, borders: evBorders, margins: DOCX_CELL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: "HTML Snippet", bold: true, size: 18 })] })] }),
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
            new TextRun({ text: `[${severityLabel(issue.severity).toUpperCase()}]  `, bold: true, size: 20, color: sevColor(issue.severity) }),
            new TextRun({ text: issue.title, bold: true, size: 22 }),
          ],
        }),
        labeledPara("What's happening", issue.explanation),
        labeledPara("Business impact", issue.impact),
        labeledPara("How to fix", issue.recommendation),
        para(`${issue.affectedElements} element(s) affected  •  Est. ${issue.estimatedFixTime}${issue.wcagCriteria.length > 0 ? `  •  ${issue.wcagCriteria.join(", ")}` : ""}`, "9CA3AF"),
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
              children: [new TextRun({ text: `Affected Elements${chunkLabel}:`, bold: true, size: 20, color: "6B7280" })],
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
            new TextRun({ text: "Rule: ", bold: true, size: 18, color: "9CA3AF" }),
            new TextRun({ text: issue.id, size: 18, font: "Consolas", color: "9CA3AF" }),
          ],
        })
      );
    });
  }

  children.push(new Paragraph({ children: [], pageBreakBefore: true }));

  // ── Scan Configuration (Task 3) ──
  if (data.scanConfig) {
    const sc = data.scanConfig;
    children.push(
      heading("Scan Configuration"),
    );
    const scanConfigTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        configRow("Domain Scanned", sc.domain),
        configRow("Pages Analyzed", String(sc.pagesAnalyzed)),
        configRow("Crawl Depth", sc.crawlDepth),
        configRow("Scan Date/Time", fmtDate(sc.scanDateTime)),
        configRow("User Agent", sc.userAgent),
        configRow("Viewport", sc.viewport),
        configRow("Standards Tested", sc.standardsTested.join(", ")),
        configRow("Engine", `${sc.engineName} v${sc.engineVersion}`),
      ],
    });
    children.push(scanConfigTable as unknown as Paragraph);
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
  }

  // ── Compliance & Legal ──
  children.push(
    heading("Compliance & Legal"),
    subheading("European Accessibility Act (EAA) 2025"),
    para("The European Accessibility Act requires digital products and services to be accessible by June 28, 2025. Non-compliance may result in fines, market restrictions, and reputational damage across EU member states."),
    para(`Your status: ${data.eaaReady ? "Your site meets the baseline requirements for EAA compliance." : "Your site requires remediation to meet EAA requirements."}`),
    spacer(),
    subheading("Continuous Monitoring Recommendation"),
    para("Accessibility is not a one-time fix. We recommend automated weekly scans, quarterly manual audits, developer training on WCAG fundamentals, and accessibility testing as part of CI/CD pipeline."),
    spacer(),
    subheading("Audit Traceability"),
    para(`Scan ID: ${data.scanId}`),
    para(`Scan Date: ${fmtDate(data.scanDate)}`),
    para(`Engine: ${data.engineName} v${data.engineVersion}`),
    para(`Standard: ${data.complianceLevel}`),
    para(`Domain: ${data.domain}`),
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
                new TextRun({ text: fmtDate(data.scanDate), size: 16, color: "9CA3AF" }),
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
                new TextRun({ text: `Generated by ${brandName}`, size: 14, color: "B0B5BD" }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: "Report v1.0", size: 14, color: "B0B5BD" }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: "Page ", size: 14, color: "B0B5BD" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "B0B5BD" }),
                new TextRun({ text: " of ", size: 14, color: "B0B5BD" }),
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

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
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

    // Resolve white-label: query params > stored DB settings > defaults
    const url = new URL(req.url);
    const qp = extractQueryOverrides(url);
    const storedWL = await getStoredWhiteLabel(user.id);
    const resolved = resolveWhiteLabelConfig(qp, storedWL);

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
      resolved.reportStyle
    );

    const doc = buildDocx(reportData, logoBuffer);
    const arrayBuf = await Packer.toBuffer(doc);

    const filename = `accessibility-report-${scan.site.url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.docx`;

    return new Response(new Uint8Array(arrayBuf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[reports/docx] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
