import type { ReportData, ReportIssue, Severity, ReportStyle, WcagMatrixRow, TopPriorityFix } from "./types";

/* ═══════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════ */

export function renderReportHTML(data: ReportData): string {
  const t = data.themeConfig;
  const wl = data.whiteLabelConfig;
  const primary = wl.primaryColor || t.primaryColor;
  const s: ReportStyle = data.reportStyle === "corporate" ? "corporate" : "premium";

  return `<!DOCTYPE html>
<html lang="en" data-style="${s}" data-report-version="v2">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accessibility Compliance Report — ${esc(data.domain)}</title>
${data.faviconUrl ? `<link rel="icon" href="${esc(data.faviconUrl)}" />` : ""}
<style>${buildCSS(primary, t.secondaryColor, t.accentColor, t.backgroundColor, t.darkColor, s)}</style>
</head>
<body class="style-${s}">
${renderCover(data, primary, s)}
${renderExecutiveSummary(data, primary, s)}
${renderVisualBreakdown(data, primary, s)}
${renderWcagMatrix(data, primary, s)}
${renderPriorityIssues(data, primary, s)}
${renderScanConfiguration(data, primary, s)}
${renderComplianceLegal(data, primary, s)}
${renderCTA(data, primary, s)}
<div class="version-marker" data-report-version="v2">Report v2 | ${s} | ${esc(data.scanId)}</div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════ */

function esc(s: string | undefined | null): string {
  const v = s ?? "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}
function sevClr(sv: Severity): string {
  return ({ critical: "#DC2626", serious: "#F97316", moderate: "#FACC15", minor: "#9CA3AF" })[sv];
}
function sevBg(sv: Severity): string {
  return ({ critical: "#FEF2F2", serious: "#FFF7ED", moderate: "#FFFBEB", minor: "#EFF6FF" })[sv];
}
function riskClr(r: string): string {
  return ({ LOW: "#16A34A", MEDIUM: "#D97706", HIGH: "#EA580C", CRITICAL: "#DC2626" })[r] ?? "#6B7280";
}
function grade(s: number): string {
  if (s >= 90) return "A"; if (s >= 80) return "B"; if (s >= 70) return "C"; if (s >= 50) return "D"; return "F";
}
function ratingLabel(s: number): string {
  if (s >= 90) return "Excellent"; if (s >= 80) return "Good"; if (s >= 70) return "Fair"; if (s >= 50) return "Needs Work"; return "Poor";
}
function corp(s: ReportStyle): boolean { return s === "corporate"; }

function sevChip(sv: Severity): string {
  return `<span class="sev-chip sev-${sv}" style="background:${sevBg(sv)};color:${sevClr(sv)}">${sv.toUpperCase()}</span>`;
}
function riskBar(level: string, primary: string): string {
  const pct: Record<string, number> = { LOW: 25, MEDIUM: 50, HIGH: 75, CRITICAL: 100 };
  const w = pct[level] ?? 50;
  return `<div class="risk-bar-track"><div class="risk-bar-fill" style="width:${w}%;background:${riskClr(level)}"></div></div>`;
}

function pageSection(title: string, primary: string, s: ReportStyle, body: string): string {
  const cls = corp(s) ? "section-title corp-title" : "section-title";
  return `<section class="page">
  <h2 class="${cls}" style="border-color:${primary}">${title}</h2>
  ${body}
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   SVG Charts
   ═══════════════════════════════════════════════════════════ */

function scoreRingSVG(score: number, primary: string): string {
  const r = 80; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const gc = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${gc}"/></linearGradient></defs>
  <circle cx="100" cy="100" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="14"/>
  <circle cx="100" cy="100" r="${r}" fill="none" stroke="url(#sg)" stroke-width="14"
    stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 100 100)"/>
  <text x="100" y="90" text-anchor="middle" font-size="48" font-weight="900" fill="${gc}">${score}</text>
  <text x="100" y="112" text-anchor="middle" font-size="13" fill="#6B7280" font-weight="500">out of 100</text>
  <text x="100" y="136" text-anchor="middle" font-size="16" font-weight="800" fill="${gc}">Grade ${grade(score)}</text>
</svg>`;
}

function donutChart(bk: { critical: number; serious: number; moderate: number; minor: number }, s: ReportStyle): string {
  const total = bk.critical + bk.serious + bk.moderate + bk.minor || 1;
  const segs: { v: number; c: string; l: string }[] = [
    { v: bk.critical, c: "#DC2626", l: "Critical" },
    { v: bk.serious, c: "#F97316", l: "Serious" },
    { v: bk.moderate, c: "#FACC15", l: "Moderate" },
    { v: bk.minor, c: "#9CA3AF", l: "Minor" },
  ];
  const isC = corp(s);
  const r = 70; const circ = 2 * Math.PI * r; const sw = isC ? 18 : 28;
  let cum = 0; let arcs = "";
  for (const seg of segs) {
    if (seg.v === 0) continue;
    const dl = (seg.v / total) * circ;
    arcs += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${seg.c}" stroke-width="${sw}"
      stroke-dasharray="${dl} ${circ - dl}" stroke-dashoffset="${-cum}" transform="rotate(-90 100 100)"/>`;
    cum += dl;
  }
  let legend = "";
  for (const seg of segs) {
    const pct = total > 0 ? Math.round((seg.v / total) * 100) : 0;
    legend += `<div class="legend-row">
      <span class="legend-chip" style="background:${seg.c}"></span>
      <span class="legend-label">${seg.l}</span>
      <span class="legend-val">${seg.v} (${pct}%)</span>
    </div>`;
  }
  return `<div class="donut-wrap">
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    ${arcs}
    <circle cx="100" cy="100" r="${r - sw / 2 - 4}" fill="white"/>
    <text x="100" y="96" text-anchor="middle" font-size="28" font-weight="800" fill="#1E1E1E">${total}</text>
    <text x="100" y="114" text-anchor="middle" font-size="11" fill="#6B7280">Total Issues</text>
  </svg>
  <div class="legend-col">${legend}</div>
</div>`;
}

function progressBar(label: string, pct: number, color: string, s: ReportStyle): string {
  const h = corp(s) ? 8 : 14;
  const rx = corp(s) ? 2 : 7;
  return `<div class="pbar-row">
  <span class="pbar-label">${esc(label)}</span>
  <div class="pbar-track" style="height:${h}px;border-radius:${rx}px">
    <div class="pbar-fill" style="width:${Math.min(100, pct)}%;height:${h}px;border-radius:${rx}px;background:${color}"></div>
  </div>
  <span class="pbar-val" style="color:${color}">${pct}%</span>
</div>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 1 — Cover (structured grid: header / main / footer)
   ═══════════════════════════════════════════════════════════ */

function renderBrandBlock(d: ReportData, primary: string, isDark: boolean): string {
  const hasLogo = !!d.whiteLabelConfig.logoUrl;
  const hasName = !!d.companyName;
  const nameColor = isDark ? "white" : primary;
  const domainColor = isDark ? "rgba(255,255,255,.5)" : "#6B7280";

  const logoEl = hasLogo
    ? `<img src="${esc(d.whiteLabelConfig.logoUrl)}" alt="${esc(d.companyName)}" class="brand-logo"/>`
    : (hasName ? `<div class="brand-monogram" style="background:${primary}">${esc(d.companyName).charAt(0).toUpperCase()}</div>` : "");

  const nameEl = hasName
    ? `<h3 class="brand-name" style="color:${nameColor}">${esc(d.companyName)}</h3>` : "";

  return `<div class="brand-block">
    ${logoEl}
    <div class="brand-text">
      ${nameEl}
      <span class="brand-domain" style="color:${domainColor}">${esc(d.domain)}</span>
    </div>
  </div>`;
}

function renderCover(d: ReportData, primary: string, s: ReportStyle): string {
  const gc = d.score >= 80 ? "#16A34A" : d.score >= 60 ? "#D97706" : "#DC2626";
  const isDark = !corp(s);

  if (corp(s)) {
    return `<section class="page cover-page cover-corp">
  <header class="report-header">
    ${renderBrandBlock(d, primary, false)}
    <div class="header-meta">
      <span class="header-date">${fmtDate(d.scanDate)}</span>
      <span class="header-style-tag" style="border-color:${primary};color:${primary}">Compliance Report</span>
    </div>
  </header>
  <div class="header-divider" style="background:${primary}"></div>
  <div class="cover-main">
    <div class="cover-main-left">
      <h1 class="cover-title-corp">Accessibility<br/>Compliance Report</h1>
      <div class="cover-meta-row">
        <span class="cover-meta-item"><span class="cover-meta-label">Standard</span><span style="color:#16A34A;font-weight:700">${esc(d.complianceLevel)}</span></span>
        <span class="cover-meta-item"><span class="cover-meta-label">Risk</span><span style="color:${riskClr(d.riskLevel)};font-weight:700">${d.riskLevel}</span></span>
        <span class="cover-meta-item"><span class="cover-meta-label">EAA 2025</span><span style="color:${d.eaaReady ? "#16A34A" : "#D97706"};font-weight:700">${d.eaaReady ? "Ready" : "Action Needed"}</span></span>
      </div>
    </div>
    <div class="cover-main-right">
      <div class="cover-score-card-corp">
        <div class="csc-score" style="color:${gc}">${d.score}</div>
        <div class="csc-of">/100</div>
        <div class="csc-grade">Grade ${grade(d.score)} &mdash; ${ratingLabel(d.score)}</div>
        <div class="csc-bar-track"><div class="csc-bar-fill" style="width:${Math.min(100, d.score)}%;background:${gc}"></div></div>
        <div class="csc-meta">
          <span>${d.issueBreakdown.total} issues</span>
          <span>Fix: ${esc(d.estimatedFixTime)}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="cover-footer">
    <span class="cover-scanid">Scan ${esc(d.scanId).slice(0, 8)}</span>
    ${d.whiteLabelConfig.footerText ? `<span class="cover-footer-text">${esc(d.whiteLabelConfig.footerText)}</span>` : ""}
  </div>
</section>`;
  }

  // Premium: dark hero cover with structured layout
  return `<section class="page cover-page cover-premium">
  <header class="report-header report-header-dark">
    ${renderBrandBlock(d, primary, true)}
    <div class="header-meta">
      <span class="header-date" style="color:rgba(255,255,255,.5)">${fmtDate(d.scanDate)}</span>
    </div>
  </header>
  <div class="header-divider" style="background:${primary}"></div>
  <div class="cover-main">
    <div class="cover-main-left">
      <h1 class="cover-title-prem">Accessibility<br/>Compliance Report</h1>
      <div class="cover-badges">
        ${sevChip(d.riskLevel === "LOW" ? "minor" : d.riskLevel === "MEDIUM" ? "moderate" : d.riskLevel === "HIGH" ? "serious" : "critical")}
        <span class="sev-chip" style="background:rgba(22,163,74,.15);color:#4ADE80;border:1px solid rgba(22,163,74,.3)">${esc(d.complianceLevel)}</span>
        <span class="sev-chip" style="background:${d.eaaReady ? "rgba(22,163,74,.15)" : "rgba(217,119,6,.15)"};color:${d.eaaReady ? "#4ADE80" : "#FCD34D"};border:1px solid ${d.eaaReady ? "rgba(22,163,74,.3)" : "rgba(217,119,6,.3)"}">EAA 2025 ${d.eaaReady ? "Ready" : "Needs Work"}</span>
      </div>
      <div class="cover-kpi-strip">
        <div class="cover-kpi"><span class="cover-kpi-val" style="color:#FCA5A5">${d.issueBreakdown.critical}</span><span class="cover-kpi-lbl">Critical</span></div>
        <div class="cover-kpi"><span class="cover-kpi-val" style="color:#FDBA74">${d.issueBreakdown.serious}</span><span class="cover-kpi-lbl">Serious</span></div>
        <div class="cover-kpi"><span class="cover-kpi-val" style="color:#FCD34D">${d.issueBreakdown.moderate}</span><span class="cover-kpi-lbl">Moderate</span></div>
        <div class="cover-kpi"><span class="cover-kpi-val" style="color:#93C5FD">${d.issueBreakdown.minor}</span><span class="cover-kpi-lbl">Minor</span></div>
      </div>
    </div>
    <div class="cover-main-right">
      <div class="cover-score-card">
        ${scoreRingSVG(d.score, primary)}
        <div class="csc-label">${ratingLabel(d.score)}</div>
        <div class="csc-risk">Risk: <strong style="color:${riskClr(d.riskLevel)}">${d.riskLevel}</strong></div>
        <div class="csc-fix">Est. fix: <strong>${esc(d.estimatedFixTime)}</strong></div>
      </div>
    </div>
  </div>
  <div class="cover-footer cover-footer-dark">
    <span class="cover-scanid" style="color:rgba(255,255,255,.25)">Scan ${esc(d.scanId).slice(0, 8)}</span>
    ${d.whiteLabelConfig.footerText ? `<span class="cover-footer-text" style="color:rgba(255,255,255,.3)">${esc(d.whiteLabelConfig.footerText)}</span>` : ""}
  </div>
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 2 — Executive Summary (always shown)
   ═══════════════════════════════════════════════════════════ */

function renderTopPriorityFixes(fixes: TopPriorityFix[], s: ReportStyle): string {
  if (fixes.length === 0) return "";
  return `<div class="tpf-section">
    <h3 class="subsection-title">Top Priority Fixes</h3>
    <table class="tpf-table">
      <thead><tr><th>#</th><th>Issue</th><th>Severity</th><th>Elements</th><th>Impact Score</th></tr></thead>
      <tbody>
        ${fixes.map((f) => `<tr>
          <td class="tpf-rank">${f.rank}</td>
          <td class="tpf-title">${esc(f.title)}</td>
          <td>${sevChip(f.severity)}</td>
          <td class="tpf-num">${f.affectedElements}</td>
          <td class="tpf-num"><strong>${f.weightedImpact}</strong></td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function renderExecutiveSummary(d: ReportData, primary: string, s: ReportStyle): string {
  const hs = d.healthScore;
  const hsColor = hs.value >= 80 ? "#16A34A" : hs.value >= 60 ? "#D97706" : "#DC2626";
  const metrics: { label: string; value: string | number; color: string }[] = [
    { label: "Health Score", value: `${hs.value}/100`, color: hsColor },
    { label: "Total Issues", value: d.issueBreakdown.total, color: "#6B7280" },
    { label: "Critical", value: d.issueBreakdown.critical, color: "#DC2626" },
    { label: "Serious", value: d.issueBreakdown.serious, color: "#EA580C" },
    { label: "Moderate", value: d.issueBreakdown.moderate, color: "#D97706" },
    { label: "Minor", value: d.issueBreakdown.minor, color: "#2563EB" },
    { label: "Compliance", value: `${d.compliancePercentage}%`, color: "#16A34A" },
    { label: "Est. Fix Time", value: d.estimatedFixTime, color: "#7C3AED" },
  ];

  const coverageNote = `<div class="coverage-note"><strong>Note:</strong> Automated testing does not cover all WCAG requirements. Manual review is recommended.</div>`;

  if (corp(s)) {
    return pageSection("Executive Summary", primary, s, `
    <div class="exec-health-badge" style="border-color:${hsColor}">
      <div class="ehb-score" style="color:${hsColor}">${hs.value}</div>
      <div class="ehb-meta"><span class="ehb-grade">Grade ${hs.grade}</span><span class="ehb-label">${hs.label}</span></div>
    </div>
    <table class="corp-summary-table">
      <tr><td class="cst-label">Domain</td><td>${esc(d.domain)}</td><td class="cst-label">Health Score</td><td><strong style="color:${hsColor}">${hs.value}/100</strong> (Grade ${hs.grade})</td></tr>
      <tr><td class="cst-label">Risk Level</td><td style="color:${riskClr(d.riskLevel)};font-weight:600">${d.riskLevel}</td><td class="cst-label">Compliance</td><td>${d.compliancePercentage}%</td></tr>
      <tr><td class="cst-label">Total Issues</td><td>${d.issueBreakdown.total}</td><td class="cst-label">Est. Fix Time</td><td>${esc(d.estimatedFixTime)}</td></tr>
      <tr><td class="cst-label">Critical</td><td style="color:#DC2626">${d.issueBreakdown.critical}</td><td class="cst-label">Serious</td><td style="color:#EA580C">${d.issueBreakdown.serious}</td></tr>
    </table>
    <div class="corp-prose">
      <h3>Assessment</h3>
      <p>${esc(d.legalRisk)}</p>
      <p>Estimated remediation effort: <strong>${esc(d.estimatedFixTime)}</strong>.</p>
    </div>
    ${renderTopPriorityFixes(d.topPriorityFixes, s)}
    ${coverageNote}`);
  }

  // Premium
  return pageSection("Executive Summary", primary, s, `
  <div class="exec-health-row">
    <div class="exec-health-badge" style="border-color:${hsColor}">
      <div class="ehb-score" style="color:${hsColor}">${hs.value}</div>
      <div class="ehb-meta"><span class="ehb-grade">Grade ${hs.grade}</span><span class="ehb-label">${hs.label}</span></div>
    </div>
    <div class="exec-health-detail">
      <p>Weighted penalty: <strong>${hs.weightedPenalty}</strong> points deducted from 100.</p>
      <p class="exec-health-formula">Formula: 100 &minus; (Critical&times;10 + Serious&times;6 + Moderate&times;3 + Minor&times;1)</p>
    </div>
  </div>
  <div class="exec-cards">
    <div class="exec-card">
      <h3>Accessibility Status</h3>
      <p>Your website <strong>${esc(d.domain)}</strong> achieved a health score of
      <strong style="color:${hsColor}">${hs.value}/100</strong> (Grade ${hs.grade}).
      ${d.issueBreakdown.critical > 0
        ? `There are <strong style="color:#DC2626">${d.issueBreakdown.critical} critical issues</strong> requiring immediate attention.`
        : "No critical issues were detected."}</p>
    </div>
    <div class="exec-card">
      <h3>Legal Risk Assessment</h3>
      <div class="exec-risk-row">
        <span class="exec-risk-label" style="color:${riskClr(d.riskLevel)}">${d.riskLevel} Risk</span>
        ${riskBar(d.riskLevel, primary)}
      </div>
      <p>${esc(d.legalRisk)}</p>
    </div>
    <div class="exec-card">
      <h3>Remediation Estimate</h3>
      <p>Based on <strong>${d.issueBreakdown.total} issues</strong>, estimated developer effort is
      <strong style="color:#7C3AED">${esc(d.estimatedFixTime)}</strong>.</p>
    </div>
  </div>
  ${renderTopPriorityFixes(d.topPriorityFixes, s)}
  <h3 class="subsection-title">Key Metrics</h3>
  <div class="metrics-grid">
    ${metrics.map((m) => `<div class="metric-card"><div class="metric-value" style="color:${m.color}">${m.value}</div><div class="metric-label">${m.label}</div></div>`).join("")}
  </div>
  ${coverageNote}`);
}

/* ═══════════════════════════════════════════════════════════
   Page 3 — Visual Breakdown
   ═══════════════════════════════════════════════════════════ */

function renderVisualBreakdown(d: ReportData, primary: string, s: ReportStyle): string {
  const aaClr = d.wcagAAStatus === "pass" ? "#16A34A" : d.wcagAAStatus === "partial" ? "#D97706" : "#DC2626";
  const aaaClr = d.wcagAAAStatus === "pass" ? "#16A34A" : d.wcagAAAStatus === "partial" ? "#D97706" : "#DC2626";
  const matLevels = ["Basic", "Structured", "Proactive", "Continuous"] as const;
  const curIdx = matLevels.indexOf(d.maturityLevel);

  return pageSection("Visual Breakdown", primary, s, `
  <div class="breakdown-grid">
    <div class="breakdown-card">
      <h3>Severity Distribution</h3>
      <div class="chart-center">${donutChart(d.issueBreakdown, s)}</div>
    </div>
    <div class="breakdown-card">
      <h3>Compliance Progress</h3>
      <div class="progress-stack">
        ${progressBar("WCAG AA", d.compliancePercentage, aaClr, s)}
        ${progressBar("WCAG AAA", Math.round(d.compliancePercentage * 0.7), aaaClr, s)}
        ${progressBar("Score", d.score, primary, s)}
      </div>
    </div>
  </div>
  <div class="breakdown-grid mt-24">
    <div class="breakdown-card">
      <h3>WCAG Level Status</h3>
      <table class="status-table">
        <tr><td>WCAG 2.1 Level AA</td><td><span class="status-dot" style="background:${aaClr}"></span>${d.wcagAAStatus === "pass" ? "Compliant" : d.wcagAAStatus === "partial" ? "Partial" : "Non-compliant"}</td></tr>
        <tr><td>WCAG 2.1 Level AAA</td><td><span class="status-dot" style="background:${aaaClr}"></span>${d.wcagAAAStatus === "pass" ? "Compliant" : d.wcagAAAStatus === "partial" ? "Partial" : "Non-compliant"}</td></tr>
        <tr><td>EAA 2025 Readiness</td><td><span class="status-dot" style="background:${d.eaaReady ? "#16A34A" : "#D97706"}"></span>${d.eaaReady ? "Ready" : "Action Needed"}</td></tr>
      </table>
    </div>
    <div class="breakdown-card">
      <h3>Accessibility Maturity</h3>
      <div class="maturity-indicator">
        ${matLevels.map((lv, i) => {
          const reached = i <= curIdx;
          const ac = corp(s) ? "#374151" : primary;
          return `<div class="maturity-step ${lv === d.maturityLevel ? "active" : ""}" style="${reached ? `border-color:${ac}` : ""}">
            <div class="maturity-dot" style="background:${reached ? ac : "#D1D5DB"}"></div>
            <span style="${reached ? `color:${ac};font-weight:600` : ""}">${lv}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>`);
}

/* ═══════════════════════════════════════════════════════════
   Page — WCAG Compliance Matrix (Task 2)
   ═══════════════════════════════════════════════════════════ */

function wcagStatusChip(status: WcagMatrixRow["status"]): string {
  const colors: Record<string, { bg: string; fg: string }> = {
    Pass: { bg: "#DCFCE7", fg: "#16A34A" },
    Fail: { bg: "#FEF2F2", fg: "#DC2626" },
    "Needs Review": { bg: "#FFF7ED", fg: "#EA580C" },
    "Not Tested": { bg: "#F3F4F6", fg: "#6B7280" },
  };
  const c = colors[status] ?? colors["Not Tested"];
  return `<span class="wcag-status-chip" style="background:${c.bg};color:${c.fg}">${status}</span>`;
}

function renderWcagMatrix(d: ReportData, primary: string, s: ReportStyle): string {
  const matrix = d.wcagMatrix ?? [];
  if (matrix.length === 0) return "";

  // Show failing criteria first, then a summary of passing
  const failing = matrix.filter((r) => r.status === "Fail");
  const passing = matrix.filter((r) => r.status === "Pass");
  const notTested = matrix.filter((r) => r.status === "Not Tested");

  const perPage = 18;
  const allRows = [...failing, ...passing.slice(0, 10), ...notTested.slice(0, 5)];
  const pages: WcagMatrixRow[][] = [];
  for (let i = 0; i < allRows.length; i += perPage) {
    pages.push(allRows.slice(i, i + perPage));
  }

  return pages.map((pg, pi) => `
<section class="page">
  <h2 class="${corp(s) ? "section-title corp-title" : "section-title"}" style="border-color:${primary}">${pi === 0 ? "WCAG 2.2 Compliance Matrix" : "WCAG 2.2 Compliance Matrix (continued)"}</h2>
  ${pi === 0 ? `<p class="matrix-summary">Tested against <strong>${matrix.length}</strong> WCAG 2.2 success criteria.
    <strong style="color:#16A34A">${passing.length} Pass</strong> &middot;
    <strong style="color:#DC2626">${failing.length} Fail</strong> &middot;
    <span style="color:#6B7280">${notTested.length} Not Tested</span></p>` : ""}
  <table class="wcag-matrix-table">
    <thead>
      <tr><th>Success Criterion</th><th>Level</th><th>Status</th><th>Findings</th></tr>
    </thead>
    <tbody>
      ${pg.map((row) => `<tr class="wcag-row-${row.status.toLowerCase().replace(/\s/g, "-")}">
        <td class="wcag-criterion">${esc(row.criterion)}</td>
        <td class="wcag-level"><span class="wcag-level-badge">${row.level}</span></td>
        <td>${wcagStatusChip(row.status)}</td>
        <td class="wcag-count">${row.relatedFindings > 0 ? `<strong style="color:#DC2626">${row.relatedFindings}</strong>` : "&mdash;"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</section>`).join("");
}

/* ═══════════════════════════════════════════════════════════
   Page — Scan Configuration (Task 3)
   ═══════════════════════════════════════════════════════════ */

function renderScanConfiguration(d: ReportData, primary: string, s: ReportStyle): string {
  const sc = d.scanConfig;
  if (!sc) return "";

  return pageSection("Scan Configuration", primary, s, `
  <table class="scan-config-table">
    <tr><td class="sct-label">Domain Scanned</td><td>${esc(sc.domain)}</td></tr>
    <tr><td class="sct-label">Pages Analyzed</td><td>${sc.pagesAnalyzed}</td></tr>
    <tr><td class="sct-label">Crawl Depth</td><td>${esc(sc.crawlDepth)}</td></tr>
    <tr><td class="sct-label">Scan Date/Time</td><td>${fmtDate(sc.scanDateTime)}</td></tr>
    <tr><td class="sct-label">User Agent</td><td><code>${esc(sc.userAgent)}</code></td></tr>
    <tr><td class="sct-label">Viewport</td><td>${esc(sc.viewport)}</td></tr>
    <tr><td class="sct-label">Standards Tested</td><td>${sc.standardsTested.map((st) => `<span class="ac-chip ac-chip-wcag">${esc(st)}</span>`).join(" ")}</td></tr>
    <tr><td class="sct-label">Engine</td><td>${esc(sc.engineName)} v${esc(sc.engineVersion)}</td></tr>
  </table>`);
}

/* ═══════════════════════════════════════════════════════════
   Page 4+ — Priority Issues (Consultancy Cards / Table)
   ═══════════════════════════════════════════════════════════ */

function renderPriorityIssues(d: ReportData, primary: string, s: ReportStyle): string {
  if (d.priorityIssues.length === 0) {
    return pageSection("Audit Findings", primary, s,
      `<div class="empty-state"><p>No accessibility issues were detected during this scan.</p></div>`);
  }

  if (corp(s)) {
    return renderIssuesTable(d, primary);
  }

  // Premium: consultancy-style cards, max 3 per page
  const pages: ReportIssue[][] = [];
  for (let i = 0; i < d.priorityIssues.length; i += 3) {
    pages.push(d.priorityIssues.slice(i, i + 3));
  }
  return pages.map((pg, pi) => `
<section class="page">
  <h2 class="section-title" style="border-color:${primary}">${pi === 0 ? "Audit Findings" : "Audit Findings (continued)"}</h2>
  <div class="issues-list">${pg.map((iss, i) => renderAuditCard(iss, pi * 3 + i + 1, primary)).join("")}</div>
</section>`).join("");
}

function renderAuditCard(iss: ReportIssue, num: number, primary: string): string {
  return `<div class="audit-card">
  <div class="ac-header">
    <span class="ac-num">${num}</span>
    ${sevChip(iss.severity)}
    <h4 class="ac-title">${esc(iss.title)}</h4>
  </div>
  <div class="ac-body">
    <div class="ac-grid">
      <div class="ac-section">
        <div class="ac-label">Impact</div>
        <p>${esc(iss.impact)}</p>
      </div>
      <div class="ac-section">
        <div class="ac-label">Recommendation</div>
        <p>${esc(iss.recommendation)}</p>
      </div>
    </div>
    <div class="ac-grid">
      <div class="ac-section">
        <div class="ac-label">Effort</div>
        <p>${esc(iss.estimatedFixTime)} &middot; ${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""} affected</p>
      </div>
      <div class="ac-section">
        <div class="ac-label">User Impact</div>
        <p>${esc(iss.explanation)}</p>
      </div>
    </div>
    ${(iss.affectedElementDetails ?? []).length > 0 ? `<div class="ac-section" style="margin-top:8px">
      <div class="ac-label">Affected Elements</div>
      <table class="evidence-table">
        <thead><tr><th>#</th><th>Selector</th><th>HTML Snippet</th></tr></thead>
        <tbody>
          ${(iss.affectedElementDetails ?? []).map((el, idx) => `<tr>
            <td class="ev-num">${idx + 1}</td>
            <td class="ev-mono">${esc(el.selector)}</td>
            <td class="ev-mono">${el.html ? esc(el.html) : "&mdash;"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>` : ""}
    <div class="ac-footer">
      ${iss.wcagCriteria.map(c => `<span class="ac-chip ac-chip-wcag">${c}</span>`).join("")}
      <span class="ac-chip">${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""}</span>
      <span class="ac-chip">Est. ${esc(iss.estimatedFixTime)}</span>
    </div>
    <div class="ac-tech-row"><span class="ac-tech-label">Rule:</span> <code>${esc(iss.id)}</code></div>
  </div>
</div>`;
}

function renderIssuesTable(d: ReportData, primary: string): string {
  const perPage = 3;
  const pages: ReportIssue[][] = [];
  for (let i = 0; i < d.priorityIssues.length; i += perPage) {
    pages.push(d.priorityIssues.slice(i, i + perPage));
  }
  return pages.map((pg, pi) => `
<section class="page">
  <h2 class="section-title corp-title" style="border-color:${primary}">${pi === 0 ? "Audit Findings" : "Audit Findings (continued)"}</h2>
  ${pg.map((iss, i) => renderIssueDetailCard(iss, pi * perPage + i + 1, primary)).join("")}
</section>`).join("");
}

function renderIssueDetailCard(iss: ReportIssue, num: number, primary: string): string {
  const details = (iss.affectedElementDetails ?? []);
  return `<div class="issue-detail-card" style="border-left:4px solid ${sevClr(iss.severity)};background:${sevBg(iss.severity)}">
  <div class="idc-header">
    <span class="idc-num" style="background:${sevClr(iss.severity)};color:#fff">${num}</span>
    <span class="ft-sev" style="color:${sevClr(iss.severity)}">${iss.severity.toUpperCase()}</span>
    <strong class="idc-title">${esc(iss.title)}</strong>
    <span class="idc-meta">${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""} &middot; Est. ${esc(iss.estimatedFixTime)}</span>
  </div>
  <div class="idc-body">
    <div class="idc-section">
      <div class="idc-label">Impact</div>
      <p>${esc(iss.impact)}</p>
    </div>
    <div class="idc-section">
      <div class="idc-label">How to Fix</div>
      <p>${esc(iss.recommendation)}</p>
    </div>
    ${iss.wcagCriteria.length > 0 ? `<div class="idc-section">
      <div class="idc-label">WCAG Criteria</div>
      <p>${iss.wcagCriteria.map(c => `<span class="ac-chip ac-chip-wcag">${c}</span>`).join(" ")}</p>
    </div>` : ""}
    ${details.length > 0 ? `<div class="idc-section">
      <div class="idc-label">Affected Elements</div>
      <table class="evidence-table">
        <thead><tr><th>#</th><th>Selector</th><th>HTML Snippet</th></tr></thead>
        <tbody>
          ${details.map((el, idx) => `<tr>
            <td class="ev-num">${idx + 1}</td>
            <td class="ev-mono">${esc(el.selector)}</td>
            <td class="ev-mono">${el.html ? esc(el.html) : "&mdash;"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>` : ""}
    <div class="idc-rule"><span class="idc-label">Rule:</span> <code>${esc(iss.id)}</code></div>
  </div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 5 — Compliance & Legal
   ═══════════════════════════════════════════════════════════ */

function renderComplianceLegal(d: ReportData, primary: string, s: ReportStyle): string {
  return pageSection("Compliance &amp; Legal", primary, s, `
  <div class="legal-grid">
    <div class="legal-card">
      <h3>European Accessibility Act (EAA) 2025</h3>
      <p>The European Accessibility Act requires digital products and services to be accessible by June 28, 2025.
      Non-compliance may result in fines, market restrictions, and reputational damage across EU member states.</p>
      <p><strong>Your status:</strong>
        <span style="color:${d.eaaReady ? "#16A34A" : "#D97706"};font-weight:600">
          ${d.eaaReady ? "Your site meets the baseline requirements for EAA compliance." : "Your site requires remediation to meet EAA requirements."}
        </span></p>
    </div>
    <div class="legal-card">
      <h3>Continuous Monitoring Recommendation</h3>
      <ul>
        <li>Automated weekly scans to catch regressions</li>
        <li>Manual audit every quarter for complex interactions</li>
        <li>Developer training on WCAG fundamentals</li>
        <li>Accessibility testing as part of CI/CD pipeline</li>
      </ul>
    </div>
    <div class="legal-card">
      <h3>Audit Traceability</h3>
      <table class="audit-table">
        <tr><td>Scan ID</td><td><code>${esc(d.scanId)}</code></td></tr>
        <tr><td>Scan Date</td><td>${fmtDate(d.scanDate)}</td></tr>
        <tr><td>Engine</td><td>${esc(d.engineName)} v${esc(d.engineVersion)}</td></tr>
        <tr><td>Standard</td><td><span style="color:#16A34A;font-weight:600">${esc(d.complianceLevel)}</span></td></tr>
        <tr><td>Domain</td><td>${esc(d.domain)}</td></tr>
        <tr><td>Pages Scanned</td><td>${d.pagesScanned ?? 1}</td></tr>
      </table>
    </div>
  </div>`);
}

/* ═══════════════════════════════════════════════════════════
   Page 6 — CTA
   ═══════════════════════════════════════════════════════════ */

function renderCTA(d: ReportData, primary: string, s: ReportStyle): string {
  const wl = d.whiteLabelConfig;
  const cta = d.ctaConfig;

  return `<section class="page cta-page">
  <div class="cta-2col">
    <div class="cta-left">
      <h2 style="color:${primary}">Next Steps</h2>
      <p>Based on this assessment, we recommend prioritising the ${d.issueBreakdown.critical > 0 ? "critical and serious" : "identified"} findings to reduce legal risk and improve user experience.</p>
      <ul class="cta-bullets">
        <li>Detailed remediation roadmap</li>
        <li>Ongoing compliance monitoring</li>
        <li>Audit-ready documentation</li>
        <li>Developer training on accessibility standards</li>
      </ul>
      ${cta.supportEmail ? `<p class="cta-contact">Contact: <a href="mailto:${esc(cta.supportEmail)}">${esc(cta.supportEmail)}</a></p>` : ""}
    </div>
    <div class="cta-right">
      ${cta.ctaUrl ? `<a href="${esc(cta.ctaUrl)}" class="cta-button" style="background:${primary}">${esc(cta.ctaText || "Get Started")}</a>` : ""}
      ${wl.footerText ? `<p class="cta-footer-text">${esc(wl.footerText)}</p>` : ""}
    </div>
  </div>
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   CSS — design tokens + premium / corporate modes
   ═══════════════════════════════════════════════════════════ */

function buildCSS(primary: string, _secondary: string, _accent: string, bg: string, dark: string, s: ReportStyle): string {
  const isC = corp(s);
  const radius = isC ? "4px" : "12px";
  const radiusSm = isC ? "2px" : "8px";
  const shadow = isC ? "none" : "0 2px 8px rgba(0,0,0,.06)";
  const cardBg = isC ? "white" : bg;
  const cardBorder = isC ? "1px solid #D1D5DB" : "1px solid #E5E7EB";
  const titleWeight = isC ? "700" : "800";

  return `
:root{--r:${radius};--rs:${radiusSm};--shadow:${shadow};--card-bg:${cardBg};--card-border:${cardBorder};--dark:${dark};--bg:${bg};--primary:${primary};
  --sev-critical:#DC2626;--sev-serious:#F97316;--sev-moderate:#FACC15;--sev-minor:#9CA3AF}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
body{font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  color:${dark};background:white;line-height:1.6;font-size:14px;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}

.page{width:210mm;min-height:297mm;padding:20mm 22mm;margin:0 auto;position:relative;
  page-break-after:always;page-break-inside:avoid;background:white}
@media screen{.page{box-shadow:0 4px 24px rgba(0,0,0,.08);margin-bottom:24px;border-radius:4px}}
@media screen and (max-width:800px){
  .page{width:100%;min-height:auto;padding:16px 20px}
  .report-header{padding:16px 20px}
  .cover-main{padding:20px;flex-direction:column}
  .cover-main-left,.cover-main-right{flex:none;width:100%}
  .cover-footer{padding:0 20px 16px}
  .cover-title-prem{font-size:26px}
  .cover-title-corp{font-size:24px}
  .cover-kpi-strip{flex-wrap:wrap}
  .metrics-grid{grid-template-columns:repeat(2,1fr)}
  .breakdown-grid{grid-template-columns:1fr}
  .cta-2col{grid-template-columns:1fr}
  .ac-grid{grid-template-columns:1fr}
  .brand-logo{max-height:32px;max-width:160px}
}

/* ── Version marker (debug) ── */
.version-marker{text-align:center;font-size:9px;color:#D1D5DB;padding:6px 0;font-family:monospace}

/* ── Severity chips ── */
.sev-chip{display:inline-block;padding:3px 10px;border-radius:${radiusSm};font-size:10px;font-weight:700;letter-spacing:0.4px;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── Risk bar ── */
.risk-bar-track{height:6px;background:#E5E7EB;border-radius:3px;margin:6px 0 10px;overflow:hidden}
.risk-bar-fill{height:100%;border-radius:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ══════════════════════════════════════
   BRAND BLOCK — prominent header element
   ══════════════════════════════════════ */
.brand-block{display:flex;align-items:center;gap:12px}
.brand-logo{max-height:40px;max-width:200px;width:auto;height:auto;object-fit:contain;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.brand-monogram{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  color:white;font-size:20px;font-weight:800;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.brand-text{display:flex;flex-direction:column;gap:1px}
.brand-name{font-size:18px;font-weight:800;letter-spacing:-0.3px;margin:0;line-height:1.2}
.brand-domain{font-size:12px;font-weight:400}

/* ══════════════════════════════════════
   COVER — shared structure
   ══════════════════════════════════════ */
.cover-page{padding:0;display:flex;flex-direction:column}

/* Header row */
.report-header{display:flex;align-items:center;justify-content:space-between;padding:28px 32px 20px;flex-shrink:0}
.report-header-dark .brand-name{color:white}
.header-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.header-date{font-size:12px;color:#9CA3AF}
.header-style-tag{font-size:10px;font-weight:600;padding:2px 10px;border:1px solid;border-radius:${radiusSm};letter-spacing:0.3px}

/* Accent divider under header */
.header-divider{height:3px;margin:0 32px;border-radius:2px;flex-shrink:0;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}

/* Main content row */
.cover-main{display:flex;flex:1;padding:24px 32px;gap:28px;align-items:flex-start}
.cover-main-left{flex:1.3}
.cover-main-right{flex:0.7;display:flex;justify-content:center}

/* Footer row */
.cover-footer{display:flex;justify-content:space-between;padding:0 32px 24px;align-items:center;flex-shrink:0}
.cover-footer-dark{color:rgba(255,255,255,.3)}
.cover-footer-text{font-size:11px}
.cover-scanid{font-size:10px;color:#D1D5DB;font-family:monospace}

/* ══════════════════════════════════════
   COVER — Premium (dark hero)
   ══════════════════════════════════════ */
.cover-premium{background:linear-gradient(170deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%);color:white}

.cover-title-prem{font-size:34px;font-weight:900;line-height:1.1;letter-spacing:-1.5px;color:white;margin-bottom:12px}
.cover-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.cover-kpi-strip{display:flex;gap:20px;margin-top:12px}
.cover-kpi{text-align:center}
.cover-kpi-val{display:block;font-size:28px;font-weight:800;line-height:1.1}
.cover-kpi-lbl{font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:0.5px}

.cover-score-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
  border-radius:16px;padding:24px;text-align:center;backdrop-filter:blur(8px);
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.csc-label{font-size:14px;color:rgba(255,255,255,.7);margin-top:4px}
.csc-risk{font-size:13px;color:rgba(255,255,255,.5);margin-top:6px}
.csc-fix{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px}

/* ══════════════════════════════════════
   COVER — Corporate (white, clean)
   ══════════════════════════════════════ */
.cover-corp{background:white}
.cover-title-corp{font-size:28px;font-weight:700;line-height:1.15;color:${dark};letter-spacing:-0.5px;margin-bottom:10px}
.cover-meta-row{display:flex;gap:20px}
.cover-meta-item{font-size:13px;color:#374151}
.cover-meta-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;font-weight:600;margin-bottom:2px}

.cover-score-card-corp{background:#F9FAFB;border:1px solid #D1D5DB;border-radius:4px;padding:24px;text-align:center;min-width:200px}
.csc-score{font-size:52px;font-weight:800;line-height:1;display:inline}
.csc-of{font-size:20px;font-weight:400;color:#9CA3AF;display:inline}
.csc-grade{font-size:13px;color:#6B7280;margin:6px 0 12px}
.csc-bar-track{height:6px;background:#E5E7EB;border-radius:3px;overflow:hidden;max-width:200px;margin:0 auto}
.csc-bar-fill{height:100%;border-radius:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.csc-meta{display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:#9CA3AF}

/* ── Section titles ── */
.section-title{font-size:${isC ? "20px" : "24px"};font-weight:${titleWeight};margin-bottom:20px;padding-bottom:10px;
  border-bottom:${isC ? "2px" : "3px"} solid var(--primary);letter-spacing:-0.5px}
.corp-title{border-bottom-width:2px}
.subsection-title{font-size:16px;font-weight:700;margin:20px 0 12px;color:#374151}

/* ── Executive Summary ── */
.exec-cards{display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
.exec-card{background:var(--card-bg);border-radius:var(--r);padding:18px 20px;border:var(--card-border);box-shadow:var(--shadow)}
.exec-card h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.exec-card p{font-size:13px;color:#4B5563;margin-bottom:4px;line-height:1.6}
.exec-risk-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.exec-risk-label{font-size:14px;font-weight:700;white-space:nowrap}

.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.metric-card{background:white;border:var(--card-border);border-radius:var(--r);padding:16px 10px;text-align:center;box-shadow:var(--shadow)}
.metric-value{font-size:26px;font-weight:800;line-height:1.1}
.metric-label{font-size:10px;color:#6B7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}

/* Corporate summary table */
.corp-summary-table{width:100%;border-collapse:collapse;margin-bottom:20px}
.corp-summary-table td{padding:10px 14px;border:1px solid #D1D5DB;font-size:13px}
.cst-label{font-weight:600;color:#374151;background:#F9FAFB;width:120px}
.corp-prose{margin-top:16px}.corp-prose h3{font-size:14px;font-weight:700;margin-bottom:6px;color:#374151}
.corp-prose p{font-size:13px;color:#4B5563;margin-bottom:6px}

/* ── Visual Breakdown ── */
.breakdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.breakdown-card{background:var(--card-bg);border-radius:var(--r);padding:18px;border:var(--card-border);box-shadow:var(--shadow)}
.breakdown-card h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px}
.chart-center{display:flex;justify-content:center}
.progress-stack{display:flex;flex-direction:column;gap:14px;padding-top:6px}
.mt-24{margin-top:18px}

.donut-wrap{display:flex;align-items:center;gap:14px}
.legend-col{display:flex;flex-direction:column;gap:6px}
.legend-row{display:flex;align-items:center;gap:6px}
.legend-chip{width:12px;height:12px;border-radius:3px;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.legend-label{font-size:12px;color:#374151;font-weight:500}
.legend-val{font-size:12px;color:#6B7280}

.pbar-row{display:flex;align-items:center;gap:10px}
.pbar-label{font-size:12px;font-weight:500;color:#374151;min-width:70px}
.pbar-track{flex:1;background:${isC ? "#E5E7EB" : "#F3F4F6"};border-radius:7px;overflow:hidden}
.pbar-fill{transition:width .3s;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pbar-val{font-size:12px;font-weight:700;min-width:40px;text-align:right}

.status-table{width:100%;border-collapse:collapse}
.status-table td{padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.status-table td:first-child{font-weight:600;color:#374151}
.status-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}

.maturity-indicator{display:flex;gap:8px;margin-top:12px}
.maturity-step{flex:1;text-align:center;padding:12px 4px;border-radius:var(--rs);border:2px solid #E5E7EB;font-size:11px;color:#9CA3AF}
.maturity-step.active{background:var(--card-bg)}
.maturity-dot{width:12px;height:12px;border-radius:50%;margin:0 auto 6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── Audit Cards (premium) ── */
.issues-list{display:flex;flex-direction:column;gap:14px}
.audit-card{border:var(--card-border);border-radius:var(--r);box-shadow:var(--shadow);page-break-inside:avoid}
.ac-header{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;background:var(--card-bg);border-bottom:var(--card-border)}
.ac-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;color:white;
  font-size:12px;font-weight:700;flex-shrink:0;background:var(--primary);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ac-title{font-size:14px;font-weight:700;color:var(--dark);flex:1;min-width:0;
  white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.4}
.ac-body{padding:14px 16px}
.ac-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}
.ac-section{margin-bottom:6px}
.ac-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;font-weight:700;margin-bottom:2px}
.ac-section p{font-size:12px;color:#374151;line-height:1.5}
.ac-footer{display:flex;flex-wrap:wrap;gap:6px;padding-top:10px;border-top:1px solid #F3F4F6}
.ac-chip{font-size:10px;padding:2px 8px;border-radius:var(--rs);background:#F3F4F6;color:#6B7280;font-weight:600}
.ac-chip-wcag{background:#EFF6FF;color:#1D4ED8}
.ac-tech-row{margin-top:6px;font-size:10px;color:#9CA3AF}
.ac-tech-label{font-weight:600}
.ac-tech-row code{font-family:'SF Mono',Consolas,monospace;font-size:10px;background:#F3F4F6;padding:1px 4px;border-radius:3px}

/* ── Findings table (corporate) ── */
.findings-table{width:100%;border-collapse:collapse;font-size:12px}
.findings-table th{background:#F3F4F6;padding:8px 10px;text-align:left;font-weight:700;border:1px solid #D1D5DB;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.findings-table td{padding:8px 10px;border:1px solid #D1D5DB;vertical-align:top}
.findings-table tbody tr:nth-child(even){background:#FAFAFA}
.ft-sev{font-weight:700;font-size:10px;letter-spacing:0.3px}
.ft-title{font-weight:600;white-space:normal;overflow-wrap:anywhere;word-break:break-word}
.ft-desc{font-size:11px;color:#4B5563;white-space:normal;overflow-wrap:anywhere;word-break:break-word}
.ft-num{text-align:center;white-space:nowrap}

/* ── Issue Detail Cards (corporate full-text) ── */
.issue-detail-card{border-radius:var(--r);padding:16px 18px;margin-bottom:14px;page-break-inside:avoid;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.idc-header{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.idc-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;
  font-size:11px;font-weight:700;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.idc-title{font-size:14px;font-weight:700;color:var(--dark);flex:1;min-width:0;
  white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.4}
.idc-meta{font-size:11px;color:#6B7280;white-space:nowrap}
.idc-body{display:flex;flex-direction:column;gap:10px}
.idc-section{margin:0}
.idc-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;font-weight:700;margin-bottom:3px}
.idc-section p{font-size:12px;color:#374151;line-height:1.6;margin:0}
.idc-elements{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.idc-element{display:flex;gap:6px;align-items:flex-start}
.idc-el-num{font-size:11px;font-weight:700;color:#6B7280;min-width:18px;flex-shrink:0}
.idc-el-body{flex:1;min-width:0}
.idc-el-selector{font-size:11px;color:#374151;margin-bottom:2px}
.idc-el-selector code,.idc-el-html code{font-family:'SF Mono',Consolas,monospace;font-size:10px;background:rgba(0,0,0,.05);
  padding:2px 5px;border-radius:3px;display:inline-block;max-width:100%;overflow-wrap:anywhere;word-break:break-all}
.idc-el-html{font-size:10px;color:#6B7280}
.idc-more{font-size:11px;color:#9CA3AF;font-style:italic;margin-top:4px}
.idc-rule{font-size:10px;color:#9CA3AF;margin-top:4px;padding-top:8px;border-top:1px solid rgba(0,0,0,.06)}
.idc-rule code{font-family:'SF Mono',Consolas,monospace;font-size:10px;background:#F3F4F6;padding:1px 4px;border-radius:3px}

.empty-state{text-align:center;padding:60px 20px;color:#6B7280;font-size:16px}

/* ── Health Score Badge ── */
.exec-health-row{display:flex;align-items:center;gap:20px;margin-bottom:18px}
.exec-health-badge{display:flex;align-items:center;gap:14px;border:3px solid;border-radius:var(--r);padding:14px 20px;
  background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ehb-score{font-size:42px;font-weight:900;line-height:1}
.ehb-meta{display:flex;flex-direction:column;gap:2px}
.ehb-grade{font-size:14px;font-weight:700;color:#374151}
.ehb-label{font-size:12px;color:#6B7280}
.exec-health-detail{flex:1}
.exec-health-detail p{font-size:13px;color:#4B5563;margin-bottom:4px}
.exec-health-formula{font-size:11px;color:#9CA3AF;font-family:'SF Mono',Consolas,monospace}

/* ── Top Priority Fixes ── */
.tpf-section{margin-top:16px}
.tpf-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
.tpf-table th{background:#F3F4F6;padding:8px 10px;text-align:left;font-weight:700;border:1px solid #E5E7EB;
  font-size:10px;text-transform:uppercase;letter-spacing:0.3px}
.tpf-table td{padding:8px 10px;border:1px solid #E5E7EB;vertical-align:middle}
.tpf-table tbody tr:nth-child(even){background:#FAFAFA}
.tpf-rank{text-align:center;font-weight:700;color:#6B7280;width:30px}
.tpf-title{font-weight:600;color:#374151}
.tpf-num{text-align:center;white-space:nowrap}

/* ── Coverage Note ── */
.coverage-note{margin-top:16px;padding:10px 14px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:var(--rs);
  font-size:11px;color:#92400E;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── WCAG Compliance Matrix ── */
.matrix-summary{font-size:13px;color:#4B5563;margin-bottom:14px;line-height:1.6}
.wcag-matrix-table{width:100%;border-collapse:collapse;font-size:12px}
.wcag-matrix-table th{background:#F3F4F6;padding:8px 10px;text-align:left;font-weight:700;border:1px solid #D1D5DB;
  font-size:10px;text-transform:uppercase;letter-spacing:0.3px}
.wcag-matrix-table td{padding:7px 10px;border:1px solid #E5E7EB;vertical-align:middle}
.wcag-matrix-table tbody tr:nth-child(even){background:#FAFAFA}
.wcag-row-fail{background:#FEF2F2!important}
.wcag-criterion{font-weight:500;color:#374151}
.wcag-level{text-align:center}
.wcag-level-badge{display:inline-block;padding:2px 8px;border-radius:var(--rs);background:#EFF6FF;color:#1D4ED8;
  font-size:10px;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wcag-status-chip{display:inline-block;padding:3px 10px;border-radius:var(--rs);font-size:10px;font-weight:700;
  letter-spacing:0.3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wcag-count{text-align:center;font-weight:600}

/* ── Scan Configuration ── */
.scan-config-table{width:100%;border-collapse:collapse}
.scan-config-table td{padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px}
.sct-label{font-weight:600;color:#374151;width:160px;background:#F9FAFB}
.scan-config-table code{font-family:'SF Mono',Consolas,monospace;font-size:11px;background:#F3F4F6;padding:2px 6px;border-radius:4px}

/* ── Enterprise Evidence Tables ── */
.evidence-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px;table-layout:fixed}
.evidence-table th{background:#F3F4F6;padding:6px 8px;text-align:left;font-weight:700;border:1px solid #E5E7EB;
  font-size:10px;text-transform:uppercase;letter-spacing:0.3px}
.evidence-table th:first-child{width:30px}
.evidence-table th:nth-child(2){width:40%}
.evidence-table th:nth-child(3){width:auto}
.evidence-table td{padding:5px 8px;border:1px solid #E5E7EB;vertical-align:top}
.evidence-table tbody tr:nth-child(even){background:#FAFAFA}
.ev-num{text-align:center;font-weight:600;color:#6B7280;width:30px}
.ev-mono{font-family:'SF Mono',Consolas,monospace;font-size:10px;color:#374151;
  overflow-wrap:anywhere;word-break:break-all;white-space:pre-wrap;line-height:1.4}

/* ── Compliance & Legal ── */
.legal-grid{display:flex;flex-direction:column;gap:14px}
.legal-card{background:var(--card-bg);border-radius:var(--r);padding:18px 20px;border:var(--card-border);box-shadow:var(--shadow)}
.legal-card h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px}
.legal-card p{font-size:13px;color:#4B5563;margin-bottom:8px;line-height:1.6}
.legal-card ul{margin:8px 0 0 20px;font-size:13px;color:#4B5563}
.legal-card li{margin-bottom:4px}
.audit-table{width:100%;border-collapse:collapse}
.audit-table td{padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.audit-table td:first-child{font-weight:600;color:#374151;width:140px}
.audit-table code{font-family:'SF Mono',Consolas,monospace;font-size:11px;background:#F3F4F6;padding:2px 6px;border-radius:4px}

/* ── CTA ── */
.cta-page{display:flex;align-items:center;justify-content:center}
.cta-2col{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start;max-width:700px;width:100%}
.cta-left h2{font-size:22px;font-weight:${titleWeight};margin-bottom:10px}
.cta-left p{font-size:13px;color:#4B5563;line-height:1.6;margin-bottom:12px}
.cta-trust,.cta-bullets{list-style:none;padding:0;margin:0 0 16px}
.cta-trust li,.cta-bullets li{font-size:12px;color:#374151;padding:4px 0;padding-left:16px;position:relative}
.cta-trust li::before,.cta-bullets li::before{content:"\\2713";position:absolute;left:0;color:var(--primary);font-weight:700}
.cta-contact{font-size:12px;color:#6B7280}.cta-contact a{color:var(--primary)}
.cta-right{display:flex;flex-direction:column;align-items:center;gap:12px}
.cta-footer-text{font-size:11px;color:#D1D5DB;margin-top:12px;text-align:center}

.cta-button{display:inline-block;padding:12px 28px;color:white;border-radius:var(--r);font-size:14px;font-weight:700;
  text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.12);-webkit-print-color-adjust:exact;print-color-adjust:exact}

@media print{
  body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{box-shadow:none;margin:0;border-radius:0;width:100%;min-height:auto;padding:15mm 18mm;page-break-after:always}
  .cover-page{padding:0}
  .cover-page .report-header{padding:18px 18mm 14px}
  .cover-page .header-divider{margin:0 18mm}
  .cover-page .cover-main{padding:18px 18mm}
  .cover-page .cover-footer{padding:0 18mm 14px}
  .cover-premium{background:linear-gradient(170deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%)!important}
  .cta-button{border:2px solid var(--primary);color:var(--primary)!important;background:transparent!important}
  .version-marker{display:block}
}
`;
}
