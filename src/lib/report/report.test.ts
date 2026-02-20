import { describe, it, expect } from "vitest";
import { transformScanToReport } from "./transform";
import { renderReportHTML } from "./render-html";
import type { ReportData, IssueBreakdown } from "./types";

/* ── Test fixtures ─────────────────────────────────────── */

function makeScan(overrides: Partial<{
  score: number;
  issues: number;
  impactCritical: number;
  impactSerious: number;
  impactModerate: number;
  impactMinor: number;
  violations: Array<{
    id: string;
    impact: string;
    help: string;
    description: string;
    tags: string[];
    nodes: Array<{ target: string[]; html: string }>;
  }>;
}> = {}) {
  const violations = overrides.violations ?? [
    {
      id: "color-contrast",
      impact: "serious",
      help: "Elements must have sufficient color contrast",
      description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA.",
      tags: ["wcag143", "wcag2aa"],
      nodes: [
        { target: ["#header > h1"], html: "<h1 style='color:#aaa'>Title</h1>" },
        { target: [".nav > a"], html: "<a href='/'>Home</a>" },
        { target: [".footer p"], html: "<p>Footer text</p>" },
      ],
    },
    {
      id: "image-alt",
      impact: "critical",
      help: "Images must have alternate text",
      description: "Ensures <img> elements have alternate text.",
      tags: ["wcag111", "wcag2a"],
      nodes: [
        { target: ["img.hero"], html: "<img src='hero.jpg'>" },
        { target: ["img.logo"], html: "<img src='logo.png'>" },
      ],
    },
    {
      id: "label",
      impact: "moderate",
      help: "Form elements must have labels",
      description: "Ensures every form element has a label.",
      tags: ["wcag332", "wcag2a"],
      nodes: [
        { target: ["input#email"], html: "<input type='email'>" },
      ],
    },
    {
      id: "link-name",
      impact: "minor",
      help: "Links must have discernible text",
      description: "Ensures links have discernible text.",
      tags: ["wcag244", "wcag2a"],
      nodes: [
        { target: ["a.icon-link"], html: "<a href='#'><i class='icon'></i></a>" },
      ],
    },
  ];

  return {
    id: "scan-test-001",
    score: overrides.score ?? 65,
    issues: overrides.issues ?? 7,
    impactCritical: overrides.impactCritical ?? 2,
    impactSerious: overrides.impactSerious ?? 3,
    impactModerate: overrides.impactModerate ?? 1,
    impactMinor: overrides.impactMinor ?? 1,
    createdAt: "2025-02-20T05:00:00.000Z",
    raw: { violations },
    site: { url: "https://example.com" },
    page: { url: "https://example.com/about", title: "About Us" },
  };
}

function getReport(overrides?: Parameters<typeof makeScan>[0]): ReportData {
  return transformScanToReport(makeScan(overrides));
}

/* ── Task 5: Health Score ─────────────────────────────── */

describe("Health Score (Task 5)", () => {
  it("computes deterministic score from severity weights", () => {
    const report = getReport();
    // 2 critical×10 + 3 serious×6 + 1 moderate×3 + 1 minor×1 = 20+18+3+1 = 42
    // 100 - 42 = 58
    expect(report.healthScore.value).toBe(58);
    expect(report.healthScore.weightedPenalty).toBe(42);
  });

  it("returns grade D for score 58", () => {
    const report = getReport();
    expect(report.healthScore.grade).toBe("D");
    expect(report.healthScore.label).toBe("Needs Work");
  });

  it("clamps to 0 for extreme penalties", () => {
    const report = getReport({ impactCritical: 20, impactSerious: 10, impactModerate: 5, impactMinor: 5 });
    expect(report.healthScore.value).toBe(0);
    expect(report.healthScore.grade).toBe("F");
  });

  it("returns 100 for zero issues", () => {
    const report = getReport({
      score: 100,
      issues: 0,
      impactCritical: 0,
      impactSerious: 0,
      impactModerate: 0,
      impactMinor: 0,
      violations: [],
    });
    expect(report.healthScore.value).toBe(100);
    expect(report.healthScore.grade).toBe("A");
    expect(report.healthScore.label).toBe("Excellent");
  });

  it("is deterministic — same input always yields same output", () => {
    const a = getReport();
    const b = getReport();
    expect(a.healthScore.value).toBe(b.healthScore.value);
    expect(a.healthScore.grade).toBe(b.healthScore.grade);
    expect(a.healthScore.weightedPenalty).toBe(b.healthScore.weightedPenalty);
  });
});

/* ── Task 1: Executive Summary ────────────────────────── */

describe("Executive Summary (Task 1)", () => {
  it("includes healthScore in report data", () => {
    const report = getReport();
    expect(report.healthScore).toBeDefined();
    expect(typeof report.healthScore.value).toBe("number");
  });

  it("includes topPriorityFixes (max 5)", () => {
    const report = getReport();
    expect(report.topPriorityFixes).toBeDefined();
    expect(report.topPriorityFixes.length).toBeLessThanOrEqual(5);
    expect(report.topPriorityFixes.length).toBeGreaterThan(0);
  });

  it("top priority fixes are ranked by weighted impact descending", () => {
    const report = getReport();
    for (let i = 1; i < report.topPriorityFixes.length; i++) {
      expect(report.topPriorityFixes[i - 1].weightedImpact)
        .toBeGreaterThanOrEqual(report.topPriorityFixes[i].weightedImpact);
    }
  });
});

/* ── Task 2: WCAG Compliance Matrix ───────────────────── */

describe("WCAG Compliance Matrix (Task 2)", () => {
  it("generates matrix rows from violations", () => {
    const report = getReport();
    expect(report.wcagMatrix).toBeDefined();
    expect(report.wcagMatrix.length).toBeGreaterThan(0);
  });

  it("marks criteria with violations as Fail", () => {
    const report = getReport();
    const failRows = report.wcagMatrix.filter((r) => r.status === "Fail");
    expect(failRows.length).toBeGreaterThan(0);
    // color-contrast maps to wcag143 → 1.4.3
    const contrastRow = report.wcagMatrix.find((r) => r.criterion.includes("1.4.3"));
    expect(contrastRow?.status).toBe("Fail");
    expect(contrastRow?.relatedFindings).toBeGreaterThan(0);
  });

  it("marks criteria without violations as Pass when scan has data", () => {
    const report = getReport();
    const passRows = report.wcagMatrix.filter((r) => r.status === "Pass");
    expect(passRows.length).toBeGreaterThan(0);
  });

  it("marks all as Not Tested when no violations data", () => {
    const report = getReport({ violations: [] });
    const notTested = report.wcagMatrix.filter((r) => r.status === "Not Tested");
    expect(notTested.length).toBe(report.wcagMatrix.length);
  });

  it("each row has valid level (A/AA/AAA)", () => {
    const report = getReport();
    for (const row of report.wcagMatrix) {
      expect(["A", "AA", "AAA"]).toContain(row.level);
    }
  });
});

/* ── Task 3: Scan Configuration ───────────────────────── */

describe("Scan Configuration (Task 3)", () => {
  it("includes scan config in report data", () => {
    const report = getReport();
    expect(report.scanConfig).toBeDefined();
    expect(report.scanConfig.domain).toBe("https://example.com/about");
    expect(report.scanConfig.pagesAnalyzed).toBe(1);
    expect(report.scanConfig.engineName).toBe("axe-core");
    expect(report.scanConfig.engineVersion).toBe("4.10");
  });

  it("includes standards tested", () => {
    const report = getReport();
    expect(report.scanConfig.standardsTested.length).toBeGreaterThan(0);
    expect(report.scanConfig.standardsTested).toContain("WCAG 2.2 Level AA");
  });
});

/* ── Task 4: Evidence Tables — no truncation ──────────── */

describe("Evidence Tables — no truncation (Task 4)", () => {
  it("all affected element details are preserved (no slice)", () => {
    const report = getReport();
    // color-contrast has 3 nodes
    const ccIssue = report.priorityIssues.find((i) => i.id === "color-contrast");
    expect(ccIssue?.affectedElementDetails.length).toBe(3);
    // image-alt has 2 nodes
    const imgIssue = report.priorityIssues.find((i) => i.id === "image-alt");
    expect(imgIssue?.affectedElementDetails.length).toBe(2);
  });

  it("evidence counts match raw findings", () => {
    const report = getReport();
    for (const issue of report.priorityIssues) {
      expect(issue.affectedElements).toBe(issue.affectedElementDetails.length);
    }
  });
});

/* ── PDF rendering — no truncation patterns ───────────── */

describe("PDF rendering — no truncation (all tasks)", () => {
  it("does not contain 'and X more' in rendered HTML", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).not.toMatch(/and \d+ more/i);
    expect(html).not.toMatch(/…\s*and/);
  });

  it("contains Health Score section", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("Health Score");
    expect(html).toContain(String(report.healthScore.value));
  });

  it("contains WCAG Compliance Matrix section", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("WCAG 2.2 Compliance Matrix");
    expect(html).toContain("Success Criterion");
  });

  it("contains Scan Configuration section", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("Scan Configuration");
    expect(html).toContain("Domain Scanned");
    expect(html).toContain("User Agent");
  });

  it("contains Top Priority Fixes table", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("Top Priority Fixes");
    expect(html).toContain("Impact Score");
  });

  it("contains coverage note", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("Automated testing does not cover all WCAG requirements");
  });

  it("uses evidence tables (not loose paragraphs) for affected elements", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("evidence-table");
    expect(html).toContain("ev-mono");
    expect(html).toContain("HTML Snippet");
  });

  it("renders large reports without errors", () => {
    // Generate a scan with many violations
    const manyViolations = Array.from({ length: 50 }, (_, i) => ({
      id: `rule-${i}`,
      impact: i % 4 === 0 ? "critical" : i % 4 === 1 ? "serious" : i % 4 === 2 ? "moderate" : "minor",
      help: `Test rule ${i}`,
      description: `Description for rule ${i}`,
      tags: ["wcag143"],
      nodes: Array.from({ length: 20 }, (_, j) => ({
        target: [`.el-${i}-${j}`],
        html: `<div class="element-${i}-${j}">Content</div>`,
      })),
    }));

    const report = getReport({ violations: manyViolations });
    expect(report.priorityIssues.length).toBe(50);

    // Should render without throwing
    const html = renderReportHTML(report);
    expect(html.length).toBeGreaterThan(10000);
    expect(html).not.toMatch(/and \d+ more/i);
  });
});
