import type { ReportData, ReportIssue, Severity } from "./types";

/** Render the complete premium report as a standalone HTML string */
export function renderReportHTML(data: ReportData): string {
  const t = data.themeConfig;
  const wl = data.whiteLabelConfig;
  const primary = wl.primaryColor || t.primaryColor;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accessibility Compliance Report — ${escHtml(data.domain)}</title>
<style>${getCSS(primary, t.secondaryColor, t.accentColor, t.backgroundColor, t.darkColor)}</style>
</head>
<body>
${renderCover(data, primary)}
${renderExecutiveSummary(data, primary)}
${renderVisualBreakdown(data, primary)}
${renderPriorityIssues(data, primary)}
${renderComplianceLegal(data, primary)}
${renderCTA(data, primary)}
</body>
</html>`;
}

/* ── Helpers ─────────────────────────────────────────────── */

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function severityColor(s: Severity): string {
  switch (s) {
    case "critical": return "#DC2626";
    case "serious": return "#EA580C";
    case "moderate": return "#D97706";
    case "minor": return "#2563EB";
  }
}

function severityBg(s: Severity): string {
  switch (s) {
    case "critical": return "#FEF2F2";
    case "serious": return "#FFF7ED";
    case "moderate": return "#FFFBEB";
    case "minor": return "#EFF6FF";
  }
}

function riskColor(r: string): string {
  switch (r) {
    case "LOW": return "#16A34A";
    case "MEDIUM": return "#D97706";
    case "HIGH": return "#EA580C";
    case "CRITICAL": return "#DC2626";
    default: return "#6B7280";
  }
}

function scoreGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

/* ── SVG Charts ──────────────────────────────────────────── */

function scoreCircleSVG(score: number, primary: string, size: number = 200): string {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const gradeColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="12"/>
    <circle cx="100" cy="100" r="${r}" fill="none" stroke="${gradeColor}" stroke-width="12"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
      stroke-linecap="round" transform="rotate(-90 100 100)"/>
    <text x="100" y="90" text-anchor="middle" font-size="48" font-weight="800" fill="${gradeColor}">${score}</text>
    <text x="100" y="115" text-anchor="middle" font-size="14" fill="#6B7280">out of 100</text>
    <text x="100" y="140" text-anchor="middle" font-size="18" font-weight="700" fill="${gradeColor}">Grade ${scoreGrade(score)}</text>
  </svg>`;
}

function donutChartSVG(breakdown: { critical: number; serious: number; moderate: number; minor: number }): string {
  const total = breakdown.critical + breakdown.serious + breakdown.moderate + breakdown.minor || 1;
  const segments: { value: number; color: string; label: string }[] = [
    { value: breakdown.critical, color: "#DC2626", label: "Critical" },
    { value: breakdown.serious, color: "#EA580C", label: "Serious" },
    { value: breakdown.moderate, color: "#D97706", label: "Moderate" },
    { value: breakdown.minor, color: "#2563EB", label: "Minor" },
  ];

  const r = 70;
  const circ = 2 * Math.PI * r;
  let cumOffset = 0;
  let paths = "";

  for (const seg of segments) {
    if (seg.value === 0) continue;
    const pct = seg.value / total;
    const dashLen = pct * circ;
    paths += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${seg.color}" stroke-width="28"
      stroke-dasharray="${dashLen} ${circ - dashLen}" stroke-dashoffset="${-cumOffset}"
      transform="rotate(-90 100 100)"/>`;
    cumOffset += dashLen;
  }

  let legend = "";
  let ly = 20;
  for (const seg of segments) {
    legend += `<g transform="translate(210, ${ly})">
      <rect width="12" height="12" rx="2" fill="${seg.color}"/>
      <text x="18" y="11" font-size="12" fill="#374151">${seg.label}: ${seg.value}</text>
    </g>`;
    ly += 22;
  }

  return `<svg width="360" height="200" viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg">
    ${paths}
    <circle cx="100" cy="100" r="50" fill="white"/>
    <text x="100" y="96" text-anchor="middle" font-size="28" font-weight="700" fill="#1E1E1E">${total}</text>
    <text x="100" y="116" text-anchor="middle" font-size="11" fill="#6B7280">Total Issues</text>
    ${legend}
  </svg>`;
}

function progressBarSVG(label: string, pct: number, color: string, width: number = 300): string {
  const barW = width - 80;
  const fillW = Math.round((pct / 100) * barW);
  return `<svg width="${width}" height="32" viewBox="0 0 ${width} 32" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="20" font-size="12" fill="#374151">${escHtml(label)}</text>
    <rect x="80" y="8" width="${barW}" height="16" rx="8" fill="#E5E7EB"/>
    <rect x="80" y="8" width="${fillW}" height="16" rx="8" fill="${color}"/>
    <text x="${80 + barW + 6}" y="21" font-size="12" font-weight="600" fill="${color}">${pct}%</text>
  </svg>`;
}

/* ── Page Renderers ──────────────────────────────────────── */

function renderCover(d: ReportData, primary: string): string {
  const logo = d.whiteLabelConfig.logoUrl
    ? `<img src="${escHtml(d.whiteLabelConfig.logoUrl)}" alt="${escHtml(d.companyName)}" class="cover-logo"/>`
    : `<div class="cover-logo-text" style="color:${primary}">${escHtml(d.companyName)}</div>`;

  return `<section class="page cover-page">
  <div class="cover-top">
    ${logo}
  </div>
  <div class="cover-center">
    <h1 class="cover-title">Accessibility<br/>Compliance Report</h1>
    <p class="cover-domain">${escHtml(d.domain)}</p>
    <div class="cover-score-wrap">
      ${scoreCircleSVG(d.score, primary, 220)}
    </div>
    <div class="cover-badges">
      <span class="badge badge-compliance">${escHtml(d.complianceLevel)}</span>
      <span class="badge" style="background:${d.eaaReady ? "#DCFCE7" : "#FEF9C3"};color:${d.eaaReady ? "#166534" : "#854D0E"}">
        EAA 2025 ${d.eaaReady ? "Ready" : "Action Needed"}
      </span>
      <span class="badge" style="background:${severityBg(d.riskLevel === "LOW" ? "minor" : d.riskLevel === "MEDIUM" ? "moderate" : "critical")};color:${riskColor(d.riskLevel)}">
        Risk: ${d.riskLevel}
      </span>
    </div>
  </div>
  <div class="cover-bottom">
    <p class="cover-date">Report generated ${fmtDate(d.scanDate)}</p>
    ${d.whiteLabelConfig.showVexNexaBranding ? `<p class="cover-powered">Powered by VexNexa</p>` : ""}
  </div>
</section>`;
}

function renderExecutiveSummary(d: ReportData, primary: string): string {
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

  return `<section class="page">
  <h2 class="section-title" style="border-color:${primary}">Executive Summary</h2>
  <div class="summary-status">
    <div class="status-card">
      <h3>Accessibility Status</h3>
      <p>Your website <strong>${escHtml(d.domain)}</strong> achieved an accessibility score of
      <strong style="color:${primary}">${d.score}/100</strong> (Grade ${scoreGrade(d.score)}).
      ${d.issueBreakdown.critical > 0
        ? `There are <strong style="color:#DC2626">${d.issueBreakdown.critical} critical issues</strong> requiring immediate attention.`
        : "No critical issues were detected."
      }</p>
    </div>
    <div class="status-card">
      <h3>Legal Risk Assessment</h3>
      <p style="color:${riskColor(d.riskLevel)};font-weight:600">${d.riskLevel} Risk</p>
      <p>${escHtml(d.legalRisk)}</p>
    </div>
    <div class="status-card">
      <h3>Estimated Remediation</h3>
      <p>Based on ${d.issueBreakdown.total} identified issues, the estimated developer effort is
      <strong style="color:#7C3AED">${escHtml(d.estimatedFixTime)}</strong>.</p>
    </div>
  </div>
  <h3 class="subsection-title">Key Metrics</h3>
  <div class="metrics-grid">
    ${metrics.map((m) => `
      <div class="metric-card">
        <div class="metric-value" style="color:${m.color}">${m.value}</div>
        <div class="metric-label">${m.label}</div>
      </div>
    `).join("")}
  </div>
</section>`;
}

function renderVisualBreakdown(d: ReportData, primary: string): string {
  const wcagAAColor = d.wcagAAStatus === "pass" ? "#16A34A" : d.wcagAAStatus === "partial" ? "#D97706" : "#DC2626";
  const wcagAAAColor = d.wcagAAAStatus === "pass" ? "#16A34A" : d.wcagAAAStatus === "partial" ? "#D97706" : "#DC2626";

  return `<section class="page">
  <h2 class="section-title" style="border-color:${primary}">Visual Breakdown</h2>
  <div class="breakdown-grid">
    <div class="breakdown-card">
      <h3>Severity Distribution</h3>
      <div class="chart-center">
        ${donutChartSVG(d.issueBreakdown)}
      </div>
    </div>
    <div class="breakdown-card">
      <h3>Compliance Progress</h3>
      <div class="progress-stack">
        ${progressBarSVG("WCAG AA", d.compliancePercentage, wcagAAColor)}
        ${progressBarSVG("WCAG AAA", Math.round(d.compliancePercentage * 0.7), wcagAAAColor)}
        ${progressBarSVG("Score", d.score, primary)}
      </div>
    </div>
  </div>
  <div class="breakdown-grid mt-24">
    <div class="breakdown-card">
      <h3>WCAG Level Status</h3>
      <table class="status-table">
        <tr>
          <td>WCAG 2.1 Level AA</td>
          <td><span class="status-dot" style="background:${wcagAAColor}"></span>
            ${d.wcagAAStatus === "pass" ? "Compliant" : d.wcagAAStatus === "partial" ? "Partial" : "Non-compliant"}</td>
        </tr>
        <tr>
          <td>WCAG 2.1 Level AAA</td>
          <td><span class="status-dot" style="background:${wcagAAAColor}"></span>
            ${d.wcagAAAStatus === "pass" ? "Compliant" : d.wcagAAAStatus === "partial" ? "Partial" : "Non-compliant"}</td>
        </tr>
        <tr>
          <td>EAA 2025 Readiness</td>
          <td><span class="status-dot" style="background:${d.eaaReady ? "#16A34A" : "#D97706"}"></span>
            ${d.eaaReady ? "Ready" : "Action Needed"}</td>
        </tr>
      </table>
    </div>
    <div class="breakdown-card">
      <h3>Accessibility Maturity</h3>
      <div class="maturity-indicator">
        ${(["Basic", "Structured", "Proactive", "Continuous"] as const).map((level) => {
          const active = level === d.maturityLevel;
          const idx = ["Basic", "Structured", "Proactive", "Continuous"].indexOf(level);
          const currentIdx = ["Basic", "Structured", "Proactive", "Continuous"].indexOf(d.maturityLevel);
          const reached = idx <= currentIdx;
          return `<div class="maturity-step ${active ? "active" : ""}" style="${reached ? `border-color:${primary};` : ""}">
            <div class="maturity-dot" style="background:${reached ? primary : "#D1D5DB"}"></div>
            <span style="${reached ? `color:${primary};font-weight:600` : ""}">${level}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>
</section>`;
}

function renderPriorityIssues(d: ReportData, primary: string): string {
  if (d.priorityIssues.length === 0) {
    return `<section class="page">
      <h2 class="section-title" style="border-color:${primary}">Priority Issues</h2>
      <div class="empty-state">
        <p>No accessibility issues were detected. Excellent work!</p>
      </div>
    </section>`;
  }

  // Split issues across pages (max 4 per page)
  const pages: ReportIssue[][] = [];
  for (let i = 0; i < d.priorityIssues.length; i += 4) {
    pages.push(d.priorityIssues.slice(i, i + 4));
  }

  return pages.map((pageIssues, pageIdx) => `
<section class="page">
  ${pageIdx === 0 ? `<h2 class="section-title" style="border-color:${primary}">Priority Issues</h2>` : `<h2 class="section-title" style="border-color:${primary}">Priority Issues (continued)</h2>`}
  <div class="issues-list">
    ${pageIssues.map((issue, i) => renderIssueCard(issue, pageIdx * 4 + i + 1, primary)).join("")}
  </div>
</section>`).join("");
}

function renderIssueCard(issue: ReportIssue, num: number, primary: string): string {
  return `<div class="issue-card">
  <div class="issue-header">
    <span class="issue-num" style="background:${primary}">#${num}</span>
    <span class="severity-badge" style="background:${severityBg(issue.severity)};color:${severityColor(issue.severity)}">
      ${issue.severity.toUpperCase()}
    </span>
    <h4 class="issue-title">${escHtml(issue.title)}</h4>
  </div>
  <div class="issue-body">
    <div class="issue-row">
      <strong>What's happening:</strong>
      <p>${escHtml(issue.explanation)}</p>
    </div>
    <div class="issue-row">
      <strong>Business impact:</strong>
      <p>${escHtml(issue.impact)}</p>
    </div>
    <div class="issue-row">
      <strong>Recommended fix:</strong>
      <p>${escHtml(issue.recommendation)}</p>
    </div>
    <div class="issue-meta">
      <span>${issue.affectedElements} element${issue.affectedElements !== 1 ? "s" : ""} affected</span>
      <span>Est. ${escHtml(issue.estimatedFixTime)}</span>
      ${issue.wcagCriteria.length > 0 ? `<span>${issue.wcagCriteria.join(", ")}</span>` : ""}
    </div>
  </div>
</div>`;
}

function renderComplianceLegal(d: ReportData, primary: string): string {
  return `<section class="page">
  <h2 class="section-title" style="border-color:${primary}">Compliance &amp; Legal</h2>
  <div class="legal-grid">
    <div class="legal-card">
      <h3>European Accessibility Act (EAA) 2025</h3>
      <p>The European Accessibility Act requires digital products and services to be accessible by June 28, 2025.
      Non-compliance may result in fines, market restrictions, and reputational damage across EU member states.</p>
      <p><strong>Your status:</strong>
        <span style="color:${d.eaaReady ? "#16A34A" : "#D97706"};font-weight:600">
          ${d.eaaReady ? "Your site meets the baseline requirements for EAA compliance." : "Your site requires remediation to meet EAA requirements."}
        </span>
      </p>
    </div>
    <div class="legal-card">
      <h3>Continuous Monitoring Recommendation</h3>
      <p>Accessibility is not a one-time fix. Content changes, new features, and third-party integrations can
      introduce new barriers. We recommend:</p>
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
        <tr><td>Scan ID</td><td><code>${escHtml(d.scanId)}</code></td></tr>
        <tr><td>Scan Date</td><td>${fmtDate(d.scanDate)}</td></tr>
        <tr><td>Engine</td><td>${escHtml(d.engineName)} v${escHtml(d.engineVersion)}</td></tr>
        <tr><td>Standard</td><td>${escHtml(d.complianceLevel)}</td></tr>
        <tr><td>Domain</td><td>${escHtml(d.domain)}</td></tr>
        <tr><td>Pages Scanned</td><td>${d.pagesScanned ?? 1}</td></tr>
      </table>
    </div>
  </div>
</section>`;
}

function renderCTA(d: ReportData, primary: string): string {
  if (!d.whiteLabelConfig.showVexNexaBranding) {
    // White-label: minimal footer
    return `<section class="page cta-page">
  <div class="cta-center">
    <h2>Next Steps</h2>
    <p>Contact your accessibility partner to discuss remediation priorities and continuous monitoring options.</p>
    <p class="cta-footer">${escHtml(d.whiteLabelConfig.footerText)}</p>
  </div>
</section>`;
  }

  return `<section class="page cta-page">
  <div class="cta-center">
    <h2 style="color:${primary}">Upgrade to Continuous Monitoring</h2>
    <p>Don't let accessibility regressions slip through. VexNexa provides automated scanning, alerting, and compliance tracking.</p>
    <table class="plan-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th>Free</th>
          <th style="background:${primary};color:white">Pro</th>
          <th>Business</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Manual Scans</td><td>5/month</td><td>Unlimited</td><td>Unlimited</td></tr>
        <tr><td>Automated Monitoring</td><td>—</td><td>Weekly</td><td>Daily</td></tr>
        <tr><td>PDF Reports</td><td>Basic</td><td>Premium</td><td>White-label</td></tr>
        <tr><td>WCAG Compliance Tracking</td><td>—</td><td>✓</td><td>✓</td></tr>
        <tr><td>Team Collaboration</td><td>—</td><td>3 users</td><td>Unlimited</td></tr>
        <tr><td>Priority Support</td><td>—</td><td>Email</td><td>Dedicated</td></tr>
        <tr><td>API Access</td><td>—</td><td>—</td><td>✓</td></tr>
      </tbody>
    </table>
    <a href="https://www.vexnexa.com/pricing" class="cta-button" style="background:${primary}">
      View Plans &amp; Pricing →
    </a>
    <p class="cta-footer">${escHtml(d.whiteLabelConfig.footerText)}</p>
  </div>
</section>`;
}

/* ── CSS ─────────────────────────────────────────────────── */

function getCSS(primary: string, secondary: string, accent: string, bg: string, dark: string): string {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  color:${dark};background:white;line-height:1.6;font-size:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.page{width:210mm;min-height:297mm;padding:20mm 24mm;margin:0 auto;position:relative;page-break-after:always;background:white}
@media screen{.page{box-shadow:0 4px 24px rgba(0,0,0,.08);margin-bottom:24px;border-radius:4px}}

/* Cover */
.cover-page{display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;
  background:linear-gradient(180deg,${bg} 0%,white 100%)}
.cover-top{width:100%;text-align:left}
.cover-logo{max-height:48px;max-width:200px}
.cover-logo-text{font-size:28px;font-weight:800;letter-spacing:-0.5px}
.cover-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.cover-title{font-size:36px;font-weight:800;line-height:1.15;color:${dark};letter-spacing:-1px}
.cover-domain{font-size:18px;color:#6B7280;margin-top:4px}
.cover-score-wrap{margin:20px 0}
.cover-badges{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.3px}
.badge-compliance{background:#EFF6FF;color:#1D4ED8}
.cover-bottom{width:100%;text-align:center;padding-top:16px;border-top:1px solid #E5E7EB}
.cover-date{font-size:13px;color:#9CA3AF}
.cover-powered{font-size:11px;color:#D1D5DB;margin-top:4px}

/* Section titles */
.section-title{font-size:24px;font-weight:800;margin-bottom:20px;padding-bottom:10px;border-bottom:3px solid ${primary};letter-spacing:-0.5px}
.subsection-title{font-size:16px;font-weight:700;margin:20px 0 12px;color:#374151}

/* Executive Summary */
.summary-status{display:grid;gap:16px;margin-bottom:24px}
.status-card{background:${bg};border-radius:12px;padding:20px;border:1px solid #E5E7EB}
.status-card h3{font-size:14px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.status-card p{font-size:13px;color:#4B5563;margin-bottom:4px}

.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.metric-card{background:white;border:1px solid #E5E7EB;border-radius:12px;padding:16px;text-align:center;
  box-shadow:0 1px 3px rgba(0,0,0,.04)}
.metric-value{font-size:28px;font-weight:800;line-height:1.1}
.metric-label{font-size:11px;color:#6B7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}

/* Visual Breakdown */
.breakdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.breakdown-card{background:${bg};border-radius:12px;padding:20px;border:1px solid #E5E7EB}
.breakdown-card h3{font-size:14px;font-weight:700;color:#374151;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px}
.chart-center{display:flex;justify-content:center}
.progress-stack{display:flex;flex-direction:column;gap:16px;padding-top:8px}
.mt-24{margin-top:24px}

.status-table{width:100%;border-collapse:collapse}
.status-table td{padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.status-table td:first-child{font-weight:600;color:#374151}
.status-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}

.maturity-indicator{display:flex;gap:8px;margin-top:12px}
.maturity-step{flex:1;text-align:center;padding:12px 4px;border-radius:8px;border:2px solid #E5E7EB;font-size:11px;color:#9CA3AF}
.maturity-step.active{background:${bg}}
.maturity-dot{width:12px;height:12px;border-radius:50%;margin:0 auto 6px}

/* Priority Issues */
.issues-list{display:flex;flex-direction:column;gap:16px}
.issue-card{border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.issue-header{display:flex;align-items:center;gap:10px;padding:12px 16px;background:${bg};border-bottom:1px solid #E5E7EB}
.issue-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;
  color:white;font-size:12px;font-weight:700;flex-shrink:0}
.severity-badge{padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:0.5px;flex-shrink:0}
.issue-title{font-size:14px;font-weight:700;color:${dark};flex:1}
.issue-body{padding:14px 16px}
.issue-row{margin-bottom:10px}
.issue-row strong{font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#6B7280;display:block;margin-bottom:2px}
.issue-row p{font-size:12.5px;color:#374151;line-height:1.5}
.issue-meta{display:flex;gap:16px;padding-top:10px;border-top:1px solid #F3F4F6;font-size:11px;color:#9CA3AF}

.empty-state{text-align:center;padding:60px 20px;color:#6B7280;font-size:16px}

/* Compliance & Legal */
.legal-grid{display:flex;flex-direction:column;gap:16px}
.legal-card{background:${bg};border-radius:12px;padding:20px;border:1px solid #E5E7EB}
.legal-card h3{font-size:14px;font-weight:700;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px}
.legal-card p{font-size:13px;color:#4B5563;margin-bottom:8px;line-height:1.6}
.legal-card ul{margin:8px 0 0 20px;font-size:13px;color:#4B5563}
.legal-card li{margin-bottom:4px}
.audit-table{width:100%;border-collapse:collapse}
.audit-table td{padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.audit-table td:first-child{font-weight:600;color:#374151;width:140px}
.audit-table code{font-family:'SF Mono',Consolas,monospace;font-size:11px;background:#F3F4F6;padding:2px 6px;border-radius:4px}

/* CTA */
.cta-page{display:flex;align-items:center;justify-content:center}
.cta-center{text-align:center;max-width:600px}
.cta-center h2{font-size:28px;font-weight:800;margin-bottom:12px}
.cta-center p{font-size:14px;color:#4B5563;margin-bottom:20px;line-height:1.6}
.cta-button{display:inline-block;padding:14px 36px;color:white;border-radius:12px;font-size:16px;font-weight:700;
  text-decoration:none;margin:20px 0;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.cta-footer{font-size:11px;color:#D1D5DB;margin-top:24px}

.plan-table{width:100%;border-collapse:collapse;margin:16px 0;text-align:center;font-size:13px}
.plan-table th,.plan-table td{padding:10px 12px;border:1px solid #E5E7EB}
.plan-table th{font-weight:700;background:#F9FAFB}
.plan-table td:first-child{text-align:left;font-weight:600}
.plan-table tbody tr:nth-child(even){background:#FAFAFA}

@media print{
  body{background:white}
  .page{box-shadow:none;margin:0;border-radius:0;width:100%;min-height:auto;padding:15mm 20mm}
  .cta-button{border:2px solid ${primary};color:${primary}!important;background:transparent!important}
}
`;
}
