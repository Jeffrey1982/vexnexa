import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { transformScanToReport } from "./transform";
import { renderReportHTML } from "./render-html";
import type { ReportData } from "./types";

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

/* ═══════════════════════════════════════════════════════════
   Task 1 — Health Score: Normalized Exponential Decay
   ═══════════════════════════════════════════════════════════ */

describe("Health Score — exponential decay model", () => {
  it("uses exponential decay: 100 * exp(-0.05 * normalizedPenalty)", () => {
    const report = getReport();
    // weightedPenalty = 2*10 + 3*6 + 1*3 + 1*1 = 42, pages=1
    // normalizedPenalty = 42/1 = 42
    // score = round(100 * exp(-0.05 * 42)) = round(100 * 0.1225) = 12
    expect(report.healthScore.weightedPenalty).toBe(42);
    expect(report.healthScore.normalizedPenalty).toBe(42);
    const expected = Math.round(100 * Math.exp(-0.05 * 42));
    expect(report.healthScore.value).toBe(expected);
  });

  it("returns 100 for zero issues", () => {
    const report = getReport({
      score: 100, issues: 0,
      impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0,
      violations: [],
    });
    expect(report.healthScore.value).toBe(100);
    expect(report.healthScore.grade).toBe("A");
    expect(report.healthScore.label).toBe("Excellent");
    expect(report.healthScore.normalizedPenalty).toBe(0);
  });

  it("produces realistic scores for moderate issues (not collapsed to 0)", () => {
    // 10 moderate issues: penalty = 30, exp(-0.05*30) ≈ 0.223 → score ≈ 22
    // This is more realistic than linear 100-30=70 for 10 moderate issues
    const report = getReport({
      impactCritical: 0, impactSerious: 0, impactModerate: 10, impactMinor: 0,
      issues: 10, score: 70,
      violations: Array.from({ length: 10 }, (_, i) => ({
        id: `mod-${i}`, impact: "moderate", help: `Mod ${i}`, description: `Desc ${i}`,
        tags: ["wcag143"], nodes: [{ target: [`.m${i}`], html: `<div>${i}</div>` }],
      })),
    });
    expect(report.healthScore.value).toBeGreaterThan(0);
    expect(report.healthScore.value).toBeLessThan(100);
  });

  it("never exceeds 100 or goes below 0", () => {
    // Extreme penalty
    const extreme = getReport({ impactCritical: 100, impactSerious: 50, impactModerate: 30, impactMinor: 20 });
    expect(extreme.healthScore.value).toBeGreaterThanOrEqual(0);
    expect(extreme.healthScore.value).toBeLessThanOrEqual(100);
    // Zero penalty
    const zero = getReport({
      impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0,
      issues: 0, score: 100, violations: [],
    });
    expect(zero.healthScore.value).toBe(100);
  });

  it("is monotonic: more issues → lower or equal score", () => {
    const scores: number[] = [];
    for (let c = 0; c <= 10; c++) {
      const r = getReport({ impactCritical: c, impactSerious: 0, impactModerate: 0, impactMinor: 0, issues: c });
      scores.push(r.healthScore.value);
    }
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("is deterministic: same input → same output", () => {
    const a = getReport();
    const b = getReport();
    expect(a.healthScore.value).toBe(b.healthScore.value);
    expect(a.healthScore.grade).toBe(b.healthScore.grade);
    expect(a.healthScore.normalizedPenalty).toBe(b.healthScore.normalizedPenalty);
  });

  it("exposes normalizedPenalty field", () => {
    const report = getReport();
    expect(typeof report.healthScore.normalizedPenalty).toBe("number");
    expect(report.healthScore.normalizedPenalty).toBeGreaterThanOrEqual(0);
  });

  it("assigns correct grade boundaries", () => {
    // Grade A: ≥90
    const a = getReport({ impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 1, issues: 1, score: 99 });
    expect(a.healthScore.value).toBeGreaterThanOrEqual(90);
    expect(a.healthScore.grade).toBe("A");
  });
});

/* ═══════════════════════════════════════════════════════════
   Task 2 — WCAG Matrix: Needs Manual Review + Legend
   ═══════════════════════════════════════════════════════════ */

describe("WCAG Compliance Matrix — Needs Manual Review", () => {
  it("includes 'Needs Manual Review' status for manual-only criteria", () => {
    const report = getReport();
    const manualRows = report.wcagMatrix.filter((r) => r.status === "Needs Manual Review");
    expect(manualRows.length).toBeGreaterThan(0);
  });

  it("classifies known manual-only criteria correctly (e.g., 1.2.1 Audio-only)", () => {
    const report = getReport();
    const audioRow = report.wcagMatrix.find((r) => r.criterion.includes("1.2.1"));
    expect(audioRow).toBeDefined();
    expect(audioRow!.status).toBe("Needs Manual Review");
  });

  it("classifies 2.4.5 Multiple Ways as Needs Manual Review", () => {
    const report = getReport();
    const row = report.wcagMatrix.find((r) => r.criterion.includes("2.4.5"));
    expect(row).toBeDefined();
    expect(row!.status).toBe("Needs Manual Review");
  });

  it("still marks criteria with violations as Fail (overrides manual review)", () => {
    const report = getReport();
    const failRows = report.wcagMatrix.filter((r) => r.status === "Fail");
    expect(failRows.length).toBeGreaterThan(0);
    const contrastRow = report.wcagMatrix.find((r) => r.criterion.includes("1.4.3"));
    expect(contrastRow?.status).toBe("Fail");
  });

  it("marks non-manual criteria without violations as Pass", () => {
    const report = getReport();
    const passRows = report.wcagMatrix.filter((r) => r.status === "Pass");
    expect(passRows.length).toBeGreaterThan(0);
  });

  it("marks non-manual criteria as Not Tested when no violations data", () => {
    const report = getReport({ violations: [] });
    const notTested = report.wcagMatrix.filter((r) => r.status === "Not Tested");
    const manualReview = report.wcagMatrix.filter((r) => r.status === "Needs Manual Review");
    // All criteria are either Not Tested or Needs Manual Review (none Pass/Fail)
    expect(notTested.length + manualReview.length).toBe(report.wcagMatrix.length);
    expect(manualReview.length).toBeGreaterThan(0);
    expect(notTested.length).toBeGreaterThan(0);
  });

  it("has exactly 4 valid statuses", () => {
    const report = getReport();
    const statuses = new Set(report.wcagMatrix.map((r) => r.status));
    for (const s of statuses) {
      expect(["Pass", "Fail", "Needs Manual Review", "Not Tested"]).toContain(s);
    }
  });

  it("each row has valid level (A/AA/AAA)", () => {
    const report = getReport();
    for (const row of report.wcagMatrix) {
      expect(["A", "AA", "AAA"]).toContain(row.level);
    }
  });

  it("sorts Fail first, then Needs Manual Review, then Pass, then Not Tested", () => {
    const report = getReport();
    const statusOrder: Record<string, number> = { Fail: 0, "Needs Manual Review": 1, Pass: 2, "Not Tested": 3 };
    for (let i = 1; i < report.wcagMatrix.length; i++) {
      const prev = statusOrder[report.wcagMatrix[i - 1].status] ?? 3;
      const curr = statusOrder[report.wcagMatrix[i].status] ?? 3;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

/* ═══════════════════════════════════════════════════════════
   Task 3 — Evidence Tables: Page/URL column always present
   ═══════════════════════════════════════════════════════════ */

describe("Evidence Tables — Page/URL column", () => {
  it("every affected element detail has pageUrl populated", () => {
    const report = getReport();
    for (const issue of report.priorityIssues) {
      for (const el of issue.affectedElementDetails) {
        expect(el.pageUrl).toBeDefined();
        expect(el.pageUrl!.length).toBeGreaterThan(0);
      }
    }
  });

  it("pageUrl defaults to scan page URL", () => {
    const report = getReport();
    const el = report.priorityIssues[0].affectedElementDetails[0];
    expect(el.pageUrl).toBe("https://example.com/about");
  });

  it("pageUrl falls back to site URL when page URL is missing", () => {
    const scan = makeScan();
    (scan as unknown as { page: null }).page = null;
    const report = transformScanToReport(scan);
    const el = report.priorityIssues[0].affectedElementDetails[0];
    expect(el.pageUrl).toBe("https://example.com");
  });

  it("evidence counts match raw findings (no truncation)", () => {
    const report = getReport();
    for (const issue of report.priorityIssues) {
      expect(issue.affectedElements).toBe(issue.affectedElementDetails.length);
    }
  });

  it("all affected element details are preserved (no slice)", () => {
    const report = getReport();
    const ccIssue = report.priorityIssues.find((i) => i.id === "color-contrast");
    expect(ccIssue?.affectedElementDetails.length).toBe(3);
    const imgIssue = report.priorityIssues.find((i) => i.id === "image-alt");
    expect(imgIssue?.affectedElementDetails.length).toBe(2);
  });
});

/* ═══════════════════════════════════════════════════════════
   Task 4 — No "legal risk" wording
   ═══════════════════════════════════════════════════════════ */

describe("Risk wording — no legal language", () => {
  it("riskSummary field exists and does not contain 'legal'", () => {
    const report = getReport();
    expect(report.riskSummary).toBeDefined();
    expect(report.riskSummary.toLowerCase()).not.toContain("legal");
  });

  it("legalRisk field preserved for backward compat but uses safe wording", () => {
    const report = getReport();
    expect(report.legalRisk).toBeDefined();
    expect(report.legalRisk.toLowerCase()).not.toContain("legal");
    expect(report.legalRisk).toBe(report.riskSummary);
  });
});

/* ═══════════════════════════════════════════════════════════
   Task 5A — HTML Export Golden-File Snapshot
   ═══════════════════════════════════════════════════════════ */

describe("HTML export — golden-file regression", () => {
  function getHTML(overrides?: Parameters<typeof makeScan>[0]): string {
    return renderReportHTML(getReport(overrides));
  }

  it("no 'and X more' truncation text", () => {
    const html = getHTML();
    expect(html).not.toMatch(/and \d+ more/i);
    expect(html).not.toMatch(/…\s*and/);
  });

  it("evidence row count matches input element count", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    // Count <tr> rows with ev-num class (evidence rows)
    const evRows = (html.match(/class="ev-num"/g) || []).length;
    const totalElements = report.priorityIssues.reduce((sum, i) => sum + i.affectedElementDetails.length, 0);
    // Each element gets rendered twice (premium renders all, but we check total matches)
    // Actually each issue renders once in premium mode
    expect(evRows).toBe(totalElements);
  });

  it("matrix includes 'Needs Manual Review' status", () => {
    const html = getHTML();
    expect(html).toContain("Needs Manual Review");
  });

  it("matrix legend exists with all 4 statuses", () => {
    const html = getHTML();
    expect(html).toContain("matrix-legend");
    expect(html).toContain("No violations detected");
    expect(html).toContain("Automated violations detected");
    expect(html).toContain("Cannot be fully verified automatically");
    expect(html).toContain("Outside scan scope");
  });

  it("Page / URL column present in evidence tables", () => {
    const html = getHTML();
    expect(html).toContain("Page / URL");
    expect(html).toContain("ev-url");
  });

  it("does not contain 'Legal Risk Assessment' heading", () => {
    const html = getHTML();
    expect(html).not.toContain("Legal Risk Assessment");
    expect(html).toContain("Accessibility Risk Summary");
  });

  it("does not contain 'legal risk' in CTA section", () => {
    const html = getHTML();
    expect(html).not.toMatch(/reduce legal risk/i);
    expect(html).toContain("reduce accessibility risk");
  });

  it("does not contain 'legal exposure' in risk summary text", () => {
    const html = getHTML();
    expect(html).not.toMatch(/legal exposure/i);
  });

  it("contains Health Score without formula display", () => {
    const html = getHTML();
    expect(html).toContain("Health Score");
    // Formula must NOT appear in customer-facing exports
    expect(html).not.toContain("exp(");
    expect(html).not.toMatch(/0\.05/);
    expect(html).not.toMatch(/100\s*[×x]\s*exp/i);
    // Microcopy should be present instead
    expect(html).toContain("derived from the number and severity");
  });

  it("contains coverage note", () => {
    const html = getHTML();
    expect(html).toContain("Automated testing does not cover all WCAG requirements");
  });

  it("evidence tables use structured HTML tables", () => {
    const html = getHTML();
    expect(html).toContain("evidence-table");
    expect(html).toContain("ev-mono");
    expect(html).toContain("HTML Snippet");
  });

  it("renders 50 violations × 20 nodes without errors", () => {
    const manyViolations = Array.from({ length: 50 }, (_, i) => ({
      id: `rule-${i}`,
      impact: i % 4 === 0 ? "critical" : i % 4 === 1 ? "serious" : i % 4 === 2 ? "moderate" : "minor",
      help: `Test rule ${i}`, description: `Description for rule ${i}`,
      tags: ["wcag143"],
      nodes: Array.from({ length: 20 }, (_, j) => ({
        target: [`.el-${i}-${j}`], html: `<div class="element-${i}-${j}">Content</div>`,
      })),
    }));
    const report = getReport({ violations: manyViolations });
    expect(report.priorityIssues.length).toBe(50);
    const html = renderReportHTML(report);
    expect(html.length).toBeGreaterThan(10000);
    expect(html).not.toMatch(/and \d+ more/i);
    // All 1000 evidence rows rendered (50 × 20)
    const evRows = (html.match(/class="ev-num"/g) || []).length;
    expect(evRows).toBe(1000);
  });

  it("renders > 20 affected elements for a single issue without truncation", () => {
    const report = getReport({
      violations: [{
        id: "big-rule", impact: "serious", help: "Big rule", description: "Many elements",
        tags: ["wcag143"],
        nodes: Array.from({ length: 25 }, (_, j) => ({
          target: [`.big-${j}`], html: `<div>${j}</div>`,
        })),
      }],
    });
    const issue = report.priorityIssues[0];
    expect(issue.affectedElementDetails.length).toBe(25);
    const html = renderReportHTML(report);
    const evRows = (html.match(/class="ev-num"/g) || []).length;
    expect(evRows).toBe(25);
  });

  it("has anchor IDs on all major sections", () => {
    const html = getHTML();
    expect(html).toContain('id="exec-summary"');
    expect(html).toContain('id="visual-breakdown"');
    expect(html).toContain('id="wcag-matrix"');
    expect(html).toContain('id="findings-index"');
    expect(html).toContain('id="scan-config"');
    expect(html).toContain('id="appendix"');
  });

  it("has per-finding anchor IDs", () => {
    const html = getHTML();
    // Default fixture has color-contrast, image-alt, label, link-name
    expect(html).toContain('id="finding-color-contrast"');
    expect(html).toContain('id="finding-image-alt"');
    expect(html).toContain('id="finding-label"');
    expect(html).toContain('id="finding-link-name"');
  });
});

/* ═══════════════════════════════════════════════════════════
   TOC — Table of Contents for long reports
   ═══════════════════════════════════════════════════════════ */

describe("TOC — Table of Contents", () => {
  function makeLongReport(): string {
    const manyViolations = Array.from({ length: 25 }, (_, i) => ({
      id: `rule-${i}`, impact: "serious" as const,
      help: `Rule ${i}`, description: `Desc ${i}`,
      tags: ["wcag143"],
      nodes: Array.from({ length: 10 }, (_, j) => ({
        target: [`.el-${i}-${j}`], html: `<div>${j}</div>`,
      })),
    }));
    return renderReportHTML(getReport({ violations: manyViolations }));
  }

  it("renders TOC for long reports (>=20 findings)", () => {
    const html = makeLongReport();
    expect(html).toContain('id="toc"');
    expect(html).toContain("toc-nav");
    expect(html).toContain("Table of Contents");
  });

  it("TOC has links to all major sections", () => {
    const html = makeLongReport();
    expect(html).toContain('href="#exec-summary"');
    expect(html).toContain('href="#visual-breakdown"');
    expect(html).toContain('href="#wcag-matrix"');
    expect(html).toContain('href="#findings-index"');
    expect(html).toContain('href="#scan-config"');
    expect(html).toContain('href="#appendix"');
  });

  it("TOC has links to individual findings", () => {
    const html = makeLongReport();
    expect(html).toContain('href="#finding-rule-0"');
    expect(html).toContain('href="#finding-rule-24"');
  });

  it("TOC entries have correct level classes", () => {
    const html = makeLongReport();
    expect(html).toContain('toc-level-2');
    expect(html).toContain('toc-level-3');
  });

  it("does NOT render TOC for short reports (<20 findings)", () => {
    const html = renderReportHTML(getReport());
    expect(html).not.toContain('id="toc"');
    // toc-nav appears in CSS, so check for the actual nav element
    expect(html).not.toContain('<nav class="toc-nav">');
  });

  it("renders TOC when totalElements >= 200 even with few findings", () => {
    // 5 findings × 50 elements each = 250 total elements
    const violations = Array.from({ length: 5 }, (_, i) => ({
      id: `big-${i}`, impact: "critical" as const,
      help: `Big ${i}`, description: `Desc ${i}`,
      tags: ["wcag143"],
      nodes: Array.from({ length: 50 }, (_, j) => ({
        target: [`.el-${i}-${j}`], html: `<div>${j}</div>`,
      })),
    }));
    const html = renderReportHTML(getReport({ violations }));
    expect(html).toContain('id="toc"');
  });
});

/* ═══════════════════════════════════════════════════════════
   Evidence Table Layout Guardrails
   ═══════════════════════════════════════════════════════════ */

describe("Evidence table layout guardrails", () => {
  it("chunks evidence tables > 50 rows with labels", () => {
    const report = getReport({
      violations: [{
        id: "huge-rule", impact: "serious",
        help: "Huge rule", description: "Many elements",
        tags: ["wcag143"],
        nodes: Array.from({ length: 120 }, (_, j) => ({
          target: [`.huge-${j}`], html: `<div>${j}</div>`,
        })),
      }],
    });
    const html = renderReportHTML(report);
    // Should have chunk labels (1/3), (2/3), (3/3)
    expect(html).toContain("(1/3)");
    expect(html).toContain("(2/3)");
    expect(html).toContain("(3/3)");
    // All 120 rows still rendered
    const evRows = (html.match(/class="ev-num"/g) || []).length;
    expect(evRows).toBe(120);
  });

  it("does not chunk tables <= 50 rows", () => {
    const report = getReport({
      violations: [{
        id: "med-rule", impact: "moderate",
        help: "Med rule", description: "Some elements",
        tags: ["wcag143"],
        nodes: Array.from({ length: 50 }, (_, j) => ({
          target: [`.med-${j}`], html: `<div>${j}</div>`,
        })),
      }],
    });
    const html = renderReportHTML(report);
    expect(html).not.toContain("(1/");
    const evRows = (html.match(/class="ev-num"/g) || []).length;
    expect(evRows).toBe(50);
  });

  it("print CSS includes thead repeat and row break avoidance", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("table-header-group");
    expect(html).toContain("page-break-inside:avoid");
  });

  it("evidence table has word-wrap CSS for selectors and snippets", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("word-break:break-word");
  });

  it("chunked numbering is continuous across chunks", () => {
    const report = getReport({
      violations: [{
        id: "num-rule", impact: "critical",
        help: "Num rule", description: "Numbering test",
        tags: ["wcag143"],
        nodes: Array.from({ length: 75 }, (_, j) => ({
          target: [`.n-${j}`], html: `<div>${j}</div>`,
        })),
      }],
    });
    const html = renderReportHTML(report);
    // Row 51 should exist (in second chunk, numbered 51 not 1)
    expect(html).toContain('>51<');
    expect(html).toContain('>75<');
  });
});

/* ═══════════════════════════════════════════════════════════
   PDF/HTML Layout — Safe Margins & Table Sizing
   ═══════════════════════════════════════════════════════════ */

describe("PDF/HTML layout — safe margins & table sizing", () => {
  function getHTML(): string {
    return renderReportHTML(getReport());
  }

  it("@page rule has mm-based margins", () => {
    const html = getHTML();
    expect(html).toMatch(/@page\s*\{[^}]*margin:\s*18mm\s+16mm/);
  });

  it(".page container has generous padding", () => {
    const html = getHTML();
    expect(html).toMatch(/\.page\{[^}]*padding:\s*22mm\s+var\(--space-lg\)/);
  });

  it("evidence table uses table-layout:fixed", () => {
    const html = getHTML();
    expect(html).toContain("table-layout:fixed");
  });

  it("evidence table column widths sum correctly (5+25+25+45)", () => {
    const html = getHTML();
    expect(html).toMatch(/\.evidence-table th:first-child\{width:5%\}/);
    expect(html).toMatch(/\.evidence-table th:nth-child\(2\)\{width:25%\}/);
    expect(html).toMatch(/\.evidence-table th:nth-child\(3\)\{width:25%\}/);
    expect(html).toMatch(/\.evidence-table th:nth-child\(4\)\{width:45%\}/);
  });

  it("evidence table cells have adequate padding (token-based)", () => {
    const html = getHTML();
    expect(html).toMatch(/\.evidence-table td\{[^}]*padding:\s*var\(--space-sm\)\s+var\(--space-sm\)/);
  });

  it("print CSS prevents orphan headers", () => {
    const html = getHTML();
    expect(html).toContain("page-break-after:avoid");
  });

  it("print CSS uses matching safe margins", () => {
    const html = getHTML();
    expect(html).toMatch(/\.page\{[^}]*padding:\s*18mm\s+16mm/);
  });

  it("evidence table has max-width:100% to prevent overflow", () => {
    const html = getHTML();
    expect(html).toContain("max-width:100%");
  });

  it("stress test: long URLs and selectors render without errors", () => {
    const longUrl = "https://example.com/" + "very-long-path/".repeat(20) + "?param=" + "x".repeat(100);
    const longSelector = ".container > .wrapper > " + ".deeply-nested-element > ".repeat(15) + ".target";
    const longHtml = "<div class='" + "a".repeat(200) + "'>" + "content".repeat(50) + "</div>";
    const report = getReport({
      violations: [{
        id: "long-content", impact: "serious",
        help: "Long content test", description: "Stress test",
        tags: ["wcag143"],
        nodes: [{ target: [longSelector], html: longHtml }],
      }],
    });
    // Override pageUrl for the long URL test
    report.priorityIssues[0].affectedElementDetails[0].pageUrl = longUrl;
    const html = renderReportHTML(report);
    expect(html).toContain("evidence-table");
    expect(html).toContain("table-layout:fixed");
    // Verify content is present, not truncated
    expect(html).toContain("very-long-path");
    expect(html).toContain("deeply-nested-element");
  });
});

/* ═══════════════════════════════════════════════════════════
   Score Determinism (comprehensive)
   ═══════════════════════════════════════════════════════════ */

describe("Score determinism — comprehensive", () => {
  it("same input → same score (10 iterations)", () => {
    const scores: number[] = [];
    for (let i = 0; i < 10; i++) {
      scores.push(getReport().healthScore.value);
    }
    expect(new Set(scores).size).toBe(1);
  });

  it("increasing violations → non-increasing score", () => {
    const scores: number[] = [];
    for (let c = 0; c <= 20; c++) {
      const r = getReport({
        impactCritical: c, impactSerious: c, impactModerate: c, impactMinor: c,
        issues: c * 4,
      });
      scores.push(r.healthScore.value);
    }
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("score always within 0–100", () => {
    const testCases = [
      { impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0, issues: 0 },
      { impactCritical: 1, impactSerious: 0, impactModerate: 0, impactMinor: 0, issues: 1 },
      { impactCritical: 50, impactSerious: 50, impactModerate: 50, impactMinor: 50, issues: 200 },
      { impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 100, issues: 100 },
    ];
    for (const tc of testCases) {
      const r = getReport(tc);
      expect(r.healthScore.value).toBeGreaterThanOrEqual(0);
      expect(r.healthScore.value).toBeLessThanOrEqual(100);
    }
  });
});

/* ═══════════════════════════════════════════════════════════
   Scan Configuration
   ═══════════════════════════════════════════════════════════ */

describe("Scan Configuration", () => {
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

/* ═══════════════════════════════════════════════════════════
   Executive Summary
   ═══════════════════════════════════════════════════════════ */

describe("Executive Summary", () => {
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

  it("top priority fixes ranked by weighted impact descending", () => {
    const report = getReport();
    for (let i = 1; i < report.topPriorityFixes.length; i++) {
      expect(report.topPriorityFixes[i - 1].weightedImpact)
        .toBeGreaterThanOrEqual(report.topPriorityFixes[i].weightedImpact);
    }
  });
});

/* ═══════════════════════════════════════════════════════════
   Score Consistency — single canonical source
   ═══════════════════════════════════════════════════════════ */

describe("Score consistency — cover vs executive summary", () => {
  it("d.score === d.healthScore.value (single canonical source)", () => {
    const report = getReport();
    expect(report.score).toBe(report.healthScore.value);
  });

  it("score consistency holds across different issue counts", () => {
    const testCases = [
      { impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0, issues: 0 },
      { impactCritical: 5, impactSerious: 10, impactModerate: 15, impactMinor: 20, issues: 50 },
      { impactCritical: 50, impactSerious: 50, impactModerate: 50, impactMinor: 50, issues: 200 },
    ];
    for (const tc of testCases) {
      const r = getReport(tc);
      expect(r.score).toBe(r.healthScore.value);
    }
  });

  it("grade label in HTML cover matches exec summary grade", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    const gradeStr = `Grade ${report.healthScore.grade}`;
    // Must appear at least twice: once in cover, once in exec summary
    const matches = html.match(new RegExp(gradeStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("cover score value matches exec summary score value in HTML", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    const scoreStr = `${report.healthScore.value}/100`;
    // Must appear in both cover (csc-meta or csc-score) and exec summary
    const matches = html.match(new RegExp(scoreStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

/* ═══════════════════════════════════════════════════════════
   Cover Polish — domain prominence, info line, scorecard
   ═══════════════════════════════════════════════════════════ */

describe("Cover polish — domain, info line, scorecard", () => {
  function getHTML(): string {
    return renderReportHTML(getReport());
  }

  it("domain renders with cover-domain-value class (prominent)", () => {
    const html = getHTML();
    expect(html).toContain("cover-domain-value");
  });

  it("domain block has SCANNED DOMAIN label", () => {
    const html = getHTML();
    expect(html).toContain("Scanned Domain");
  });

  it("domain CSS uses font-size >= 20px and font-weight 600", () => {
    const html = getHTML();
    expect(html).toMatch(/\.cover-domain-value\{[^}]*font-size:\s*20px/);
    expect(html).toMatch(/\.cover-domain-value\{[^}]*font-weight:\s*600/);
  });

  it("cover info line renders with issue and page count", () => {
    const html = getHTML();
    expect(html).toContain("cover-info-line");
    expect(html).toMatch(/\d+ issues? detected across \d+ pages?/);
  });

  it("cover info line pluralizes correctly for 1 page", () => {
    const html = getHTML();
    expect(html).toContain("across 1 page");
    expect(html).not.toContain("across 1 pages");
  });

  it("scorecard has print-safe border and shadow", () => {
    const html = getHTML();
    expect(html).toMatch(/\.cover-score-card-corp\{[^}]*border:\s*1px solid/);
    expect(html).toMatch(/\.cover-score-card-corp\{[^}]*print-color-adjust:\s*exact/);
  });

  it("audit type label appears above title", () => {
    const html = getHTML();
    expect(html).toContain("cover-audit-label");
    expect(html).toContain("Automated Accessibility Audit");
  });
});

/* ═══════════════════════════════════════════════════════════
   Risk Normalization — canonical enterprise scale
   ═══════════════════════════════════════════════════════════ */

describe("Risk normalization — canonical scale", () => {
  it("risk level uses Title Case (Low/Moderate/High/Critical)", () => {
    const report = getReport();
    expect(["Low", "Moderate", "High", "Critical"]).toContain(report.riskLevel);
  });

  it("same findings always produce the same risk label", () => {
    const a = getReport();
    const b = getReport();
    expect(a.riskLevel).toBe(b.riskLevel);
  });

  it("zero issues → Low risk", () => {
    const r = getReport({
      impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0,
      issues: 0, violations: [],
    });
    expect(r.riskLevel).toBe("Low");
  });

  it("many critical issues → Critical risk", () => {
    const r = getReport({
      impactCritical: 50, impactSerious: 50, impactModerate: 50, impactMinor: 50,
      issues: 200,
    });
    expect(r.riskLevel).toBe("Critical");
  });

  it("no ALL-CAPS risk levels appear in HTML output", () => {
    const html = renderReportHTML(getReport());
    expect(html).not.toMatch(/>LOW</);
    expect(html).not.toMatch(/>MEDIUM</);
    expect(html).not.toMatch(/>HIGH</);
    // CRITICAL can appear in severity chips (e.g., "CRITICAL" for severity), so check risk-specific context
    expect(html).not.toContain("MEDIUM");
  });

  it("no 'Action Needed' wording in HTML output", () => {
    const html = renderReportHTML(getReport());
    expect(html).not.toContain("Action Needed");
  });
});

/* ═══════════════════════════════════════════════════════════
   Severity Mini-Bar — compact cover summary
   ═══════════════════════════════════════════════════════════ */

describe("Severity mini-bar on cover", () => {
  function getCorpHTML(): string {
    const report = getReport();
    report.reportStyle = "corporate";
    return renderReportHTML(report);
  }

  it("renders cover-severity-bar element on corporate cover", () => {
    const html = getCorpHTML();
    expect(html).toContain("cover-severity-bar");
  });

  it("severity counts match issue breakdown", () => {
    const report = getReport();
    report.reportStyle = "corporate";
    const html = renderReportHTML(report);
    // Extract all csb-count spans: <span class="csb-count" style="...">N</span>
    const countMatches = [...html.matchAll(/class="csb-count"[^>]*>(\d+)<\/span>/g)];
    const counts = countMatches.map(m => parseInt(m[1], 10));
    expect(counts).toContain(report.issueBreakdown.critical);
    expect(counts).toContain(report.issueBreakdown.serious);
    expect(counts).toContain(report.issueBreakdown.moderate);
    expect(counts).toContain(report.issueBreakdown.minor);
  });

  it("has CSS for severity mini-bar (flex, wrap)", () => {
    const html = getCorpHTML();
    expect(html).toMatch(/\.cover-severity-bar\{[^}]*display:\s*flex/);
    expect(html).toMatch(/\.cover-severity-bar\{[^}]*flex-wrap:\s*wrap/);
  });

  it("labels match severity names", () => {
    const html = getCorpHTML();
    expect(html).toContain("Critical</span>");
    expect(html).toContain("Serious</span>");
    expect(html).toContain("Moderate</span>");
    expect(html).toContain("Minor</span>");
  });
});

/* ═══════════════════════════════════════════════════════════
   Compliance Wording — no ambiguous "Compliance XX%"
   ═══════════════════════════════════════════════════════════ */

describe("Compliance wording — WCAG Checks Passed", () => {
  it("HTML uses 'WCAG Checks Passed' instead of bare 'Compliance'", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("WCAG Checks Passed");
  });

  it("no bare 'Compliance</td>' label in corp summary table", () => {
    const report = getReport();
    report.reportStyle = "corporate";
    const html = renderReportHTML(report);
    expect(html).not.toMatch(/>Compliance<\/td>/);
  });

  it("metrics grid uses 'WCAG Checks Passed' label", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("WCAG Checks Passed");
    expect(html).toMatch(/WCAG Checks Passed<\/div>/);
  });
});

/* ═══════════════════════════════════════════════════════════
   Enterprise Header & Footer
   ═══════════════════════════════════════════════════════════ */

describe("Enterprise header & footer", () => {
  it("HTML contains running-header with domain and scan date", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("running-header");
    expect(html).toContain("rh-left");
    expect(html).toContain("rh-right");
    expect(html).toContain(report.domain);
  });

  it("HTML contains running-footer with brand, version, and page placeholder", () => {
    const report = getReport();
    const html = renderReportHTML(report);
    expect(html).toContain("running-footer");
    expect(html).toContain("Generated by");
    expect(html).toContain("Report v1.0");
    expect(html).toContain("rf-left");
    expect(html).toContain("rf-center");
    expect(html).toContain("rf-right");
  });

  it("running header/footer hidden on screen, visible in print CSS", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.running-header,\.running-footer\{display:\s*none\}/);
    expect(html).toMatch(/\.running-header\{display:\s*flex/);
    expect(html).toMatch(/\.running-footer\{display:\s*flex/);
  });

  it("default brand name is VexNexa when no override", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("Generated by VexNexa");
  });
});

/* ═══════════════════════════════════════════════════════════
   Executive Summary Copy — consultancy tone
   ═══════════════════════════════════════════════════════════ */

describe("Executive summary copy — consultancy tone", () => {
  it("risk summary uses professional consultancy language", () => {
    const report = getReport();
    // Default fixture has moderate-to-high risk; summary should not use old phrasing
    expect(report.riskSummary).not.toContain("Urgent remediation required");
    expect(report.riskSummary).not.toContain("Low risk.");
    expect(report.riskSummary).not.toContain("High risk.");
    expect(report.riskSummary).not.toContain("Critical risk.");
    expect(report.riskSummary).not.toContain("Moderate risk.");
  });

  it("all risk levels produce professional copy", () => {
    const testCases = [
      { impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0, issues: 0, violations: [] as never[] },
      { impactCritical: 0, impactSerious: 1, impactModerate: 2, impactMinor: 1, issues: 4 },
      { impactCritical: 3, impactSerious: 5, impactModerate: 5, impactMinor: 2, issues: 15 },
      { impactCritical: 50, impactSerious: 50, impactModerate: 50, impactMinor: 50, issues: 200 },
    ];
    for (const tc of testCases) {
      const r = getReport(tc);
      expect(r.riskSummary).toBeDefined();
      expect(r.riskSummary.length).toBeGreaterThan(50);
      // Must not contain old-style "X risk." prefix
      expect(r.riskSummary).not.toMatch(/^(Low|Moderate|High|Critical) risk\./);
    }
  });
});

/* ═══════════════════════════════════════════════════════════
   White-Label Readiness — non-breaking
   ═══════════════════════════════════════════════════════════ */

describe("White-label readiness — reportBranding", () => {
  it("report renders identically when reportBranding is absent", () => {
    const a = getReport();
    const b = getReport();
    delete a.reportBranding;
    delete b.reportBranding;
    const htmlA = renderReportHTML(a);
    const htmlB = renderReportHTML(b);
    expect(htmlA).toBe(htmlB);
  });

  it("reportBranding.companyName overrides brand in footer", () => {
    const report = getReport();
    report.reportBranding = { companyName: "Acme Corp" };
    const html = renderReportHTML(report);
    expect(html).toContain("Generated by Acme Corp");
    expect(html).not.toContain("Generated by VexNexa");
  });

  it("reportBranding type exists on ReportData", () => {
    const report = getReport();
    // Should be assignable without TS error
    report.reportBranding = { companyName: "Test", logoUrl: "https://example.com/logo.png", primaryColor: "#FF0000" };
    expect(report.reportBranding.companyName).toBe("Test");
    expect(report.reportBranding.logoUrl).toBe("https://example.com/logo.png");
    expect(report.reportBranding.primaryColor).toBe("#FF0000");
  });
});

/* ═══════════════════════════════════════════════════════════
   Trend / History Hook — data prep
   ═══════════════════════════════════════════════════════════ */

describe("Trend / history hook — data prep", () => {
  it("scanTimestamp is populated from scan createdAt", () => {
    const report = getReport();
    expect(report.scanTimestamp).toBeDefined();
    expect(typeof report.scanTimestamp).toBe("string");
    // Should be a valid ISO string
    expect(new Date(report.scanTimestamp!).toISOString()).toBe(report.scanTimestamp);
  });

  it("healthScorePrevious is optional and defaults to undefined", () => {
    const report = getReport();
    expect(report.healthScorePrevious).toBeUndefined();
  });

  it("healthScorePrevious can be set without breaking rendering", () => {
    const report = getReport();
    report.healthScorePrevious = 72;
    const html = renderReportHTML(report);
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(1000);
  });
});

/* ═══════════════════════════════════════════════════════════
   Layout Sanity — no regressions
   ═══════════════════════════════════════════════════════════ */

describe("Layout sanity — no regressions", () => {
  it("scorecard still renders in corporate mode", () => {
    const report = getReport();
    report.reportStyle = "corporate";
    const html = renderReportHTML(report);
    expect(html).toContain("cover-score-card-corp");
    expect(html).toContain("csc-score");
    expect(html).toContain("csc-bar-track");
  });

  it("scorecard still renders in premium mode", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("cover-score-card");
    expect(html).toContain("csc-label");
  });

  it("severity mini-bar CSS uses tabular-nums for alignment", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.csb-count\{[^}]*font-variant-numeric:\s*tabular-nums/);
  });

  it("severity mini-bar separators use lighter color", () => {
    const report = getReport();
    report.reportStyle = "corporate";
    const html = renderReportHTML(report);
    expect(html).toMatch(/\.csb-sep\{[^}]*color:\s*#E5E7EB/);
  });

  it("exec card spacing uses design tokens", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.exec-cards\{[^}]*gap:\s*var\(--space-md\)/);
    expect(html).toMatch(/\.exec-card\{[^}]*padding:\s*var\(--space-md\)\s+var\(--space-lg\)/);
  });
});

/* ═══════════════════════════════════════════════════════════
   Enterprise UX Polish — spacing tokens & hardening
   ═══════════════════════════════════════════════════════════ */

describe("Spacing token system", () => {
  it("defines all spacing custom properties in :root", () => {
    const html = renderReportHTML(getReport());
    expect(html).toContain("--space-xs:4px");
    expect(html).toContain("--space-sm:8px");
    expect(html).toContain("--space-md:16px");
    expect(html).toContain("--space-lg:24px");
    expect(html).toContain("--space-xl:32px");
    expect(html).toContain("--space-2xl:48px");
  });

  it("defines monospace font stack as --mono custom property", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/--mono:\s*ui-monospace/);
    expect(html).toContain("Consolas");
  });

  it("section titles use spacing tokens for margin and padding", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.section-title\{[^}]*margin-bottom:\s*var\(--space-lg\)/);
    expect(html).toMatch(/\.section-title\{[^}]*padding-bottom:\s*var\(--space-sm\)/);
  });
});

describe("Evidence table hardening", () => {
  it("evidence table uses table-layout:fixed and full width", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.evidence-table\{[^}]*table-layout:\s*fixed/);
    expect(html).toMatch(/\.evidence-table\{[^}]*width:\s*100%/);
  });

  it("ev-mono uses monospace font stack via var(--mono)", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.ev-mono\{[^}]*font-family:\s*var\(--mono\)/);
  });

  it("ev-url uses monospace font and break-all for long URLs", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.ev-url\{[^}]*font-family:\s*var\(--mono\)/);
    expect(html).toMatch(/\.ev-url\{[^}]*word-break:\s*break-all/);
  });

  it("evidence table cells have min-height for readability", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.evidence-table td\{[^}]*min-height:\s*32px/);
  });
});

describe("iPad and narrow viewport protection", () => {
  it("includes iPad-specific media query (768-1024px)", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/min-width:\s*768px.*max-width:\s*1024px/);
  });

  it("mobile breakpoint stacks exec-health-row vertically", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.exec-health-row\{[^}]*flex-direction:\s*column/);
  });
});

describe("Print & PDF hardening", () => {
  it("print media prevents widows and orphans in paragraphs", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/p\{orphans:\s*3;widows:\s*3\}/);
  });

  it("print media prevents page breaks inside cards and breakdown", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.breakdown-card.*page-break-inside:\s*avoid/);
  });

  it("print media repeats table headers for multi-page tables", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.tpf-table thead.*display:\s*table-header-group/);
    expect(html).toMatch(/\.wcag-matrix-table thead.*display:\s*table-header-group/);
  });

  it("h3 elements prevent orphan headers in print", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/h3\{page-break-after:\s*avoid\}/);
  });
});

describe("Executive summary hero polish", () => {
  it("health score badge has larger font size (48px)", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.ehb-score\{[^}]*font-size:\s*48px/);
  });

  it("health score badge uses token-based padding", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.exec-health-badge\{[^}]*padding:\s*var\(--space-md\)\s+var\(--space-lg\)/);
  });

  it("metric values use tabular-nums for alignment", () => {
    const html = renderReportHTML(getReport());
    expect(html).toMatch(/\.metric-value\{[^}]*font-variant-numeric:\s*tabular-nums/);
  });
});

/* ═══════════════════════════════════════════════════════════
   DOCX WCAG Matrix — Alignment & Layout Regression
   ═══════════════════════════════════════════════════════════ */

describe("DOCX WCAG Matrix — alignment and layout", () => {
  const docxRoute = readFileSync(
    join(process.cwd(), "src/app/api/reports/[scanId]/docx/route.ts"),
    "utf-8"
  );

  it("imports VerticalAlign from docx", () => {
    expect(docxRoute).toContain("VerticalAlign,");
    expect(docxRoute).toContain('} from "docx"');
  });

  it("uses a dedicated wcagMatrixRow function (not generic tableRow)", () => {
    expect(docxRoute).toContain("function wcagMatrixRow(");
    // The WCAG table should call wcagMatrixRow, not tableRow
    expect(docxRoute).toContain('wcagMatrixRow(["Success Criterion"');
  });

  it("sets Success Criterion column (index 0) to AlignmentType.LEFT", () => {
    expect(docxRoute).toContain("WCAG_COL_ALIGNS = [AlignmentType.LEFT,");
  });

  it("does NOT use CENTER alignment for Success Criterion data cells", () => {
    // The WCAG_COL_ALIGNS array must start with LEFT
    const alignLine = docxRoute.split("\n").find((l: string) => l.includes("WCAG_COL_ALIGNS"));
    expect(alignLine).toBeDefined();
    expect(alignLine).toMatch(/AlignmentType\.LEFT/);
    // First element must be LEFT
    const match = alignLine!.match(/\[([^\]]+)\]/);
    expect(match).toBeDefined();
    const firstAlign = match![1].split(",")[0].trim();
    expect(firstAlign).toBe("AlignmentType.LEFT");
  });

  it("sets verticalAlign to VerticalAlign.TOP for all WCAG cells", () => {
    // Inside wcagMatrixRow function
    const fnBody = docxRoute.slice(
      docxRoute.indexOf("function wcagMatrixRow("),
      docxRoute.indexOf("function tableRow(")
    );
    expect(fnBody).toContain("verticalAlign: VerticalAlign.TOP");
  });

  it("uses TableLayoutType.FIXED for the WCAG table", () => {
    // The wcagTable construction should use FIXED layout
    const tableSection = docxRoute.slice(
      docxRoute.indexOf("const wcagTable = new Table"),
      docxRoute.indexOf("children.push(wcagTable")
    );
    expect(tableSection).toContain("layout: TableLayoutType.FIXED");
  });

  it("uses DXA width type for WCAG table (not PERCENTAGE)", () => {
    const tableSection = docxRoute.slice(
      docxRoute.indexOf("const wcagTable = new Table"),
      docxRoute.indexOf("children.push(wcagTable")
    );
    expect(tableSection).toContain("type: WidthType.DXA");
    expect(tableSection).not.toContain("WidthType.PERCENTAGE");
  });

  it("defines WCAG column widths summing to DOCX_TABLE_WIDTH", () => {
    expect(docxRoute).toContain("WCAG_COL_CRITERION");
    expect(docxRoute).toContain("WCAG_COL_LEVEL");
    expect(docxRoute).toContain("WCAG_COL_STATUS");
    expect(docxRoute).toContain("WCAG_COL_FINDINGS");
    // Criterion column should be ~37% (largest)
    expect(docxRoute).toContain("DOCX_TABLE_WIDTH * 0.37");
  });

  it("applies DOCX_CELL_MARGINS to WCAG cells", () => {
    const fnBody = docxRoute.slice(
      docxRoute.indexOf("function wcagMatrixRow("),
      docxRoute.indexOf("function tableRow(")
    );
    expect(fnBody).toContain("margins: DOCX_CELL_MARGINS");
  });

  it("sets paragraph spacing (before: 0, after: 0, line: 240) in WCAG cells", () => {
    const fnBody = docxRoute.slice(
      docxRoute.indexOf("function wcagMatrixRow("),
      docxRoute.indexOf("function tableRow(")
    );
    expect(fnBody).toContain("spacing: { before: 0, after: 0, line: 240 }");
  });

  it("DOCX_CELL_MARGINS has correct values (top/bottom: 60, left/right: 80)", () => {
    expect(docxRoute).toContain("top: 60, bottom: 60, left: 80, right: 80");
  });
});
