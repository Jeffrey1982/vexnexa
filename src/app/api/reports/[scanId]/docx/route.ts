import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { transformScanToReport } from "@/lib/report";
import type { ReportData, ReportIssue, Severity, ReportStyle } from "@/lib/report/types";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";

export const runtime = "nodejs";

function severityLabel(s: Severity): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildDocx(data: ReportData): Document {
  const primary = data.whiteLabelConfig.primaryColor || data.themeConfig.primaryColor;

  const children: Paragraph[] = [];

  // ── Cover ──
  children.push(
    new Paragraph({ spacing: { after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: data.companyName, bold: true, size: 48, color: primary.replace("#", "") }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Accessibility Compliance Report", bold: true, size: 56, color: "1E1E1E" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: data.domain, size: 28, color: "6B7280" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `Score: ${data.score}/100  •  Grade ${scoreGrade(data.score)}`, bold: true, size: 40, color: data.score >= 80 ? "16A34A" : data.score >= 60 ? "D97706" : "DC2626" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `${data.complianceLevel}  •  Risk: ${data.riskLevel}  •  EAA 2025: ${data.eaaReady ? "Ready" : "Action Needed"}`, size: 22, color: "6B7280" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({ text: `Report generated ${fmtDate(data.scanDate)}`, size: 20, color: "9CA3AF" }),
      ],
    }),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Executive Summary ──
  children.push(
    heading("Executive Summary"),
    para(`Your website ${data.domain} achieved an accessibility score of ${data.score}/100 (Grade ${scoreGrade(data.score)}). ${data.issueBreakdown.critical > 0 ? `There are ${data.issueBreakdown.critical} critical issues requiring immediate attention.` : "No critical issues were detected."}`),
    spacer(),
    subheading("Legal Risk Assessment"),
    para(`${data.riskLevel} Risk — ${data.legalRisk}`),
    spacer(),
    subheading("Estimated Remediation"),
    para(`Based on ${data.issueBreakdown.total} identified issues, the estimated developer effort is ${data.estimatedFixTime}.`),
    spacer(),
    subheading("Key Metrics"),
  );

  // Metrics table
  const metricsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(
        ["Total Issues", "Critical", "Serious", "Moderate", "Minor", "Score", "Compliance", "Est. Fix"],
        true
      ),
      tableRow([
        String(data.issueBreakdown.total),
        String(data.issueBreakdown.critical),
        String(data.issueBreakdown.serious),
        String(data.issueBreakdown.moderate),
        String(data.issueBreakdown.minor),
        `${data.score}/100`,
        `${data.compliancePercentage}%`,
        data.estimatedFixTime,
      ]),
    ],
  });
  children.push(new Paragraph({ children: [] }));
  children.push(new Paragraph({ children: [], pageBreakBefore: true }));

  // ── Visual Breakdown ──
  children.push(
    heading("Visual Breakdown"),
    subheading("Severity Distribution"),
    para(`Critical: ${data.issueBreakdown.critical}  |  Serious: ${data.issueBreakdown.serious}  |  Moderate: ${data.issueBreakdown.moderate}  |  Minor: ${data.issueBreakdown.minor}`),
    spacer(),
    subheading("WCAG Level Status"),
    para(`WCAG 2.1 Level AA: ${data.wcagAAStatus === "pass" ? "Compliant" : data.wcagAAStatus === "partial" ? "Partial" : "Non-compliant"} (${data.compliancePercentage}%)`),
    para(`WCAG 2.1 Level AAA: ${data.wcagAAAStatus === "pass" ? "Compliant" : data.wcagAAAStatus === "partial" ? "Partial" : "Non-compliant"}`),
    para(`EAA 2025 Readiness: ${data.eaaReady ? "Ready" : "Action Needed"}`),
    spacer(),
    subheading("Accessibility Maturity Level"),
    para(`Current level: ${data.maturityLevel}`),
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // ── Priority Issues ──
  children.push(heading("Priority Issues"));

  if (data.priorityIssues.length === 0) {
    children.push(para("No accessibility issues were detected. Excellent work!"));
  } else {
    data.priorityIssues.forEach((issue: ReportIssue, idx: number) => {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: `#${idx + 1}  `, bold: true, size: 22, color: primary.replace("#", "") }),
            new TextRun({ text: `[${severityLabel(issue.severity).toUpperCase()}]  `, bold: true, size: 20, color: sevColor(issue.severity) }),
            new TextRun({ text: issue.title, bold: true, size: 22 }),
          ],
        }),
        labeledPara("What's happening", issue.explanation),
        labeledPara("Business impact", issue.impact),
        labeledPara("Recommended fix", issue.recommendation),
        para(`${issue.affectedElements} element(s) affected  •  Est. ${issue.estimatedFixTime}${issue.wcagCriteria.length > 0 ? `  •  ${issue.wcagCriteria.join(", ")}` : ""}`, "9CA3AF"),
      );
    });
  }

  children.push(new Paragraph({ children: [], pageBreakBefore: true }));

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

  const sections = [
    {
      children: [...children],
    },
  ];

  // Insert metrics table after the Key Metrics heading
  const metricsIdx = children.findIndex(
    (p) => p instanceof Paragraph && JSON.stringify(p).includes("Key Metrics")
  );
  if (metricsIdx >= 0) {
    sections[0].children.splice(metricsIdx + 1, 0, metricsTable as unknown as Paragraph);
  }

  return new Document({ sections });
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

    const url = new URL(req.url);
    const wlLogo: string = url.searchParams.get("logo") ?? "";
    const wlColor: string = url.searchParams.get("color") ?? "";
    const wlCompany: string = url.searchParams.get("company") ?? "";
    const wlBranding: boolean = url.searchParams.get("branding") !== "false";
    const styleParam: string = url.searchParams.get("reportStyle") ?? "bold";
    const ctaUrl: string = url.searchParams.get("ctaUrl") ?? "";
    const ctaText: string = url.searchParams.get("ctaText") ?? "";
    const supportEmail: string = url.searchParams.get("supportEmail") ?? "";

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
      undefined,
      {
        logoUrl: wlLogo,
        primaryColor: wlColor || undefined,
        companyNameOverride: wlCompany,
        showVexNexaBranding: wlBranding,
      },
      {
        ctaUrl: ctaUrl || undefined,
        ctaText: ctaText || undefined,
        supportEmail: supportEmail || undefined,
      },
      (styleParam === "corporate" ? "corporate" : "bold") as ReportStyle
    );

    const doc = buildDocx(reportData);
    const arrayBuf = await Packer.toBuffer(doc);

    const filename = `accessibility-report-${scan.site.url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.docx`;

    return new Response(new Uint8Array(arrayBuf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[reports/docx] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
