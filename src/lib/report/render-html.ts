import type { ReportData, ReportIssue, Severity, ReportStyle } from "./types";

/* ═══════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════ */

export function renderReportHTML(data: ReportData): string {
  const t = data.themeConfig;
  const wl = data.whiteLabelConfig;
  const primary = wl.primaryColor || t.primaryColor;
  const s: ReportStyle = data.reportStyle ?? "bold";

  return `<!DOCTYPE html>
<html lang="en" data-style="${s}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accessibility Compliance Report — ${esc(data.domain)}</title>
<style>${buildCSS(primary, t.secondaryColor, t.accentColor, t.backgroundColor, t.darkColor, s)}</style>
</head>
<body class="style-${s}">
${renderCover(data, primary, s)}
${renderExecutiveSummary(data, primary, s)}
${renderVisualBreakdown(data, primary, s)}
${renderPriorityIssues(data, primary, s)}
${renderComplianceLegal(data, primary, s)}
${renderCTA(data, primary, s)}
${renderFooter(data)}
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════ */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}
function sevClr(s: Severity): string {
  const m: Record<Severity, string> = { critical: "#DC2626", serious: "#EA580C", moderate: "#D97706", minor: "#2563EB" };
  return m[s];
}
function sevBg(s: Severity): string {
  const m: Record<Severity, string> = { critical: "#FEF2F2", serious: "#FFF7ED", moderate: "#FFFBEB", minor: "#EFF6FF" };
  return m[s];
}
function sevGray(s: Severity): string {
  const m: Record<Severity, string> = { critical: "#1E1E1E", serious: "#4B5563", moderate: "#6B7280", minor: "#9CA3AF" };
  return m[s];
}
function riskClr(r: string): string {
  const m: Record<string, string> = { LOW: "#16A34A", MEDIUM: "#D97706", HIGH: "#EA580C", CRITICAL: "#DC2626" };
  return m[r] ?? "#6B7280";
}
function grade(s: number): string {
  if (s >= 90) return "A"; if (s >= 80) return "B"; if (s >= 70) return "C"; if (s >= 50) return "D"; return "F";
}
function ratingLabel(s: number): string {
  if (s >= 90) return "Excellent"; if (s >= 80) return "Good"; if (s >= 70) return "Fair"; if (s >= 50) return "Needs Work"; return "Poor";
}
function recommendedPlan(d: ReportData): "Pro" | "Business" {
  if (d.riskLevel === "CRITICAL" || d.riskLevel === "HIGH" || d.issueBreakdown.critical >= 3) return "Business";
  return "Pro";
}

/* ═══════════════════════════════════════════════════════════
   Structural helpers
   ═══════════════════════════════════════════════════════════ */

function renderHeader(d: ReportData, primary: string): string {
  const logo = d.whiteLabelConfig.logoUrl
    ? `<img src="${esc(d.whiteLabelConfig.logoUrl)}" alt="${esc(d.companyName)}" class="hdr-logo"/>`
    : `<span class="hdr-logo-text" style="color:${primary}">${esc(d.companyName)}</span>`;
  return `<div class="page-hdr">${logo}<span class="hdr-domain">${esc(d.domain)}</span></div>`;
}

function renderFooter(d: ReportData): string {
  if (!d.whiteLabelConfig.footerText) return "";
  return `<div class="global-footer">${esc(d.whiteLabelConfig.footerText)}</div>`;
}

function pageSection(title: string, primary: string, s: ReportStyle, body: string, extra?: string): string {
  const cls = s === "corporate" ? "section-title corp-title" : "section-title";
  return `<section class="page">
  <h2 class="${cls}" style="border-color:${primary}">${title}</h2>
  ${body}
  ${extra ?? ""}
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   SVG Charts — upgraded with thicker strokes & legend chips
   ═══════════════════════════════════════════════════════════ */

function scoreCircleBold(score: number, primary: string): string {
  const r = 82; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const gc = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return `<svg width="240" height="260" viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${gc}"/></linearGradient></defs>
  <circle cx="120" cy="120" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="16"/>
  <circle cx="120" cy="120" r="${r}" fill="none" stroke="url(#sg)" stroke-width="16"
    stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 120 120)"/>
  <text x="120" y="108" text-anchor="middle" font-size="56" font-weight="900" fill="${gc}">${score}</text>
  <text x="120" y="132" text-anchor="middle" font-size="14" fill="#6B7280" font-weight="500">out of 100</text>
  <text x="120" y="160" text-anchor="middle" font-size="20" font-weight="800" fill="${gc}">Grade ${grade(score)}</text>
  <text x="120" y="185" text-anchor="middle" font-size="13" fill="#9CA3AF">Rating: ${ratingLabel(score)}</text>
</svg>`;
}

function scoreBoxCorporate(score: number, primary: string): string {
  const gc = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  const pct = Math.min(100, score);
  return `<div class="corp-score-box">
  <div class="corp-score-num" style="color:${gc}">${score}<span class="corp-score-of">/100</span></div>
  <div class="corp-score-label">Accessibility Score — Grade ${grade(score)}</div>
  <div class="corp-progress-track"><div class="corp-progress-fill" style="width:${pct}%;background:${gc}"></div></div>
</div>`;
}

function donutChart(bk: { critical: number; serious: number; moderate: number; minor: number }, s: ReportStyle): string {
  const total = bk.critical + bk.serious + bk.moderate + bk.minor || 1;
  const segs: { v: number; c: string; gc: string; l: string }[] = [
    { v: bk.critical, c: "#DC2626", gc: "#1E1E1E", l: "Critical" },
    { v: bk.serious, c: "#EA580C", gc: "#4B5563", l: "Serious" },
    { v: bk.moderate, c: "#D97706", gc: "#9CA3AF", l: "Moderate" },
    { v: bk.minor, c: "#2563EB", gc: "#D1D5DB", l: "Minor" },
  ];
  const isCorp = s === "corporate";
  const r = 72; const circ = 2 * Math.PI * r; const sw = isCorp ? 20 : 32;
  let cum = 0; let arcs = "";
  for (const seg of segs) {
    if (seg.v === 0) continue;
    const dl = (seg.v / total) * circ;
    arcs += `<circle cx="110" cy="110" r="${r}" fill="none" stroke="${isCorp ? seg.gc : seg.c}" stroke-width="${sw}"
      stroke-dasharray="${dl} ${circ - dl}" stroke-dashoffset="${-cum}" transform="rotate(-90 110 110)"/>`;
    cum += dl;
  }
  let legend = ""; let ly = 16;
  for (const seg of segs) {
    const pct = total > 0 ? Math.round((seg.v / total) * 100) : 0;
    legend += `<div class="legend-row" style="top:${ly}px">
      <span class="legend-chip" style="background:${isCorp ? seg.gc : seg.c}"></span>
      <span class="legend-label">${seg.l}</span>
      <span class="legend-val">${seg.v} (${pct}%)</span>
    </div>`;
    ly += 28;
  }
  return `<div class="donut-wrap">
  <svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
    ${arcs}
    <circle cx="110" cy="110" r="${r - sw / 2 - 4}" fill="white"/>
    <text x="110" y="106" text-anchor="middle" font-size="32" font-weight="800" fill="#1E1E1E">${total}</text>
    <text x="110" y="126" text-anchor="middle" font-size="11" fill="#6B7280">Total Issues</text>
  </svg>
  <div class="legend-col">${legend}</div>
</div>`;
}

function progressBar(label: string, pct: number, color: string, s: ReportStyle): string {
  const h = s === "corporate" ? 10 : 18;
  const rx = s === "corporate" ? 2 : 9;
  const w = 280; const bw = w - 90; const fw = Math.round((Math.min(100, pct) / 100) * bw);
  return `<svg width="${w}" height="36" viewBox="0 0 ${w} 36" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="23" font-size="12" fill="#374151" font-weight="500">${esc(label)}</text>
  <rect x="90" y="${(36 - h) / 2}" width="${bw}" height="${h}" rx="${rx}" fill="${s === "corporate" ? "#E5E7EB" : "#F3F4F6"}"/>
  <rect x="90" y="${(36 - h) / 2}" width="${fw}" height="${h}" rx="${rx}" fill="${color}"/>
  <text x="${90 + bw + 6}" y="24" font-size="12" font-weight="700" fill="${color}">${pct}%</text>
</svg>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 1 — Cover
   ═══════════════════════════════════════════════════════════ */

function renderCover(d: ReportData, primary: string, s: ReportStyle): string {
  const logo = d.whiteLabelConfig.logoUrl
    ? `<img src="${esc(d.whiteLabelConfig.logoUrl)}" alt="${esc(d.companyName)}" class="cover-logo"/>`
    : `<div class="cover-logo-text" style="color:${primary}">${esc(d.companyName)}</div>`;

  const scoreBlock = s === "corporate"
    ? scoreBoxCorporate(d.score, primary)
    : `<div class="cover-score-wrap">${scoreCircleBold(d.score, primary)}</div>`;

  const coverCls = s === "corporate" ? "page cover-page cover-corp" : "page cover-page";

  return `<section class="${coverCls}">
  <div class="cover-top">${logo}</div>
  <div class="cover-center">
    <h1 class="cover-title">${s === "corporate" ? "Accessibility Compliance Report" : "Accessibility<br/>Compliance Report"}</h1>
    <p class="cover-domain">${esc(d.domain)}</p>
    ${scoreBlock}
    <div class="cover-badges">
      <span class="badge badge-compliance">${esc(d.complianceLevel)}</span>
      <span class="badge" style="background:${d.eaaReady ? "#DCFCE7" : "#FEF9C3"};color:${d.eaaReady ? "#166534" : "#854D0E"}">EAA 2025 ${d.eaaReady ? "Ready" : "Action Needed"}</span>
      <span class="badge" style="background:${sevBg(d.riskLevel === "LOW" ? "minor" : d.riskLevel === "MEDIUM" ? "moderate" : "critical")};color:${riskClr(d.riskLevel)}">Risk: ${d.riskLevel}</span>
    </div>
  </div>
  <div class="cover-bottom">
    <p class="cover-date">Report generated ${fmtDate(d.scanDate)}</p>
    ${d.whiteLabelConfig.showVexNexaBranding ? `<p class="cover-powered">Powered by VexNexa</p>` : ""}
  </div>
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 2 — Executive Summary
   ═══════════════════════════════════════════════════════════ */

function renderExecutiveSummary(d: ReportData, primary: string, s: ReportStyle): string {
  const metrics: { label: string; value: string | number; color: string }[] = [
    { label: "Total Issues", value: d.issueBreakdown.total, color: "#6B7280" },
    { label: "Critical", value: d.issueBreakdown.critical, color: "#DC2626" },
    { label: "Serious", value: d.issueBreakdown.serious, color: "#EA580C" },
    { label: "Moderate", value: d.issueBreakdown.moderate, color: "#D97706" },
    { label: "Minor", value: d.issueBreakdown.minor, color: "#2563EB" },
    { label: "Score", value: `${d.score}/100`, color: primary },
    { label: "Compliance", value: `${d.compliancePercentage}%`, color: "#16A34A" },
    { label: "Est. Fix Time", value: d.estimatedFixTime, color: "#7C3AED" },
  ];

  if (s === "corporate") {
    // Table-forward layout
    return pageSection("Executive Summary", primary, s, `
    <table class="corp-summary-table">
      <tr><td class="cst-label">Domain</td><td>${esc(d.domain)}</td><td class="cst-label">Score</td><td><strong style="color:${primary}">${d.score}/100</strong> (Grade ${grade(d.score)})</td></tr>
      <tr><td class="cst-label">Risk Level</td><td style="color:${riskClr(d.riskLevel)};font-weight:600">${d.riskLevel}</td><td class="cst-label">Compliance</td><td>${d.compliancePercentage}%</td></tr>
      <tr><td class="cst-label">Total Issues</td><td>${d.issueBreakdown.total}</td><td class="cst-label">Est. Fix Time</td><td>${esc(d.estimatedFixTime)}</td></tr>
      <tr><td class="cst-label">Critical</td><td style="color:#DC2626">${d.issueBreakdown.critical}</td><td class="cst-label">Serious</td><td style="color:#EA580C">${d.issueBreakdown.serious}</td></tr>
    </table>
    <div class="corp-prose">
      <h3>Assessment</h3>
      <p>${esc(d.legalRisk)}</p>
      <p>Estimated remediation effort: <strong>${esc(d.estimatedFixTime)}</strong>.</p>
    </div>`);
  }

  // Bold style
  return pageSection("Executive Summary", primary, s, `
  <div class="summary-status">
    <div class="status-card">
      <h3>Accessibility Status</h3>
      <p>Your website <strong>${esc(d.domain)}</strong> achieved an accessibility score of
      <strong style="color:${primary}">${d.score}/100</strong> (Grade ${grade(d.score)}).
      ${d.issueBreakdown.critical > 0
        ? `There are <strong style="color:#DC2626">${d.issueBreakdown.critical} critical issues</strong> requiring immediate attention.`
        : "No critical issues were detected."}</p>
    </div>
    <div class="status-card">
      <h3>Legal Risk Assessment</h3>
      <p style="color:${riskClr(d.riskLevel)};font-weight:600">${d.riskLevel} Risk</p>
      <p>${esc(d.legalRisk)}</p>
    </div>
    <div class="status-card">
      <h3>Estimated Remediation</h3>
      <p>Based on ${d.issueBreakdown.total} identified issues, the estimated developer effort is
      <strong style="color:#7C3AED">${esc(d.estimatedFixTime)}</strong>.</p>
    </div>
  </div>
  <h3 class="subsection-title">Key Metrics</h3>
  <div class="metrics-grid">
    ${metrics.map((m) => `<div class="metric-card"><div class="metric-value" style="color:${m.color}">${m.value}</div><div class="metric-label">${m.label}</div></div>`).join("")}
  </div>`);
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
          return `<div class="maturity-step ${lv === d.maturityLevel ? "active" : ""}" style="${reached ? `border-color:${s === "corporate" ? "#374151" : primary}` : ""}">
            <div class="maturity-dot" style="background:${reached ? (s === "corporate" ? "#374151" : primary) : "#D1D5DB"}"></div>
            <span style="${reached ? `color:${s === "corporate" ? "#1E1E1E" : primary};font-weight:600` : ""}">${lv}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>`);
}

/* ═══════════════════════════════════════════════════════════
   Page 4 — Priority Issues (Audit Cards / Table)
   ═══════════════════════════════════════════════════════════ */

function renderPriorityIssues(d: ReportData, primary: string, s: ReportStyle): string {
  if (d.priorityIssues.length === 0) {
    return pageSection("Audit Findings", primary, s, `<div class="empty-state"><p>No accessibility issues were detected. Excellent work!</p></div>`);
  }

  if (s === "corporate") {
    return renderIssuesTable(d, primary);
  }

  // Bold: audit cards, max 3 per page
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
    <span class="ac-num" style="background:${primary}">${num}</span>
    <span class="ac-sev" style="background:${sevBg(iss.severity)};color:${sevClr(iss.severity)}">${iss.severity.toUpperCase()}</span>
    <h4 class="ac-title">${esc(iss.title)}</h4>
  </div>
  <div class="ac-body">
    <div class="ac-grid">
      <div class="ac-section">
        <div class="ac-label">Business Impact</div>
        <p>${esc(iss.impact)}</p>
      </div>
      <div class="ac-section">
        <div class="ac-label">User Impact</div>
        <p>${esc(iss.explanation)}</p>
      </div>
    </div>
    <div class="ac-section">
      <div class="ac-label">Recommended Fix</div>
      <p>${esc(iss.recommendation)}</p>
    </div>
    <div class="ac-footer">
      <span class="ac-chip">${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""}</span>
      <span class="ac-chip">Est. ${esc(iss.estimatedFixTime)}</span>
      ${iss.wcagCriteria.map(c => `<span class="ac-chip ac-chip-wcag">${c}</span>`).join("")}
    </div>
    <details class="ac-tech"><summary>Technical details</summary><p>Rule: <code>${esc(iss.id)}</code></p></details>
  </div>
</div>`;
}

function renderIssuesTable(d: ReportData, primary: string): string {
  // Corporate: table-forward, split across pages
  const perPage = 8;
  const pages: ReportIssue[][] = [];
  for (let i = 0; i < d.priorityIssues.length; i += perPage) {
    pages.push(d.priorityIssues.slice(i, i + perPage));
  }
  return pages.map((pg, pi) => `
<section class="page">
  <h2 class="section-title corp-title" style="border-color:${primary}">${pi === 0 ? "Audit Findings" : "Audit Findings (continued)"}</h2>
  <table class="findings-table">
    <thead><tr><th>#</th><th>Severity</th><th>Finding</th><th>Impact</th><th>Fix</th><th>Elements</th><th>Time</th></tr></thead>
    <tbody>
    ${pg.map((iss, i) => `<tr>
      <td>${pi * perPage + i + 1}</td>
      <td><span class="ft-sev" style="color:${sevGray(iss.severity)}">${iss.severity.toUpperCase()}</span></td>
      <td class="ft-title">${esc(iss.title)}</td>
      <td class="ft-desc">${esc(iss.impact).slice(0, 120)}${iss.impact.length > 120 ? "…" : ""}</td>
      <td class="ft-desc">${esc(iss.recommendation).slice(0, 100)}${iss.recommendation.length > 100 ? "…" : ""}</td>
      <td class="ft-num">${iss.affectedElements}</td>
      <td class="ft-num">${esc(iss.estimatedFixTime)}</td>
    </tr>`).join("")}
    </tbody>
  </table>
</section>`).join("");
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
      <p>Accessibility is not a one-time fix. We recommend:</p>
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
        <tr><td>Standard</td><td>${esc(d.complianceLevel)}</td></tr>
        <tr><td>Domain</td><td>${esc(d.domain)}</td></tr>
        <tr><td>Pages Scanned</td><td>${d.pagesScanned ?? 1}</td></tr>
      </table>
    </div>
  </div>`);
}

/* ═══════════════════════════════════════════════════════════
   Page 6 — CTA (conversion-optimized / white-label)
   ═══════════════════════════════════════════════════════════ */

function renderCTA(d: ReportData, primary: string, s: ReportStyle): string {
  const wl = d.whiteLabelConfig;
  const cta = d.ctaConfig;

  // White-label partner CTA
  if (!wl.showVexNexaBranding) {
    return `<section class="page cta-page">
  <div class="cta-2col">
    <div class="cta-left">
      <h2>Next Steps</h2>
      <p>Based on this assessment, we recommend prioritising the ${d.issueBreakdown.critical > 0 ? "critical and serious" : "identified"} findings to reduce legal risk and improve user experience.</p>
      <ul class="cta-bullets">
        <li>Detailed remediation roadmap</li>
        <li>Ongoing compliance monitoring</li>
        <li>Audit-ready documentation</li>
      </ul>
      ${cta.supportEmail ? `<p class="cta-contact">Contact: <a href="mailto:${esc(cta.supportEmail)}">${esc(cta.supportEmail)}</a></p>` : ""}
    </div>
    <div class="cta-right">
      ${cta.ctaUrl ? `<a href="${esc(cta.ctaUrl)}" class="cta-button" style="background:${primary}">${esc(cta.ctaText || "Get Started")} →</a>` : ""}
      <p class="cta-footer">${esc(wl.footerText)}</p>
    </div>
  </div>
</section>`;
  }

  // VexNexa branded CTA — conversion-optimized
  const rec = recommendedPlan(d);
  return `<section class="page cta-page">
  <div class="cta-2col">
    <div class="cta-left">
      <h2 style="color:${primary}">Protect Your Compliance</h2>
      <p>Your site scored <strong>${d.score}/100</strong> with <strong>${d.issueBreakdown.total} issues</strong>.
      ${d.riskLevel === "LOW" ? "Maintain this standard" : "Reduce your legal exposure"} with continuous monitoring.</p>
      <ul class="cta-trust">
        <li><strong>Audit evidence</strong> — exportable compliance history</li>
        <li><strong>Regression alerts</strong> — catch issues before users do</li>
        <li><strong>Scan history</strong> — track improvement over time</li>
        <li><strong>Team access</strong> — share reports with stakeholders</li>
      </ul>
    </div>
    <div class="cta-right">
      <div class="plan-cards">
        ${renderPlanCard("Free", ["5 scans/month", "Basic reports", "Email support"], false, primary, rec)}
        ${renderPlanCard("Pro", ["Unlimited scans", "Weekly monitoring", "Premium reports", "3 team members", "Email priority support"], true, primary, rec)}
        ${renderPlanCard("Business", ["Everything in Pro", "Daily monitoring", "White-label reports", "Unlimited team", "Dedicated support", "API access"], false, primary, rec)}
      </div>
      <a href="${esc(cta.ctaUrl)}" class="cta-button" style="background:${primary}">${esc(cta.ctaText || "View Plans & Pricing")} →</a>
    </div>
  </div>
</section>`;
}

function renderPlanCard(name: string, features: string[], highlighted: boolean, primary: string, rec: string): string {
  const isRec = name === rec;
  const cls = highlighted ? "plan-card plan-card-hl" : "plan-card";
  return `<div class="${cls}" ${highlighted ? `style="border-color:${primary}"` : ""}>
  ${isRec ? `<div class="plan-rec" style="background:${primary}">Recommended</div>` : ""}
  <h4 class="plan-name" ${highlighted ? `style="color:${primary}"` : ""}>${name}</h4>
  <ul class="plan-features">${features.map(f => `<li>${f}</li>`).join("")}</ul>
</div>`;
}

/* ═══════════════════════════════════════════════════════════
   CSS — design tokens + two style modes
   ═══════════════════════════════════════════════════════════ */

function buildCSS(primary: string, secondary: string, _accent: string, bg: string, dark: string, s: ReportStyle): string {
  const isCorp = s === "corporate";
  const radius = isCorp ? "4px" : "12px";
  const radiusSm = isCorp ? "2px" : "8px";
  const shadow = isCorp ? "none" : "0 1px 3px rgba(0,0,0,.04)";
  const cardBg = isCorp ? "white" : bg;
  const cardBorder = isCorp ? "1px solid #D1D5DB" : "1px solid #E5E7EB";
  const titleWeight = isCorp ? "700" : "800";
  const coverBg = isCorp ? "white" : `linear-gradient(180deg,${bg} 0%,white 100%)`;

  return `
:root{--r:${radius};--rs:${radiusSm};--shadow:${shadow};--card-bg:${cardBg};--card-border:${cardBorder};--dark:${dark};--bg:${bg};--primary:${primary}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  color:${dark};background:white;line-height:1.6;font-size:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* Page */
.page{width:210mm;min-height:297mm;padding:20mm 24mm;margin:0 auto;position:relative;page-break-after:always;page-break-inside:avoid;background:white}
@media screen{.page{box-shadow:0 4px 24px rgba(0,0,0,.08);margin-bottom:24px;border-radius:4px}}

/* Header */
.page-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #E5E7EB}
.hdr-logo{max-height:28px;max-width:140px}.hdr-logo-text{font-size:16px;font-weight:700}
.hdr-domain{font-size:11px;color:#9CA3AF}

/* Cover */
.cover-page{display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;background:${coverBg}}
.cover-corp{background:white;border-bottom:4px solid ${primary}}
.cover-top{width:100%;text-align:left}
.cover-logo{max-height:48px;max-width:200px}
.cover-logo-text{font-size:${isCorp ? "22px" : "28px"};font-weight:${titleWeight};letter-spacing:-0.5px}
.cover-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${isCorp ? "12px" : "16px"}}
.cover-title{font-size:${isCorp ? "28px" : "36px"};font-weight:${titleWeight};line-height:1.15;color:${dark};letter-spacing:-1px}
.cover-domain{font-size:${isCorp ? "15px" : "18px"};color:#6B7280;margin-top:4px}
.cover-score-wrap{margin:20px 0}
.cover-badges{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.badge{display:inline-block;padding:${isCorp ? "4px 12px" : "6px 16px"};border-radius:${isCorp ? "3px" : "20px"};font-size:12px;font-weight:600;letter-spacing:0.3px}
.badge-compliance{background:#EFF6FF;color:#1D4ED8}
.cover-bottom{width:100%;text-align:center;padding-top:16px;border-top:1px solid #E5E7EB}
.cover-date{font-size:13px;color:#9CA3AF}.cover-powered{font-size:11px;color:#D1D5DB;margin-top:4px}

/* Corporate score box */
.corp-score-box{text-align:center;padding:24px;border:${cardBorder};border-radius:var(--r)}
.corp-score-num{font-size:48px;font-weight:800;line-height:1}.corp-score-of{font-size:20px;font-weight:400;color:#9CA3AF}
.corp-score-label{font-size:13px;color:#6B7280;margin:6px 0 12px}
.corp-progress-track{height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;max-width:300px;margin:0 auto}
.corp-progress-fill{height:100%;border-radius:4px;transition:width .3s}

/* Section titles */
.section-title{font-size:${isCorp ? "20px" : "24px"};font-weight:${titleWeight};margin-bottom:20px;padding-bottom:10px;border-bottom:${isCorp ? "2px" : "3px"} solid ${primary};letter-spacing:-0.5px}
.corp-title{border-bottom-width:2px}
.subsection-title{font-size:16px;font-weight:700;margin:20px 0 12px;color:#374151}

/* Executive Summary */
.summary-status{display:grid;gap:16px;margin-bottom:24px}
.status-card{background:var(--card-bg);border-radius:var(--r);padding:20px;border:var(--card-border)}
.status-card h3{font-size:14px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.status-card p{font-size:13px;color:#4B5563;margin-bottom:4px}
.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.metric-card{background:white;border:var(--card-border);border-radius:var(--r);padding:16px;text-align:center;box-shadow:var(--shadow)}
.metric-value{font-size:28px;font-weight:800;line-height:1.1}
.metric-label{font-size:11px;color:#6B7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}

/* Corporate summary table */
.corp-summary-table{width:100%;border-collapse:collapse;margin-bottom:20px}
.corp-summary-table td{padding:10px 14px;border:1px solid #D1D5DB;font-size:13px}
.cst-label{font-weight:600;color:#374151;background:#F9FAFB;width:120px}
.corp-prose{margin-top:16px}.corp-prose h3{font-size:14px;font-weight:700;margin-bottom:6px;color:#374151}
.corp-prose p{font-size:13px;color:#4B5563;margin-bottom:6px}

/* Visual Breakdown */
.breakdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.breakdown-card{background:var(--card-bg);border-radius:var(--r);padding:20px;border:var(--card-border)}
.breakdown-card h3{font-size:14px;font-weight:700;color:#374151;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px}
.chart-center{display:flex;justify-content:center}
.progress-stack{display:flex;flex-direction:column;gap:16px;padding-top:8px}
.mt-24{margin-top:24px}
.donut-wrap{display:flex;align-items:center;gap:16px}
.legend-col{position:relative;min-width:120px;height:120px}
.legend-row{position:absolute;left:0;display:flex;align-items:center;gap:6px}
.legend-chip{width:14px;height:14px;border-radius:3px;flex-shrink:0}
.legend-label{font-size:12px;color:#374151;font-weight:500}.legend-val{font-size:12px;color:#6B7280}

.status-table{width:100%;border-collapse:collapse}
.status-table td{padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.status-table td:first-child{font-weight:600;color:#374151}
.status-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
.maturity-indicator{display:flex;gap:8px;margin-top:12px}
.maturity-step{flex:1;text-align:center;padding:12px 4px;border-radius:var(--rs);border:2px solid #E5E7EB;font-size:11px;color:#9CA3AF}
.maturity-step.active{background:var(--card-bg)}
.maturity-dot{width:12px;height:12px;border-radius:50%;margin:0 auto 6px}

/* Audit Cards (bold) */
.issues-list{display:flex;flex-direction:column;gap:16px}
.audit-card{border:var(--card-border);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);page-break-inside:avoid}
.ac-header{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--card-bg);border-bottom:var(--card-border)}
.ac-num{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;color:white;font-size:13px;font-weight:700;flex-shrink:0}
.ac-sev{padding:3px 10px;border-radius:var(--rs);font-size:10px;font-weight:700;letter-spacing:0.5px;flex-shrink:0}
.ac-title{font-size:14px;font-weight:700;color:var(--dark);flex:1}
.ac-body{padding:14px 16px}
.ac-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}
.ac-section{margin-bottom:8px}
.ac-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;font-weight:700;margin-bottom:3px}
.ac-section p{font-size:12.5px;color:#374151;line-height:1.5}
.ac-footer{display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;border-top:1px solid #F3F4F6}
.ac-chip{font-size:10px;padding:3px 8px;border-radius:var(--rs);background:#F3F4F6;color:#6B7280;font-weight:600}
.ac-chip-wcag{background:#EFF6FF;color:#1D4ED8}
.ac-tech{margin-top:8px;font-size:11px;color:#9CA3AF}
.ac-tech summary{cursor:pointer;font-weight:600}
.ac-tech code{font-family:'SF Mono',Consolas,monospace;font-size:10px;background:#F3F4F6;padding:1px 4px;border-radius:3px}

/* Findings table (corporate) */
.findings-table{width:100%;border-collapse:collapse;font-size:12px}
.findings-table th{background:#F3F4F6;padding:8px 10px;text-align:left;font-weight:700;border:1px solid #D1D5DB;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.findings-table td{padding:8px 10px;border:1px solid #D1D5DB;vertical-align:top}
.findings-table tbody tr:nth-child(even){background:#FAFAFA}
.ft-sev{font-weight:700;font-size:10px;letter-spacing:0.3px}
.ft-title{font-weight:600;max-width:140px}.ft-desc{max-width:160px;font-size:11px;color:#4B5563}.ft-num{text-align:center;white-space:nowrap}

.empty-state{text-align:center;padding:60px 20px;color:#6B7280;font-size:16px}

/* Compliance & Legal */
.legal-grid{display:flex;flex-direction:column;gap:16px}
.legal-card{background:var(--card-bg);border-radius:var(--r);padding:20px;border:var(--card-border)}
.legal-card h3{font-size:14px;font-weight:700;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px}
.legal-card p{font-size:13px;color:#4B5563;margin-bottom:8px;line-height:1.6}
.legal-card ul{margin:8px 0 0 20px;font-size:13px;color:#4B5563}.legal-card li{margin-bottom:4px}
.audit-table{width:100%;border-collapse:collapse}
.audit-table td{padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.audit-table td:first-child{font-weight:600;color:#374151;width:140px}
.audit-table code{font-family:'SF Mono',Consolas,monospace;font-size:11px;background:#F3F4F6;padding:2px 6px;border-radius:4px}

/* CTA */
.cta-page{display:flex;align-items:center;justify-content:center}
.cta-2col{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;max-width:700px;width:100%}
.cta-left h2{font-size:22px;font-weight:${titleWeight};margin-bottom:10px}
.cta-left p{font-size:13px;color:#4B5563;line-height:1.6;margin-bottom:12px}
.cta-trust,.cta-bullets{list-style:none;padding:0;margin:0 0 16px}
.cta-trust li,.cta-bullets li{font-size:12px;color:#374151;padding:4px 0;padding-left:16px;position:relative}
.cta-trust li::before,.cta-bullets li::before{content:"✓";position:absolute;left:0;color:${primary};font-weight:700}
.cta-contact{font-size:12px;color:#6B7280}.cta-contact a{color:${primary}}
.cta-right{display:flex;flex-direction:column;align-items:center;gap:12px}

/* Plan cards */
.plan-cards{display:flex;gap:10px;width:100%}
.plan-card{flex:1;border:1px solid #E5E7EB;border-radius:var(--r);padding:14px 10px;text-align:center;position:relative}
.plan-card-hl{border-width:2px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.plan-rec{position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:700;color:white;padding:2px 10px;border-radius:10px;letter-spacing:0.3px;white-space:nowrap}
.plan-name{font-size:15px;font-weight:700;margin:8px 0 6px}
.plan-features{list-style:none;padding:0;text-align:left}
.plan-features li{font-size:10px;color:#4B5563;padding:2px 0;padding-left:14px;position:relative}
.plan-features li::before{content:"•";position:absolute;left:4px;color:#9CA3AF}

.cta-button{display:inline-block;padding:12px 28px;color:white;border-radius:var(--r);font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.12)}
.cta-footer{font-size:11px;color:#D1D5DB;margin-top:16px;text-align:center}

/* Global footer */
.global-footer{text-align:center;font-size:10px;color:#D1D5DB;padding:8px 0}

@media print{
  body{background:white}
  .page{box-shadow:none;margin:0;border-radius:0;width:100%;min-height:auto;padding:15mm 20mm;page-break-after:always}
  .cta-button{border:2px solid ${primary};color:${primary}!important;background:transparent!important}
  .ac-tech{display:none}
}
`;
}
