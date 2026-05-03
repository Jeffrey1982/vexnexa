import type { ReportData, ReportIssue, Severity, ReportStyle, WcagMatrixRow, TopPriorityFix } from "./types";
import { validateHex, validateImageUrl } from "./resolve-white-label";
import {
  EAA_IMPORTANT_NOTE_BODY,
  EAA_IMPORTANT_NOTE_TITLE,
  EAA_LEARN_MORE_LABEL,
  EAA_LEARN_MORE_URL,
  EAA_LEGAL_NOTICE_SHORT,
  EAA_READINESS_INTRO,
  EAA_RECOMMENDATION_CLOSING,
  EAA_SCAN_COVERS_BODY,
  EAA_SCAN_COVERS_HEADING,
  EAA_STANDARDS_BODY,
  EAA_STANDARDS_HEADING,
  formatEaaContextLine,
} from "./eaa-readiness-copy";

/* ═══════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════ */

export function renderReportHTML(data: ReportData): string {
  const t = data.themeConfig;
  const wl = data.whiteLabelConfig;
  /** Query / DB white-label primary, optional export-time `reportBranding.primaryColor` override */
  const primary =
    validateHex(data.reportBranding?.primaryColor) || wl.primaryColor || t.primaryColor;
  const s: ReportStyle = data.reportStyle === "corporate" ? "corporate" : "premium";
  const brandName = data.reportBranding?.companyName || wl.companyNameOverride || "VexNexa";

  // Determine if report is "long" and needs a TOC
  const totalElements = data.priorityIssues.reduce((sum, i) => sum + (i.affectedElementDetails?.length ?? 0), 0);
  const isLong = data.priorityIssues.length >= 20 || totalElements >= 200;

  const credit = reportFooterCredit(data);

  return `<!DOCTYPE html>
<html lang="${esc(data.labels.locale)}" data-style="${s}" data-report-version="v3">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(data.labels.reportTitle)} - ${esc(data.domain)}</title>
${data.faviconUrl ? `<link rel="icon" href="${esc(data.faviconUrl)}" />` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
<style>${buildCSS(primary, t.secondaryColor, t.accentColor, t.backgroundColor, t.darkColor, s)}</style>
</head>
<body class="style-${s}">
<div class="running-header" aria-hidden="true"><span class="rh-left">${esc(data.domain)}</span><span class="rh-right">${fmtDate(data.scanDate, data.labels.locale)}</span></div>
<div class="running-footer" aria-hidden="true"><span class="rf-left">${esc(data.labels.generatedBy)} ${esc(brandName)}</span><span class="rf-center">${esc(data.labels.reportVersion)} � ${esc(credit)}</span><span class="rf-right"></span></div>
${renderCover(data, primary, s)}
${isLong ? renderTOC(data, primary, s) : ""}
${renderExecutiveSummary(data, primary, s)}
${renderAiVisionAudit(data, primary, s)}
${renderVisualBreakdown(data, primary, s)}
${renderPerformanceParadox(data, primary, s)}
${renderWcagMatrix(data, primary, s)}
${renderPriorityIssues(data, primary, s)}
${renderEAAReadinessSection(data, primary, s)}
${renderScanConfiguration(data, primary, s)}
${renderComplianceLegal(data, primary, s)}
${renderCTA(data, primary, s)}
<div class="version-marker" data-report-version="v3">Report v3 | ${s} | ${esc(data.scanId)}</div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════ */

/** VexNexa report brand — PDF/HTML (matches product guidelines) */
const BRAND_NAVY = "#1e3a8a";
const BRAND_MINT = "#0d9488";
const GOLD = "#D97706";

function esc(s: string | undefined | null): string {
  const v = s ?? "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Footer credit — white-label: engine only (no “Branded by VexNexa” in PDF) */
function reportFooterCredit(_d: ReportData): string {
  return _d.labels.poweredByAxeCore;
}
function fmtDate(iso: string, locale = "en"): string {
  const dateLocale = locale === "nl" ? "nl-NL" : locale === "fr" ? "fr-FR" : "en-GB";
  try { return new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}
function sevClr(sv: Severity): string {
  return ({ critical: "#DC2626", serious: "#F97316", moderate: "#FACC15", minor: "#9CA3AF" })[sv];
}
function sevBg(sv: Severity): string {
  return ({ critical: "#FEF2F2", serious: "#FFF7ED", moderate: "#FFFBEB", minor: "#F0FDFA" })[sv];
}
function riskClr(r: string): string {
  return ({ Low: "#16A34A", Moderate: "#D97706", High: "#EA580C", Critical: "#DC2626" })[r] ?? "#6B7280";
}
function grade(s: number): string {
  if (s >= 90) return "A"; if (s >= 80) return "B"; if (s >= 70) return "C"; if (s >= 50) return "D"; return "F";
}
function ratingLabel(s: number): string {
  if (s >= 90) return "Excellent"; if (s >= 80) return "Good"; if (s >= 70) return "Fair"; if (s >= 50) return "Needs Work"; return "Poor";
}
function ratingLabelFor(d: ReportData, s: number): string {
  if (s >= 90) return d.labels.ratingExcellent;
  if (s >= 80) return d.labels.ratingGood;
  if (s >= 70) return d.labels.ratingFair;
  if (s >= 50) return d.labels.ratingNeedsWork;
  return d.labels.ratingPoor;
}
function severityLabel(d: ReportData, sv: Severity): string {
  return ({
    critical: d.labels.critical,
    serious: d.labels.serious,
    moderate: d.labels.moderate,
    minor: d.labels.minor,
  })[sv];
}
function riskLabel(d: ReportData, risk: string): string {
  return ({
    Low: d.labels.ratingGood,
    Moderate: d.labels.moderate,
    High: d.labels.serious,
    Critical: d.labels.critical,
  })[risk] ?? risk;
}
function wcagStatusLabel(d: ReportData, status: WcagMatrixRow["status"]): string {
  return ({
    Pass: d.labels.pass,
    Fail: d.labels.fail,
    "Needs Manual Review": d.labels.needsManualReview,
    "Not Tested": d.labels.notTested,
  })[status];
}
function complianceStatusLabel(d: ReportData, status: ReportData["wcagAAStatus"]): string {
  if (status === "pass") return d.labels.statusCompliant;
  if (status === "partial") return d.labels.statusPartial;
  return d.labels.statusNonCompliant;
}
function readinessLabel(d: ReportData): string {
  if (d.eaaReady) return d.labels.locale === "fr" ? "Pret" : d.labels.locale === "nl" ? "Gereed" : "Ready";
  return d.labels.needsWork;
}
function healthScoreMicrocopy(d: ReportData): string {
  if (d.labels.locale === "nl") return "De gezondheidsscore weerspiegelt het aantal en de ernst van de gedetecteerde problemen.";
  if (d.labels.locale === "fr") return "Le score de sante reflete le nombre et la gravite des problemes detectes.";
  return "Health Score reflects the number and severity of detected issues.";
}
function corp(s: ReportStyle): boolean { return s === "corporate"; }
function fmtBytes(bytes: number): string {
  if (!bytes) return "0 MB";
  const mb = bytes / 1024 / 1024;
  return `${mb >= 1 ? mb.toFixed(1) : (bytes / 1024).toFixed(0)} ${mb >= 1 ? "MB" : "KB"}`;
}
function visualLoadMs(ms: number | undefined | null): number {
  return Number.isFinite(ms) && Number(ms) > 0 ? Number(ms) : 1500;
}
function fmtMs(ms: number): string {
  return `${(visualLoadMs(ms) / 1000).toFixed(1)}s`;
}
function vniBand(score: number): number {
  return Math.min(100, Math.max(0, (score / 2500) * 100));
}
function vniBadge(d: ReportData): string {
  if (!d.vni) return "";
  const stars = "★★★★★".slice(0, d.vni.stars);
  return `<div class="vni-badge">
    <div class="vni-copy">
      <div class="vni-label">${esc(d.labels.vniRank)} <span>${d.vni.score} ${esc(d.labels.outOf2500)}</span></div>
      <div class="vni-tier">${esc(d.vni.tier)} <span class="vni-stars">${stars}</span></div>
    </div>
  </div>`;
}

function sevChip(sv: Severity, d?: ReportData): string {
  const label = d ? severityLabel(d, sv) : sv;
  return `<span class="sev-chip sev-${sv}" style="background:${sevBg(sv)};color:${sevClr(sv)}">${esc(label).toUpperCase()}</span>`;
}
function riskBar(level: string, primary: string): string {
  const pct: Record<string, number> = { Low: 25, Moderate: 50, High: 75, Critical: 100 };
  const w = pct[level] ?? 50;
  return `<div class="risk-bar-track"><div class="risk-bar-fill" style="width:${w}%;background:${riskClr(level)}"></div></div>`;
}

function pageSection(title: string, primary: string, s: ReportStyle, body: string, anchorId?: string): string {
  const cls = corp(s) ? "section-title corp-title" : "section-title";
  const idAttr = anchorId ? ` id="${anchorId}"` : "";
  return `<section class="page"${idAttr}>
  <h2 class="${cls}" style="border-color:${primary}">${title}</h2>
  ${body}
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   Table of Contents (for long reports)
   ═══════════════════════════════════════════════════════════ */

function renderTOC(d: ReportData, primary: string, s: ReportStyle): string {
  const cls = corp(s) ? "section-title corp-title" : "section-title";
  const entries: { label: string; anchor: string; level: number }[] = [
    { label: d.labels.executiveSummary, anchor: "exec-summary", level: 2 },
    { label: d.labels.visualBreakdown, anchor: "visual-breakdown", level: 2 },
  ];
  if (d.wcagMatrix && d.wcagMatrix.length > 0) {
    entries.push({ label: d.labels.wcagComplianceMatrix, anchor: "wcag-matrix", level: 2 });
  }
  entries.push({ label: d.labels.auditFindings, anchor: "findings-index", level: 2 });
  d.priorityIssues.forEach((iss, i) => {
    entries.push({ label: `#${i + 1} ${iss.title}`, anchor: `finding-${iss.id}`, level: 3 });
  });
  entries.push({ label: d.labels.eaaReadiness, anchor: "eaa-readiness", level: 2 });
  entries.push({ label: d.labels.scanConfiguration, anchor: "scan-config", level: 2 });
  entries.push({ label: d.labels.complianceLegal, anchor: "appendix", level: 2 });

  return `<section class="page" id="toc">
  <h2 class="${cls}" style="border-color:${primary}">${esc(d.labels.tableOfContents)}</h2>
  <nav class="toc-nav">
    ${entries.map(e => `<a href="#${e.anchor}" class="toc-entry toc-level-${e.level}">${e.label}</a>`).join("\n    ")}
  </nav>
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   SVG Charts
   ═══════════════════════════════════════════════════════════ */

/** Score ring: gradient uses white-label `primary` → navy by default */
function scoreRingSVG(score: number, gradientStart: string, gradientEnd: string): string {
  const r = 100;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const gc = score >= 80 ? "#0f766e" : score >= 60 ? "#b45309" : "#b91c1c";
  const gradId = "vn-score-grad";
  return `<svg class="score-ring-svg" width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Health score ${score} out of 100, grade ${grade(score)}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${esc(gradientStart)}"/>
      <stop offset="100%" stop-color="${esc(gradientEnd)}"/>
    </linearGradient>
    <filter id="vn-score-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="130" cy="130" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="18"/>
  <circle cx="130" cy="130" r="${r}" fill="none" stroke="url(#${gradId})" stroke-width="18"
    stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 130 130)" filter="url(#vn-score-glow)"/>
  <text x="130" y="118" text-anchor="middle" font-size="56" font-weight="900" fill="${BRAND_NAVY}" font-family="Inter,system-ui,sans-serif">${score}</text>
  <text x="130" y="142" text-anchor="middle" font-size="14" fill="#64748B" font-weight="500" font-family="Inter,system-ui,sans-serif">out of 100</text>
  <text x="130" y="174" text-anchor="middle" font-size="20" font-weight="800" fill="${gc}" font-family="Inter,system-ui,sans-serif">Grade ${grade(score)}</text>
</svg>`;
}

function donutChart(bk: { critical: number; serious: number; moderate: number; minor: number }, s: ReportStyle, d: ReportData): string {
  const total = bk.critical + bk.serious + bk.moderate + bk.minor || 1;
  const segs: { v: number; c: string; l: string }[] = [
    { v: bk.critical, c: "#DC2626", l: d.labels.critical },
    { v: bk.serious, c: "#F97316", l: d.labels.serious },
    { v: bk.moderate, c: "#FACC15", l: d.labels.moderate },
    { v: bk.minor, c: "#9CA3AF", l: d.labels.minor },
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
    <text x="100" y="114" text-anchor="middle" font-size="11" fill="#6B7280">${esc(d.labels.totalIssues)}</text>
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
  const logoUrl =
    validateImageUrl(d.reportBranding?.logoUrl) || validateImageUrl(d.whiteLabelConfig.logoUrl);
  const displayName = (d.reportBranding?.companyName || d.companyName || "").trim();
  const headerTitle = displayName || d.domain;
  const hasLogo = !!logoUrl;
  const hasName = displayName.length > 0;
  const nameColor = isDark ? "white" : primary;
  const logoAlt = displayName || d.domain;

  const logoEl = hasLogo
    ? `<img src="${esc(logoUrl)}" alt="${esc(logoAlt)}" class="brand-logo"/>`
    : hasName
      ? `<div class="brand-monogram" style="background:${primary}">${esc(displayName).charAt(0).toUpperCase()}</div>`
      : `<div class="brand-monogram" style="background:${primary}">${esc(d.domain).charAt(0).toUpperCase()}</div>`;

  const nameEl = `<h3 class="brand-name" style="color:${nameColor}">${esc(headerTitle)}</h3>`;

  return `<div class="brand-block">
    ${logoEl}
    <div class="brand-text">
      ${nameEl}
    </div>
  </div>`;
}

function renderCover(d: ReportData, primary: string, s: ReportStyle): string {
  // Use canonical healthScore — single source of truth (same as exec summary)
  const hs = d.healthScore;
  const gc = hs.value >= 80 ? "#16A34A" : hs.value >= 60 ? "#D97706" : "#DC2626";
  const isDark = !corp(s);

  const pagesAnalyzed = d.pagesScanned ?? d.scanConfig?.pagesAnalyzed ?? 1;

  if (corp(s)) {
    return `<section class="page cover-page cover-corp">
  <header class="report-header">
    ${renderBrandBlock(d, primary, false)}
    <div class="header-meta">
      <span class="header-style-tag" style="border-color:${primary};color:${primary}">${esc(d.labels.complianceReport)}</span>
    </div>
  </header>
  <div class="header-divider" style="background:${primary}"></div>
  <div class="cover-main">
    <div class="cover-main-left">
      <div class="cover-audit-label">${esc(d.labels.automatedAccessibilityAudit)}</div>
      <h1 class="cover-title-corp">${esc(d.labels.reportTitleLine1)}<br/>${esc(d.labels.reportTitleLine2)}</h1>
      <div class="cover-domain-block">
        <span class="cover-domain-label">${esc(d.labels.scannedDomain)}</span>
        <span class="cover-domain-value" style="color:${primary}">${esc(d.domain)}</span>
      </div>
      <div class="cover-meta-grid">
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.standard)}</span><span class="cover-meta-value" style="color:#16A34A">${esc(d.complianceLevel)}</span></div>
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.riskLevel)}</span><span class="cover-meta-value" style="color:${riskClr(d.riskLevel)}">${esc(riskLabel(d, d.riskLevel))}</span></div>
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.scanDate)}</span><span class="cover-meta-value">${fmtDate(d.scanDate)}</span></div>
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.pagesAnalyzed)}</span><span class="cover-meta-value">${pagesAnalyzed}</span></div>
      </div>
      <div class="cover-info-line">${d.issueBreakdown.total} issue${d.issueBreakdown.total !== 1 ? "s" : ""} detected across ${pagesAnalyzed} page${pagesAnalyzed !== 1 ? "s" : ""}</div>
      <div class="cover-severity-bar"><span class="csb-item"><span class="csb-count" style="color:#DC2626">${d.issueBreakdown.critical}</span> Critical</span><span class="csb-sep">•</span><span class="csb-item"><span class="csb-count" style="color:#EA580C">${d.issueBreakdown.serious}</span> Serious</span><span class="csb-sep">•</span><span class="csb-item"><span class="csb-count" style="color:#D97706">${d.issueBreakdown.moderate}</span> Moderate</span><span class="csb-sep">•</span><span class="csb-item"><span class="csb-count" style="color:#6B7280">${d.issueBreakdown.minor}</span> Minor</span></div>
    </div>
    <div class="cover-main-right">
      <div class="cover-score-card-corp">
        ${d.vni ? vniBadge(d) : `<div class="csc-score" style="color:${gc}">${hs.value}</div><div class="csc-of">/100</div>`}
        <div class="csc-grade">${d.vni ? esc(d.labels.vniIndex) : `${esc(d.labels.grade)} ${hs.grade} &mdash; ${esc(ratingLabelFor(d, hs.value))}`}</div>
        <div class="csc-bar-track"><div class="csc-bar-fill" style="width:${d.vni ? vniBand(d.vni.score) : Math.min(100, hs.value)}%;background:${d.vni ? GOLD : gc}"></div></div>
        ${d.vni ? `<div class="csc-secondary"><span>${esc(d.labels.enhancedAccessibilityScore)}</span><strong>${hs.value}/100</strong><small>${esc(d.labels.technicalWcagFoundation)}</small></div>` : ""}
        <div class="csc-meta">
          <span>${d.issueBreakdown.total} issues</span>
          <span>Fix: ${esc(d.estimatedFixTime)}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="cover-footer cover-footer-corp">
    <span class="cover-scanid">Scan ${esc(d.scanId).slice(0, 8)}</span>
    <span class="cover-credit-line">${esc(reportFooterCredit(d))}</span>
    ${d.whiteLabelConfig.footerText ? `<span class="cover-footer-text">${esc(d.whiteLabelConfig.footerText)}</span>` : ""}
  </div>
</section>`;
  }

  const credit = reportFooterCredit(d);
  const ink = d.themeConfig.darkColor || BRAND_NAVY;

  // Premium: light cover — white-label primary for accents, theme dark for body text
  return `<section class="page cover-page cover-premium cover-premium-light">
  <div class="cover-accent-bar" style="background:linear-gradient(90deg,${esc(primary)} 0%,${BRAND_NAVY} 100%)" aria-hidden="true"></div>
  <header class="report-header report-header-light">
    ${renderBrandBlock(d, primary, false)}
    <div class="header-meta">
      <span class="header-pill" style="color:${esc(ink)};border-color:${esc(primary)}">${esc(d.labels.reportTitle)}</span>
    </div>
  </header>
  <div class="cover-main cover-main-light">
    <div class="cover-main-left">
      <p class="cover-eyebrow">${esc(d.labels.automatedAccessibilityAudit)}</p>
      <h1 class="cover-title-light" style="color:${esc(ink)}">${esc(d.labels.reportTitleLine1)} <span class="cover-title-soft">${esc(d.labels.reportTitleLine2)}</span></h1>
      <div class="cover-domain-block">
        <span class="cover-domain-label">${esc(d.labels.scannedDomain)}</span>
        <span class="cover-domain-value" style="color:${esc(primary)}">${esc(d.domain)}</span>
      </div>
      <div class="cover-chip-row">
        ${sevChip(d.riskLevel === "Low" ? "minor" : d.riskLevel === "Moderate" ? "moderate" : d.riskLevel === "High" ? "serious" : "critical", d)}
        <span class="cover-pill-ok" style="border-color:${esc(primary)};color:${esc(ink)}">${esc(d.complianceLevel)}</span>
        <span class="cover-pill-eaa ${d.eaaReady ? "eaa-yes" : "eaa-warn"}">EAA 2025 · ${d.eaaReady ? "On track" : "Needs work"}</span>
      </div>
      <div class="cover-meta-grid cover-meta-light">
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.standard)}</span><span class="cover-meta-value" style="color:${esc(primary)}">${esc(d.complianceLevel)}</span></div>
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.risk)}</span><span class="cover-meta-value" style="color:${riskClr(d.riskLevel)}">${esc(riskLabel(d, d.riskLevel))}</span></div>
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.scanDate)}</span><span class="cover-meta-value">${fmtDate(d.scanDate)}</span></div>
        <div class="cover-meta-cell"><span class="cover-meta-label">${esc(d.labels.pages)}</span><span class="cover-meta-value">${pagesAnalyzed}</span></div>
      </div>
      <p class="cover-summary-line">${d.issueBreakdown.total} issue${d.issueBreakdown.total !== 1 ? "s" : ""} detected across ${pagesAnalyzed} page${pagesAnalyzed !== 1 ? "s" : ""}. Est. remediation <strong>${esc(d.estimatedFixTime)}</strong>.</p>
      <div class="cover-sev-pills">
        <span class="csp csp-crit"><strong>${d.issueBreakdown.critical}</strong> ${esc(d.labels.critical)}</span>
        <span class="csp csp-ser"><strong>${d.issueBreakdown.serious}</strong> ${esc(d.labels.serious)}</span>
        <span class="csp csp-mod"><strong>${d.issueBreakdown.moderate}</strong> ${esc(d.labels.moderate)}</span>
        <span class="csp csp-min"><strong>${d.issueBreakdown.minor}</strong> ${esc(d.labels.minor)}</span>
      </div>
    </div>
    <div class="cover-main-right">
      <div class="cover-score-panel">
        ${d.vni ? vniBadge(d) : scoreRingSVG(hs.value, primary, BRAND_NAVY)}
        <p class="csc-label-light">${d.vni ? esc(d.labels.vniIndex) : esc(d.labels.enhancedAccessibilityScore)}</p>
        ${d.vni ? `<div class="csc-secondary-light"><span>${esc(d.labels.enhancedAccessibilityScore)}</span><strong>${hs.value}/100</strong><small>${esc(d.labels.technicalWcagFoundation)}</small></div>` : ""}
        <p class="csc-meta-light">${esc(d.labels.risk)} <strong style="color:${riskClr(d.riskLevel)}">${esc(riskLabel(d, d.riskLevel))}</strong> · ${esc(d.labels.wcagChecksPassed)} <strong style="color:${esc(primary)}">${d.compliancePercentage}%</strong></p>
      </div>
    </div>
  </div>
  <footer class="cover-footer cover-footer-light">
    <span class="cover-scanid-light">${esc(d.labels.scan)} ${esc(d.scanId).slice(0, 8)}</span>
    <span class="cover-credit-line">${esc(credit)}</span>
    ${d.whiteLabelConfig.footerText ? `<span class="cover-footer-custom">${esc(d.whiteLabelConfig.footerText)}</span>` : ""}
  </footer>
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 2 — Executive Summary (always shown)
   ═══════════════════════════════════════════════════════════ */

function renderTopPriorityFixes(fixes: TopPriorityFix[], s: ReportStyle, d: ReportData): string {
  if (fixes.length === 0) return "";
  const tblCls = corp(s) ? "tpf-table" : "tpf-table tpf-table-premium";
  return `<div class="tpf-section">
    <h3 class="subsection-title ${corp(s) ? "" : "tpf-heading-premium"}">${esc(d.labels.topPriorityFixes)}</h3>
    <table class="${tblCls}">
      <colgroup>
        <col class="tpf-col-rank" />
        <col class="tpf-col-issue" />
        <col class="tpf-col-severity" />
        <col class="tpf-col-elements" />
        <col class="tpf-col-effort" />
      </colgroup>
      <thead><tr><th>#</th><th>${esc(d.labels.issue)}</th><th>${esc(d.labels.severity)}</th><th>${esc(d.labels.elements)}</th><th>${esc(d.labels.estimatedFixTime)}</th></tr></thead>
      <tbody>
        ${fixes.map((f) => `<tr>
          <td class="tpf-rank">${f.rank}</td>
          <td class="tpf-title">${esc(f.title)}</td>
          <td class="tpf-severity">${sevChip(f.severity, d)}</td>
          <td class="tpf-num">${f.affectedElements}</td>
          <td class="tpf-effort"><span class="tpf-effort-label">${esc(d.labels.estimatedShort)}</span> ${esc(estimatePriorityFixTime(f.severity, f.affectedElements))}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function estimatePriorityFixTime(severity: Severity, affectedElements: number): string {
  const multiplier: Record<Severity, number> = {
    critical: 2,
    serious: 1.5,
    moderate: 0.5,
    minor: 0.25,
  };
  const hours = Math.max(1, Math.ceil((multiplier[severity] ?? 0.5) * Math.max(1, affectedElements)));
  if (hours <= 1) return "< 1 hour";
  if (hours <= 8) return `${hours} hours`;
  const days = Math.ceil(hours / 8);
  return days === 1 ? "~1 day" : `~${days} days`;
}

function renderExecutiveSummary(d: ReportData, primary: string, s: ReportStyle): string {
  // Anchor ID for TOC linking
  const anchorId = "exec-summary";
  const hs = d.healthScore;
  const hsColor = hs.value >= 80 ? "#16A34A" : hs.value >= 60 ? "#D97706" : "#DC2626";
  const primaryScoreLabel = d.vni ? d.labels.vniRank : d.labels.healthScore;
  const primaryScoreValue = d.vni ? `${d.vni.tier}` : `${hs.value}/100`;
  const primaryScoreColor = d.vni ? GOLD : hsColor;
  const metrics: { label: string; value: string | number; color: string }[] = [
    { label: primaryScoreLabel, value: primaryScoreValue, color: primaryScoreColor },
    ...(d.vni ? [{ label: d.labels.enhancedAccessibilityScore, value: `${hs.value}/100`, color: hsColor }] : []),
    { label: d.labels.totalIssues, value: d.issueBreakdown.total, color: "#6B7280" },
    { label: d.labels.critical, value: d.issueBreakdown.critical, color: "#DC2626" },
    { label: d.labels.serious, value: d.issueBreakdown.serious, color: "#EA580C" },
    { label: d.labels.moderate, value: d.issueBreakdown.moderate, color: "#D97706" },
    { label: d.labels.minor, value: d.issueBreakdown.minor, color: "#0f766e" },
    { label: d.labels.wcagChecksPassed, value: `${d.compliancePercentage}%`, color: "#16A34A" },
    { label: d.labels.estimatedFixTime, value: d.estimatedFixTime, color: "#7C3AED" },
  ];

  const coverageNote = `<div class="coverage-note"><strong>${esc(d.labels.note)}:</strong> ${esc(d.labels.automatedTestingNote)}</div>`;

  if (corp(s)) {
    return pageSection(d.labels.executiveSummary, primary, s, `
    <div class="exec-health-badge" style="border-color:${primaryScoreColor}">
      <div class="ehb-meta"><span class="ehb-grade">${d.vni ? `${d.vni.tier} ${"★★★★★".slice(0, d.vni.stars)}` : `${esc(d.labels.grade)} ${hs.grade}`}</span><span class="ehb-label">${d.vni ? "" : hs.label}</span></div>
    </div>
    <table class="corp-summary-table">
      <tr><td class="cst-label">${esc(d.labels.domain)}</td><td>${esc(d.domain)}</td><td class="cst-label">${esc(primaryScoreLabel)}</td><td><strong style="color:${primaryScoreColor}">${esc(primaryScoreValue)}</strong>${d.vni ? ` (${"★★★★★".slice(0, d.vni.stars)})` : ` (${esc(d.labels.grade)} ${hs.grade})`}</td></tr>
      <tr><td class="cst-label">${esc(d.labels.riskLevel)}</td><td style="color:${riskClr(d.riskLevel)};font-weight:600">${d.riskLevel}</td><td class="cst-label">${esc(d.labels.wcagChecksPassed)}</td><td>${d.compliancePercentage}%</td></tr>
      <tr><td class="cst-label">${esc(d.labels.totalIssues)}</td><td>${d.issueBreakdown.total}</td><td class="cst-label">${esc(d.labels.estimatedFixTime)}</td><td>${esc(d.estimatedFixTime)}</td></tr>
      <tr><td class="cst-label">${esc(d.labels.critical)}</td><td style="color:#DC2626">${d.issueBreakdown.critical}</td><td class="cst-label">${esc(d.labels.serious)}</td><td style="color:#EA580C">${d.issueBreakdown.serious}</td></tr>
    </table>
    <div class="corp-prose">
      <h3>${esc(d.labels.aiAssessment)}</h3>
      <p>${esc(d.riskSummary)}</p>
      <p>${esc(d.labels.estimatedFixTime)}: <strong>${esc(d.estimatedFixTime)}</strong>.</p>
    </div>
    ${renderTopPriorityFixes(d.topPriorityFixes, s, d)}
    ${coverageNote}`, anchorId);
  }

  // Premium — executive summary as visual anchor (large score + calm prose)
  const ink = d.themeConfig.darkColor || BRAND_NAVY;
  return `<section class="page exec-summary-page" id="${anchorId}">
  <header class="exec-page-head">
    <p class="exec-eyebrow">${esc(d.labels.reportOverview)}</p>
    <h2 class="exec-page-title" style="color:${esc(ink)}">${esc(d.labels.executiveSummary)}</h2>
    <div class="exec-title-accent" style="background:linear-gradient(90deg,${esc(primary)} 0%,${BRAND_NAVY} 100%)" aria-hidden="true"></div>
  </header>
  <div class="exec-hero-panel">
    <div class="exec-hero-scorecol">
      <div class="exec-mega-score" style="color:${primaryScoreColor}">${d.vni ? `${d.vni.tier}` : hs.value}</div>
      <div class="exec-mega-sub"><span class="exec-mega-of">${d.vni ? "" : "/100"}</span> <span class="exec-grade-pill" style="border-color:${primaryScoreColor};color:${esc(ink)}">${d.vni ? `${"★★★★★".slice(0, d.vni.stars)}` : `${esc(d.labels.grade)} ${hs.grade}`}</span></div>
      <p class="exec-mega-label">${d.vni ? d.labels.vniIndex : hs.label}</p>
      <div class="exec-mega-bar"><div class="exec-mega-bar-fill" style="width:${d.vni ? vniBand(d.vni.score) : Math.min(100, hs.value)}%;background:linear-gradient(90deg,#FDE68A 0%,${GOLD} 100%)"></div></div>
    </div>
    <div class="exec-hero-copy">
      <p class="exec-lead">${d.vni ? `The <strong>${esc(primaryScoreLabel)}</strong> is the lead VexNexa quality signal across accessibility, AI content integrity, performance, color/contrast, and UX. The <strong>${esc(d.labels.enhancedAccessibilityScore)}</strong> remains the technical WCAG foundation.` : `${esc(healthScoreMicrocopy(d))} The <strong>${esc(primaryScoreLabel)}</strong> is the technical WCAG foundation for this report.`}</p>
      <ul class="exec-lead-bullets">
        <li><strong style="color:${esc(primary)}">${d.compliancePercentage}%</strong> ${esc(d.labels.automatedWcagChecksPassed)}</li>
        <li><strong>${d.issueBreakdown.total}</strong> ${esc(d.labels.openFindings)} · <strong style="color:${riskClr(d.riskLevel)}">${d.riskLevel}</strong> risk</li>
        <li>${esc(d.labels.estimatedFixTime)}: <strong>${esc(d.estimatedFixTime)}</strong></li>
      </ul>
    </div>
  </div>
  <div class="exec-cards exec-cards-premium">
    <div class="exec-card exec-card-premium">
      <h3>${esc(d.labels.status)}</h3>
      <p><strong>${esc(d.domain)}</strong> — ${esc(primaryScoreLabel)} <strong style="color:${primaryScoreColor}">${esc(primaryScoreValue)}</strong>${d.vni ? ` (${"★★★★★".slice(0, d.vni.stars)}), ${esc(d.labels.enhancedAccessibilityScore)} <strong style="color:${hsColor}">${hs.value}/100</strong>` : ` (grade ${hs.grade})`}.
      ${d.issueBreakdown.critical > 0
        ? ` <span class="exec-alert-inline">${d.issueBreakdown.critical} ${esc(d.labels.critical)} ${d.issueBreakdown.critical !== 1 ? esc(d.labels.issuePlural) : esc(d.labels.issueSingular)}.</span>`
        : " "}</p>
    </div>
    <div class="exec-card exec-card-premium">
      <h3>${d.labels.locale === "en" ? "Accessibility Risk Summary" : esc(d.labels.riskLevel)}</h3>
      <div class="exec-risk-row">
        <span class="exec-risk-label" style="color:${riskClr(d.riskLevel)}">${d.riskLevel} risk</span>
        ${riskBar(d.riskLevel, primary)}
      </div>
      <p>${esc(d.riskSummary)}</p>
    </div>
    <div class="exec-card exec-card-premium">
      <h3>${esc(d.labels.remediation)}</h3>
      <p>${esc(d.labels.remediationFocusCopy)} <strong style="color:${esc(primary)}">${esc(d.estimatedFixTime)}</strong>.</p>
    </div>
  </div>
  ${renderTopPriorityFixes(d.topPriorityFixes, s, d)}
  <h3 class="subsection-title metrics-heading-premium">${esc(d.labels.keyMetrics)}</h3>
  <div class="metrics-grid metrics-grid-premium">
    ${metrics.map((m) => `<div class="metric-card metric-card-premium"><div class="metric-value" style="color:${m.color}">${m.value}</div><div class="metric-label">${m.label}</div></div>`).join("")}
  </div>
  ${coverageNote}
</section>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 3 — Visual Breakdown
   ═══════════════════════════════════════════════════════════ */

function renderVisualBreakdown(d: ReportData, primary: string, s: ReportStyle): string {
  const aaClr = d.wcagAAStatus === "pass" ? "#16A34A" : d.wcagAAStatus === "partial" ? "#D97706" : "#DC2626";
  const aaaClr = d.wcagAAAStatus === "pass" ? "#16A34A" : d.wcagAAAStatus === "partial" ? "#D97706" : "#DC2626";
  const matLevels = ["Basic", "Structured", "Proactive", "Continuous"] as const;
  const curIdx = matLevels.indexOf(d.maturityLevel);

  return pageSection(d.labels.visualBreakdown, primary, s, `
  <div class="breakdown-grid">
    <div class="breakdown-card">
      <h3>${esc(d.labels.severityDistribution)}</h3>
      <div class="chart-center">${donutChart(d.issueBreakdown, s, d)}</div>
    </div>
    <div class="breakdown-card">
      <h3>${esc(d.labels.wcagChecksPassed)}</h3>
      <div class="progress-stack">
        ${progressBar("WCAG AA", d.compliancePercentage, aaClr, s)}
        ${progressBar("WCAG AAA", Math.round(d.compliancePercentage * 0.7), aaaClr, s)}
        ${progressBar(d.vni ? d.labels.vniIndex : d.labels.enhancedAccessibilityScore, d.vni ? Math.round(vniBand(d.vni.score)) : d.score, d.vni ? GOLD : primary, s)}
      </div>
    </div>
  </div>
  <div class="breakdown-grid mt-24">
    <div class="breakdown-card">
      <h3>${esc(d.labels.wcagLevelStatus)}</h3>
      <table class="status-table">
        <tr><td>WCAG 2.1 Level AA</td><td><span class="status-dot" style="background:${aaClr}"></span>${complianceStatusLabel(d, d.wcagAAStatus)}</td></tr>
        <tr><td>WCAG 2.1 Level AAA</td><td><span class="status-dot" style="background:${aaaClr}"></span>${complianceStatusLabel(d, d.wcagAAAStatus)}</td></tr>
        <tr><td>EAA 2025 Readiness</td><td><span class="status-dot" style="background:${d.eaaReady ? "#16A34A" : "#D97706"}"></span>${readinessLabel(d)}</td></tr>
      </table>
    </div>
    <div class="breakdown-card">
      <h3>${esc(d.labels.accessibilityMaturityLevel)}</h3>
      <div class="maturity-indicator">
        ${matLevels.map((lv, i) => {
          const reached = i <= curIdx;
          const ac = corp(s) ? "#374151" : primary;
          return `<div class="maturity-step ${lv === d.maturityLevel ? "active" : ""}" style="${reached ? `border-color:${ac}` : ""}">
            <div class="maturity-dot" style="background:${reached ? ac : "#D1D5DB"}"></div>
            <span style="${reached ? `color:${ac};font-weight:600` : ""}">${esc(({ Basic: d.labels.maturityBasic, Structured: d.labels.maturityStructured, Proactive: d.labels.maturityProactive, Continuous: d.labels.maturityContinuous })[lv])}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>`, "visual-breakdown");
}

/* ═══════════════════════════════════════════════════════════
   Page — WCAG Compliance Matrix (Task 2)
   ═══════════════════════════════════════════════════════════ */

function renderPerformanceParadox(d: ReportData, primary: string, s: ReportStyle): string {
  const q = d.qualityMetrics ?? {
    totalPageWeightBytes: 0,
    largestContentfulPaintMs: 1500,
    domNodeCount: 0,
    performanceParadox: false,
  };
  const lcpMs = visualLoadMs(q.largestContentfulPaintMs);
  return pageSection(d.labels.realWorldQuality, primary, s, `
  ${q.performanceParadox ? `<div class="paradox-banner"><strong>${esc(d.labels.performanceParadox)}</strong><span>${esc(d.labels.technicallyOptimizedHeavy)}</span></div>` : ""}
  <div class="quality-grid">
    <div class="quality-card">
      <span class="quality-label">${esc(d.labels.pageWeight)}</span>
      <strong>${fmtBytes(q.totalPageWeightBytes)}</strong>
      <div class="quality-meter"><span style="width:${Math.min(100, (q.totalPageWeightBytes / 2500000) * 100)}%;background:${q.totalPageWeightBytes > 2500000 ? "#DC2626" : q.totalPageWeightBytes > 1000000 ? "#D97706" : "#16A34A"}"></span></div>
    </div>
    <div class="quality-card">
      <span class="quality-label">${esc(d.labels.visualLoadTime)}</span>
      <strong>${fmtMs(q.largestContentfulPaintMs)}</strong>
      <div class="quality-meter"><span style="width:${Math.min(100, (lcpMs / 2500) * 100)}%;background:${lcpMs > 2500 ? "#DC2626" : lcpMs > 1200 ? "#D97706" : "#16A34A"}"></span></div>
    </div>
    <div class="quality-card">
      <span class="quality-label">${esc(d.labels.domComplexity)}</span>
      <strong>${q.domNodeCount}</strong>
      <div class="quality-meter"><span style="width:${Math.min(100, (q.domNodeCount / 1500) * 100)}%;background:${q.domNodeCount > 1500 ? "#DC2626" : q.domNodeCount > 800 ? "#D97706" : "#16A34A"}"></span></div>
    </div>
  </div>
  ${d.vni?.worstPage?.url ? `<div class="worst-page-card"><strong>Lowest VNI page</strong><span>${esc(d.vni.worstPage.url)}</span></div>` : ""}
  `, "performance-paradox");
}

function renderAiVisionAudit(d: ReportData, primary: string, s: ReportStyle): string {
  const pageTitle = d.pageTitle || d.domain;
  if (!d.aiVisionAudit.length) {
    return pageSection("AI-Powered Content Intelligence", primary, s, `
  <p class="section-intro">AI-powered image analysis using Gemini 1.5 Flash validates alt-text accuracy against visual content.</p>
  <div class="empty-state"><p>AI Vision analysis is being processed or no images were found on the scanned pages.</p></div>
  `, "ai-vision-audit");
  }

  return pageSection("AI-Powered Content Intelligence", primary, s, `
  <p class="section-intro">AI-powered image analysis using Gemini 1.5 Flash validates alt-text accuracy against visual content. This table shows images analyzed during the scan with AI confidence scores and compliance assessments.</p>
  <table class="ai-table">
    <thead><tr><th>Page URL</th><th>Image</th><th>Detected by AI (Description)</th><th>Original Alt-Text</th><th>Compliance Match Score</th></tr></thead>
    <tbody>
      ${d.aiVisionAudit.map((item) => `<tr class="${item.matchesAltText === false ? 'ai-row-mismatch' : ''}">
        <td>${esc(pageTitle)}</td>
        <td>${item.imageUrl ? `<span class="ai-url">${esc(item.imageUrl).slice(0, 60)}...</span>` : "Image"}</td>
        <td>${esc(item.aiDescription || item.recommendation || "Gemini analysis completed.")}</td>
        <td>${esc(item.altText || "No alt text")}</td>
        <td><strong class="${item.matchesAltText === false ? 'ai-score-mismatch' : 'ai-score-match'}">${typeof item.confidence === "number" ? `${Math.round(item.confidence)}%` : item.matchesAltText === false ? "0%" : "100%"}</strong></td>
      </tr>`).join("")}
    </tbody>
  </table>
  `, "ai-vision-audit");
}

function wcagStatusChip(status: WcagMatrixRow["status"], d: ReportData): string {
  const colors: Record<string, { bg: string; fg: string }> = {
    Pass: { bg: "#DCFCE7", fg: "#16A34A" },
    Fail: { bg: "#FEF2F2", fg: "#DC2626" },
    "Needs Manual Review": { bg: "#FFF7ED", fg: "#EA580C" },
    "Not Tested": { bg: "#F3F4F6", fg: "#6B7280" },
  };
  const c = colors[status] ?? colors["Not Tested"];
  return `<span class="wcag-status-chip" style="background:${c.bg};color:${c.fg}">${esc(wcagStatusLabel(d, status))}</span>`;
}

function renderWcagMatrix(d: ReportData, primary: string, s: ReportStyle): string {
  const matrix = d.wcagMatrix ?? [];
  if (matrix.length === 0) {
    return pageSection(d.labels.wcagComplianceMatrix, primary, s,
      `<div class="empty-state"><p>No automated issues detected in this category.</p></div>`, "wcag-matrix");
  }

  // Show failing criteria first, then manual review, passing, not tested
  const failing = matrix.filter((r) => r.status === "Fail");
  const manualReview = matrix.filter((r) => r.status === "Needs Manual Review");
  const passing = matrix.filter((r) => r.status === "Pass");
  const notTested = matrix.filter((r) => r.status === "Not Tested");

  const perPage = 18;
  const allRows = [...failing, ...manualReview, ...passing.slice(0, 10), ...notTested.slice(0, 5)];
  const pages: WcagMatrixRow[][] = [];
  for (let i = 0; i < allRows.length; i += perPage) {
    pages.push(allRows.slice(i, i + perPage));
  }

  return pages.map((pg, pi) => `
<section class="page"${pi === 0 ? ' id="wcag-matrix"' : ''}>
  <h2 class="${corp(s) ? "section-title corp-title" : "section-title"}" style="border-color:${primary}">${pi === 0 ? esc(d.labels.wcagComplianceMatrix) : `${esc(d.labels.wcagComplianceMatrix)} (${d.labels.locale === "fr" ? "suite" : d.labels.locale === "nl" ? "vervolg" : "continued"})`}</h2>
  ${pi === 0 ? `<div class="matrix-legend">
    <span class="ml-item"><span class="wcag-status-chip" style="background:#DCFCE7;color:#16A34A">${esc(d.labels.pass)}</span> ${d.labels.locale === "nl" ? "Geen overtredingen gedetecteerd" : d.labels.locale === "fr" ? "Aucune violation detectee" : "No violations detected"}</span>
    <span class="ml-item"><span class="wcag-status-chip" style="background:#FEF2F2;color:#DC2626">${esc(d.labels.fail)}</span> ${d.labels.locale === "nl" ? "Geautomatiseerde overtredingen gedetecteerd" : d.labels.locale === "fr" ? "Violations automatisees detectees" : "Automated violations detected"}</span>
    <span class="ml-item"><span class="wcag-status-chip" style="background:#FFF7ED;color:#EA580C">${esc(d.labels.needsManualReview)}</span> ${d.labels.locale === "nl" ? "Niet volledig automatisch te verifi�ren" : d.labels.locale === "fr" ? "Ne peut pas etre verifie entierement automatiquement" : "Cannot be fully verified automatically"}</span>
    <span class="ml-item"><span class="wcag-status-chip" style="background:#F3F4F6;color:#6B7280">${esc(d.labels.notTested)}</span> ${d.labels.locale === "nl" ? "Buiten scanbereik" : d.labels.locale === "fr" ? "Hors perimetre du scan" : "Outside scan scope"}</span>
  </div>
  <p class="matrix-summary">${esc(d.labels.testedAgainst)} <strong>${matrix.length}</strong> WCAG 2.2 ${esc(d.labels.successCriterion).toLowerCase()}.
    <strong style="color:#16A34A">${passing.length} ${esc(d.labels.pass)}</strong> &middot;
    <strong style="color:#DC2626">${failing.length} ${esc(d.labels.fail)}</strong> &middot;
    <strong style="color:#EA580C">${manualReview.length} ${esc(d.labels.needsManualReview)}</strong> &middot;
    <span style="color:#6B7280">${notTested.length} ${esc(d.labels.notTested)}</span></p>` : ""}
  <table class="wcag-matrix-table">
    <thead>
      <tr><th>${esc(d.labels.successCriterion)}</th><th>${esc(d.labels.level)}</th><th>${esc(d.labels.status)}</th><th>${esc(d.labels.findings)}</th></tr>
    </thead>
    <tbody>
      ${pg.map((row) => `<tr class="wcag-row-${row.status.toLowerCase().replace(/\s/g, "-")}">
        <td class="wcag-criterion">${esc(row.criterion)}</td>
        <td class="wcag-level"><span class="wcag-level-badge">${row.level}</span></td>
        <td>${wcagStatusChip(row.status, d)}</td>
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
  const scannedPagesRows = d.scannedPages.length
    ? `<tr><td class="sct-label">${esc(d.labels.scannedPages)}</td><td>${d.scannedPages.map((page, index) =>
        `<div class="scan-page-row"><strong>${index + 1}.</strong> ${esc(page.url)}${typeof page.issues === "number" ? ` <span>${page.issues} ${esc(page.issues !== 1 ? d.labels.issuePlural : d.labels.issueSingular)}</span>` : ""}</div>`
      ).join("")}</td></tr>`
    : "";

  return pageSection(d.labels.scanConfiguration, primary, s, `
  <table class="scan-config-table">
    <tr><td class="sct-label">${esc(d.labels.domainScanned)}</td><td>${esc(sc.domain)}</td></tr>
    <tr><td class="sct-label">${esc(d.labels.pagesAnalyzed)}</td><td>${sc.pagesAnalyzed}</td></tr>
    <tr><td class="sct-label">${esc(d.labels.crawlDepth)}</td><td>${esc(sc.crawlDepth)}</td></tr>
    <tr><td class="sct-label">${esc(d.labels.scanDateTime)}</td><td>${fmtDate(sc.scanDateTime, d.labels.locale)}</td></tr>
    <tr><td class="sct-label">${esc(d.labels.userAgent)}</td><td><code>${esc(sc.userAgent)}</code></td></tr>
    <tr><td class="sct-label">${esc(d.labels.viewport)}</td><td>${esc(sc.viewport)}</td></tr>
    <tr><td class="sct-label">${esc(d.labels.standardsTested)}</td><td>${sc.standardsTested.map((st) => `<span class="ac-chip ac-chip-wcag">${esc(st)}</span>`).join(" ")}</td></tr>
    <tr><td class="sct-label">${esc(d.labels.engine)}</td><td>${esc(sc.engineName)} v${esc(sc.engineVersion)}</td></tr>
    ${scannedPagesRows}
  </table>`, "scan-config");
}

/* ═══════════════════════════════════════════════════════════
   Page 4+ — Priority Issues (Consultancy Cards / Table)
   ═══════════════════════════════════════════════════════════ */

// Evidence table chunking threshold — tables larger than this get split
const EVIDENCE_CHUNK_SIZE = 50;

function renderChunkedEvidenceTable(details: ReportData["priorityIssues"][0]["affectedElementDetails"], domain: string, d: ReportData): string {
  if (details.length === 0) return "";
  const totalChunks = Math.ceil(details.length / EVIDENCE_CHUNK_SIZE);
  const chunks: typeof details[] = [];
  for (let i = 0; i < details.length; i += EVIDENCE_CHUNK_SIZE) {
    chunks.push(details.slice(i, i + EVIDENCE_CHUNK_SIZE));
  }
  return chunks.map((chunk, ci) => {
    const offset = ci * EVIDENCE_CHUNK_SIZE;
    const label = totalChunks > 1 ? ` <span class="ev-chunk-label">(${ci + 1}/${totalChunks})</span>` : "";
    const screenshots = chunk.filter((el) => Boolean(el.screenshotDataUrl)).slice(0, 4);
    const screenshotGrid = screenshots.length
      ? `<div class="evidence-screenshots">
          ${screenshots.map((el, idx) => `<figure class="evidence-shot">
            <img class="evidence-shot-img" src="${esc(el.screenshotDataUrl || "")}" alt="Evidence screenshot ${offset + idx + 1}" />
            <figcaption>${esc(el.selector || el.pageUrl || domain)}</figcaption>
          </figure>`).join("")}
        </div>`
      : "";
    return `<div class="ac-section" style="margin-top:8px">
      <div class="ac-label">${esc(d.labels.affectedElements)}${label}</div>
      <table class="evidence-table">
        <thead><tr><th>#</th><th>${esc(d.labels.pageUrl)}</th><th>${esc(d.labels.selector)}</th><th>${esc(d.labels.htmlSnippet)}</th></tr></thead>
        <tbody>
          ${chunk.map((el, idx) => `<tr>
            <td class="ev-num">${offset + idx + 1}</td>
            <td class="ev-url">${esc(el.pageUrl || domain)}</td>
            <td class="ev-mono">${esc(el.selector)}</td>
            <td class="ev-mono">${el.html ? esc(el.html) : "&mdash;"}${el.failureSummary ? `<div class="ev-failure">${esc(el.failureSummary)}</div>` : ""}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ${screenshotGrid}
    </div>`;
  }).join("");
}

function renderPriorityIssues(d: ReportData, primary: string, s: ReportStyle): string {
  if (d.priorityIssues.length === 0) {
    return pageSection(d.labels.auditFindings, primary, s,
      `<div class="empty-state"><p>No automated issues detected in this category.</p></div>`, "findings-index");
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
<section class="page"${pi === 0 ? ' id="findings-index"' : ''}>
  <h2 class="section-title" style="border-color:${primary}">${pi === 0 ? esc(d.labels.auditFindings) : `${esc(d.labels.auditFindings)} (${d.labels.locale === "fr" ? "suite" : d.labels.locale === "nl" ? "vervolg" : "continued"})`}</h2>
  <div class="issues-list">${pg.map((iss, i) => renderAuditCard(iss, pi * 3 + i + 1, primary, d.domain, d)).join("")}</div>
</section>`).join("");
}

function eaaCopy(d: ReportData) {
  if (d.labels.locale === "nl") {
    return {
      title: d.labels.eaaReadiness,
      context: `Context voor geautomatiseerde resultaten voor ${d.domain}. Laatst gerapporteerde score: ${d.vni?.score ?? d.score}/100 (alleen informatief). Dit rapport bevat ${d.issueBreakdown.total} gedetecteerde problemen uit automatisering.`,
      badge: "Geautomatiseerde scan",
      badgeHint: "Resultaten zijn indicatoren en vormen geen conformiteitsbeoordeling.",
      intro: "De European Accessibility Act (EAA) stelt toegankelijkheidseisen aan digitale producten en diensten in de EU. Voor webcontent sluiten organisaties doorgaans aan op EN 301 549, gebaseerd op WCAG 2.1 niveau AA.",
      standardsHeading: "Relevante standaarden",
      standardsBody: "WCAG 2.1 AA + EN 301 549",
      coversHeading: "Wat deze scan dekt",
      coversBody: "Geautomatiseerde detectie van veelvoorkomende problemen rond contrast, toetsenbordnavigatie, formulierlabels, afbeeldingen/alt-tekst, structuur/koppen en meer.",
      noteTitle: "Belangrijke opmerking",
      noteBody: "Dit is een geautomatiseerde scan met indicatoren van mogelijke toegankelijkheidsbarrieres die relevant zijn voor EAA-gereedheid. Het is geen volledige handmatige audit en geen juridische conformiteitscertificering.",
      closing: "Geautomatiseerde resultaten zijn een sterk startpunt voor herstelplanning en monitoring. Combineer dit met handmatige tests en expertreview voor volledige EAA-afstemming.",
      learnMore: "Meer over de European Accessibility Act",
    };
  }
  if (d.labels.locale === "fr") {
    return {
      title: d.labels.eaaReadiness,
      context: `Contexte des resultats automatises pour ${d.domain}. Dernier score rapporte : ${d.vni?.score ?? d.score}/100 (informatif uniquement). Ce rapport liste ${d.issueBreakdown.total} problemes detectes automatiquement.`,
      badge: "Scan automatise",
      badgeHint: "Les resultats sont des indicateurs et ne constituent pas une evaluation de conformite.",
      intro: "L'European Accessibility Act (EAA) definit des exigences d'accessibilite pour les produits et services numeriques dans l'UE. Pour le web, les organisations s'alignent generalement sur EN 301 549, basee sur WCAG 2.1 niveau AA.",
      standardsHeading: "Standards pertinents",
      standardsBody: "WCAG 2.1 AA + EN 301 549",
      coversHeading: "Ce que couvre ce scan",
      coversBody: "Detection automatisee des problemes courants de contraste, navigation clavier, libelles de formulaire, images/texte alternatif, structure/titres, etc.",
      noteTitle: "Remarque importante",
      noteBody: "Ce scan automatise fournit des indicateurs de barrieres d'accessibilite potentielles liees a la preparation EAA. Il ne s'agit pas d'un audit manuel complet ni d'une certification juridique de conformite.",
      closing: "Les resultats automatises sont un bon point de depart pour la correction et la surveillance. Combinez-les avec des tests manuels et une revue experte pour un alignement EAA complet.",
      learnMore: "En savoir plus sur l'European Accessibility Act",
    };
  }
  return {
    title: d.labels.eaaReadiness,
    context: formatEaaContextLine({ domain: d.domain, score: d.vni?.score ?? d.score, totalIssues: d.issueBreakdown.total }),
    badge: "Automated scan",
    badgeHint: "Results are indicators only and do not constitute a conformity assessment.",
    intro: EAA_READINESS_INTRO,
    standardsHeading: EAA_STANDARDS_HEADING,
    standardsBody: EAA_STANDARDS_BODY,
    coversHeading: EAA_SCAN_COVERS_HEADING,
    coversBody: EAA_SCAN_COVERS_BODY,
    noteTitle: EAA_IMPORTANT_NOTE_TITLE,
    noteBody: EAA_IMPORTANT_NOTE_BODY,
    closing: EAA_RECOMMENDATION_CLOSING,
    learnMore: EAA_LEARN_MORE_LABEL,
  };
}
function renderEAAReadinessSection(d: ReportData, primary: string, s: ReportStyle): string {
  const eaa = eaaCopy(d);
  const body = `
  ${eaa.context ? `<p class="eaa-context">${esc(eaa.context)}</p>` : `<p class="eaa-badge-hint"><span class="eaa-badge">${esc(eaa.badge)}</span> ${esc(eaa.badgeHint)}</p>`}
  <p>${esc(eaa.intro)}</p>
  <div class="eaa-two-col">
    <div class="legal-card">
      <h3>${esc(eaa.standardsHeading)}</h3>
      <p>${esc(eaa.standardsBody)}</p>
    </div>
    <div class="legal-card">
      <h3>${esc(eaa.coversHeading)}</h3>
      <p>${esc(eaa.coversBody)}</p>
    </div>
  </div>
  <div class="eaa-note" style="border-left:4px solid ${primary}">
    <p><strong>${esc(eaa.noteTitle)}</strong></p>
    <p>${esc(eaa.noteBody)}</p>
  </div>
  <p>${esc(eaa.closing)}</p>
  <p class="eaa-learn-more"><a href="${esc(EAA_LEARN_MORE_URL)}" style="color:${primary}">${esc(eaa.learnMore)}</a></p>`;
  return pageSection(eaa.title, primary, s, body, "eaa-readiness");
}

function renderAuditCard(iss: ReportIssue, num: number, primary: string, domain: string, d: ReportData): string {
  const details = iss.affectedElementDetails ?? [];
  return `<div class="audit-card" id="finding-${esc(iss.id)}">
  <div class="ac-header">
    <span class="ac-num">${num}</span>
    ${sevChip(iss.severity, d)}
    <h4 class="ac-title">${esc(iss.title)}</h4>
  </div>
  <div class="ac-body">
    <div class="ac-grid">
      <div class="ac-section">
        <div class="ac-label">${esc(d.labels.impact)}</div>
        <p>${esc(iss.impact)}</p>
      </div>
      <div class="ac-section">
        <div class="ac-label">${esc(d.labels.recommendation)}</div>
        <p>${esc(iss.recommendation)}</p>
      </div>
    </div>
    <div class="ac-grid">
      <div class="ac-section">
        <div class="ac-label">${esc(d.labels.effort)}</div>
        <p>${esc(iss.estimatedFixTime)} &middot; ${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""} affected</p>
      </div>
      <div class="ac-section">
        <div class="ac-label">${esc(d.labels.impact)}</div>
        <p>${esc(iss.explanation)}</p>
      </div>
    </div>
    ${renderChunkedEvidenceTable(details, domain, d)}
    <div class="ac-footer">
      ${iss.wcagCriteria.map(c => `<span class="ac-chip ac-chip-wcag">${c}</span>`).join("")}
      <span class="ac-chip">${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""}</span>
      <span class="ac-chip">Est. ${esc(iss.estimatedFixTime)}</span>
    </div>
    <div class="ac-tech-row"><span class="ac-tech-label">${esc(d.labels.rule)}:</span> <code>${esc(iss.id)}</code></div>
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
<section class="page"${pi === 0 ? ' id="findings-index"' : ''}>
  <h2 class="section-title corp-title" style="border-color:${primary}">${pi === 0 ? esc(d.labels.auditFindings) : `${esc(d.labels.auditFindings)} (${d.labels.locale === "fr" ? "suite" : d.labels.locale === "nl" ? "vervolg" : "continued"})`}</h2>
  ${pg.map((iss, i) => renderIssueDetailCard(iss, pi * perPage + i + 1, primary, d.domain, d)).join("")}
</section>`).join("");
}

function renderIssueDetailCard(iss: ReportIssue, num: number, primary: string, domain: string, d: ReportData): string {
  const details = (iss.affectedElementDetails ?? []);
  return `<div class="issue-detail-card" id="finding-${esc(iss.id)}" style="border-left:4px solid ${sevClr(iss.severity)};background:${sevBg(iss.severity)}">
  <div class="idc-header">
    <span class="idc-num" style="background:${sevClr(iss.severity)};color:#fff">${num}</span>
    <span class="ft-sev" style="color:${sevClr(iss.severity)}">${iss.severity.toUpperCase()}</span>
    <strong class="idc-title">${esc(iss.title)}</strong>
    <span class="idc-meta">${iss.affectedElements} element${iss.affectedElements !== 1 ? "s" : ""} &middot; Est. ${esc(iss.estimatedFixTime)}</span>
  </div>
  <div class="idc-body">
    <div class="idc-section">
      <div class="idc-label">${esc(d.labels.impact)}</div>
      <p>${esc(iss.impact)}</p>
    </div>
    <div class="idc-section">
      <div class="idc-label">${esc(d.labels.howToFix)}</div>
      <p>${esc(iss.recommendation)}</p>
    </div>
    ${iss.wcagCriteria.length > 0 ? `<div class="idc-section">
      <div class="idc-label">${esc(d.labels.successCriterion)}</div>
      <p>${iss.wcagCriteria.map(c => `<span class="ac-chip ac-chip-wcag">${c}</span>`).join(" ")}</p>
    </div>` : ""}
    ${renderChunkedEvidenceTable(details, domain, d)}
    <div class="idc-rule"><span class="idc-label">${esc(d.labels.rule)}:</span> <code>${esc(iss.id)}</code></div>
  </div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════
   Page 5 — Compliance & Legal
   ═══════════════════════════════════════════════════════════ */

function renderComplianceLegal(d: ReportData, primary: string, s: ReportStyle): string {
  return pageSection(d.labels.complianceLegal, primary, s, `
  <div class="legal-grid">
    <div class="legal-card">
      <h3>${esc(d.labels.legalNotice)}</h3>
      <p>${esc(EAA_LEGAL_NOTICE_SHORT)}</p>
      <p>${esc(d.labels.complianceLegalAutomated)}</p>
    </div>
    <div class="legal-card">
      <h3>${esc(d.labels.continuousMonitoringRecommendation)}</h3>
      <ul>
        <li>${esc(d.labels.continuousMonitoringCopy)}</li>
      </ul>
    </div>
    <div class="legal-card">
      <h3>${esc(d.labels.auditTraceability)}</h3>
      <table class="audit-table">
        <tr><td>${esc(d.labels.scan)} ID</td><td><code>${esc(d.scanId)}</code></td></tr>
        <tr><td>${esc(d.labels.scanDate)}</td><td>${fmtDate(d.scanDate, d.labels.locale)}</td></tr>
        <tr><td>${esc(d.labels.engine)}</td><td>${esc(d.engineName)} v${esc(d.engineVersion)}</td></tr>
        <tr><td>${esc(d.labels.standard)}</td><td><span style="color:#16A34A;font-weight:600">${esc(d.complianceLevel)}</span></td></tr>
        <tr><td>${esc(d.labels.domain)}</td><td>${esc(d.domain)}</td></tr>
        <tr><td>${esc(d.labels.scannedPages)}</td><td>${d.pagesScanned ?? 1}</td></tr>
      </table>
    </div>
  </div>`, "appendix");
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
      <h2 style="color:${primary}">${d.labels.locale === "nl" ? "Volgende stappen" : d.labels.locale === "fr" ? "Prochaines etapes" : "Next Steps"}</h2>
      <p>${d.labels.locale === "nl" ? `Op basis van deze beoordeling raden we aan de ${d.issueBreakdown.critical > 0 ? "kritieke en ernstige" : "geidentificeerde"} bevindingen te prioriteren om toegankelijkheidsrisico te verlagen en de gebruikerservaring te verbeteren.` : d.labels.locale === "fr" ? `Sur la base de cette evaluation, nous recommandons de prioriser les constats ${d.issueBreakdown.critical > 0 ? "critiques et serieux" : "identifies"} afin de reduire le risque d accessibilite et d ameliorer l experience utilisateur.` : `Based on this assessment, we recommend prioritising the ${d.issueBreakdown.critical > 0 ? "critical and serious" : "identified"} findings to reduce accessibility risk and improve user experience.`}</p>
      <ul class="cta-bullets">
        ${(d.labels.locale === "nl" ? ["Gedetailleerde herstelroadmap", "Doorlopende compliance-monitoring", "Auditklare documentatie", "Training voor ontwikkelaars over toegankelijkheidsstandaarden"] : d.labels.locale === "fr" ? ["Feuille de route de correction detaillee", "Surveillance continue de la conformite", "Documentation prete pour audit", "Formation des developpeurs aux standards d accessibilite"] : ["Detailed remediation roadmap", "Ongoing compliance monitoring", "Audit-ready documentation", "Developer training on accessibility standards"]).map((item) => `<li>${esc(item)}</li>`).join("\\n        ")}
      </ul>
      ${cta.supportEmail ? `<p class="cta-contact">${d.labels.locale === "nl" ? "Contact" : d.labels.locale === "fr" ? "Contact" : "Contact"}: <a href="mailto:${esc(cta.supportEmail)}">${esc(cta.supportEmail)}</a></p>` : ""}
    </div>
    <div class="cta-right">
      ${cta.ctaUrl ? `<a href="${esc(cta.ctaUrl)}" class="cta-button" style="background:${primary}">${esc(cta.ctaText || (d.labels.locale === "nl" ? "Aan de slag" : d.labels.locale === "fr" ? "Commencer" : "Get Started"))}</a>` : ""}
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
/* ═══════════════════════════════════════════════════
   DESIGN TOKENS — strict spacing scale
   ═══════════════════════════════════════════════════ */
:root{
  --space-xs:4px;--space-sm:8px;--space-md:16px;--space-lg:24px;--space-xl:32px;--space-2xl:48px;--space-3xl:56px;
  --r:${radius};--rs:${radiusSm};--shadow:${shadow};--card-bg:${cardBg};--card-border:${cardBorder};
  --dark:${dark};--bg:${bg};--primary:${primary};
  --vn-navy:#1e3a8a;--vn-mint:#0d9488;--vn-surface:#F8FAFC;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace;
  --sev-critical:#DC2626;--sev-serious:#F97316;--sev-moderate:#FACC15;--sev-minor:#9CA3AF}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:18mm 16mm}
body{font-family:Inter,'Segoe UI',system-ui,-apple-system,sans-serif;
  color:${dark};background:white;line-height:1.65;font-size:14px;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ═══════════════════════════════════════════════════
   PAGE CONTAINER
   ═══════════════════════════════════════════════════ */
.page{width:210mm;min-height:297mm;padding:22mm var(--space-lg);margin:0 auto;position:relative;
  page-break-after:always;page-break-inside:avoid;background:white}
@media screen{.page{box-shadow:0 4px 24px rgba(0,0,0,.08);margin-bottom:var(--space-lg);border-radius:4px}}

/* ═══════════════════════════════════════════════════
   RESPONSIVE — Mobile (<800px)
   ═══════════════════════════════════════════════════ */
@media screen and (max-width:800px){
  .page{width:100%;min-height:auto;padding:var(--space-md) var(--space-md)}
  .report-header{padding:var(--space-md) var(--space-md)}
  .cover-main{padding:var(--space-md);flex-direction:column}
  .cover-main-left,.cover-main-right{flex:none;width:100%}
  .cover-footer{padding:0 var(--space-md) var(--space-md)}
  .cover-title-light{font-size:28px}
  .cover-title-prem{font-size:26px}
  .cover-title-corp{font-size:24px}
  .cover-kpi-strip{flex-wrap:wrap}
  .cover-meta-grid{grid-template-columns:repeat(2,1fr)}
  .metrics-grid{grid-template-columns:repeat(2,1fr)}
  .breakdown-grid{grid-template-columns:1fr}
  .cta-2col{grid-template-columns:1fr}
  .ac-grid{grid-template-columns:1fr}
  .brand-logo{max-height:32px;max-width:160px}
  .exec-health-row{flex-direction:column;align-items:stretch}
  .exec-health-badge{justify-content:center}
  .exec-hero-panel{flex-direction:column;gap:var(--space-lg);padding:var(--space-lg)}
  .exec-hero-scorecol{flex:none;text-align:center}
  .exec-mega-score{font-size:64px}
  .score-ring-svg{width:220px;height:220px}
  .corp-summary-table td{padding:var(--space-sm) var(--space-sm);font-size:12px}
  .cst-label{width:auto;min-width:80px}
  .evidence-table th:first-child{width:8%}
  .evidence-table th:nth-child(2){width:30%}
  .evidence-table th:nth-child(3){width:30%}
  .evidence-table th:nth-child(4){width:32%}
}

/* ═══════════════════════════════════════════════════
   RESPONSIVE — iPad / Tablet (768–1024px)
   ═══════════════════════════════════════════════════ */
@media screen and (min-width:768px) and (max-width:1024px){
  .page{width:100%;min-height:auto;padding:var(--space-lg) var(--space-lg)}
  .cover-main{gap:var(--space-lg)}
  .cover-meta-grid{grid-template-columns:repeat(2,1fr);gap:var(--space-sm) var(--space-md)}
  .metrics-grid{grid-template-columns:repeat(2,1fr);gap:var(--space-md)}
  .breakdown-grid{grid-template-columns:1fr;gap:var(--space-md)}
  .cta-2col{grid-template-columns:1fr}
  .evidence-table{font-size:10px}
  .evidence-table th,.evidence-table td{padding:var(--space-sm) var(--space-sm)}
  .evidence-table th:first-child{width:6%}
  .evidence-table th:nth-child(2){width:28%}
  .evidence-table th:nth-child(3){width:28%}
  .evidence-table th:nth-child(4){width:38%}
}

/* ── Version marker (debug) ── */
.version-marker{text-align:center;font-size:9px;color:#D1D5DB;padding:var(--space-sm) 0;font-family:var(--mono)}

/* ═══════════════════════════════════════════════════
   SEVERITY CHIPS
   ═══════════════════════════════════════════════════ */
.sev-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:${radiusSm};font-size:10px;font-weight:700;letter-spacing:0.4px;
  line-height:1.4;vertical-align:middle;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── Risk bar ── */
.risk-bar-track{height:6px;background:#E5E7EB;border-radius:3px;margin:var(--space-sm) 0 var(--space-sm);overflow:hidden;flex:1;min-width:80px}
.risk-bar-fill{height:100%;border-radius:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ═══════════════════════════════════════════════════
   BRAND BLOCK — prominent header element
   ═══════════════════════════════════════════════════ */
.brand-block{display:flex;align-items:flex-start;gap:14px;min-width:0;flex:1;max-width:100%}
.brand-logo{max-height:40px;max-width:200px;width:auto;height:auto;object-fit:contain;
  flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.brand-monogram{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  color:white;font-size:20px;font-weight:800;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.brand-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1;max-width:min(100%,420px)}
.brand-name{font-size:18px;font-weight:800;letter-spacing:-0.3px;margin:0;line-height:1.25;word-wrap:break-word;overflow-wrap:anywhere}

/* ═══════════════════════════════════════════════════
   COVER — shared structure
   ═══════════════════════════════════════════════════ */
.cover-page{padding:0;display:flex;flex-direction:column}

/* Header row */
.report-header{display:flex;align-items:flex-start;justify-content:space-between;padding:22px var(--space-xl) var(--space-md);flex-shrink:0;gap:var(--space-lg)}
.report-header-dark .brand-name{color:white}
.header-meta{display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-xs);flex-shrink:0;margin-left:var(--space-md)}
.header-date{font-size:12px;color:#9CA3AF}
.header-style-tag{font-size:10px;font-weight:600;padding:4px 12px;border:1px solid;border-radius:${radiusSm};letter-spacing:0.3px;white-space:nowrap}

/* Accent divider under header */
.header-divider{height:3px;margin:0 var(--space-xl);border-radius:2px;flex-shrink:0;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}

/* Main content row */
.cover-main{display:flex;flex:1;padding:var(--space-md) var(--space-xl) var(--space-lg);gap:var(--space-xl);align-items:flex-start}
.cover-main-left{flex:1.3}
.cover-main-right{flex:0.7;display:flex;justify-content:center;align-items:flex-start;padding-top:var(--space-sm)}

/* Footer row */
.cover-footer{display:flex;justify-content:space-between;padding:0 var(--space-xl) var(--space-lg);align-items:center;flex-shrink:0}
.cover-footer-dark{color:rgba(255,255,255,.3)}
.cover-footer-text{font-size:11px}
.cover-scanid{font-size:10px;color:#D1D5DB;font-family:var(--mono)}

/* ═══════════════════════════════════════════════════
   COVER — Premium (light, agency-grade)
   ═══════════════════════════════════════════════════ */
.cover-premium-light{background:var(--vn-surface);color:var(--vn-navy)}
.cover-accent-bar{height:4px;width:100%;background:linear-gradient(90deg,var(--primary) 0%,var(--vn-navy) 100%);
  flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.report-header-light{background:#fff;border-bottom:1px solid #E2E8F0}
.header-pill{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:4px 12px;border:1px solid;border-radius:999px}
.cover-main-light{background:linear-gradient(180deg,#FFFFFF 0%,var(--vn-surface) 55%);align-items:center;padding-top:var(--space-2xl);padding-bottom:var(--space-2xl)}
.cover-eyebrow{font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#64748B;margin-bottom:var(--space-sm)}
.cover-title-light{font-size:38px;font-weight:900;line-height:1.08;letter-spacing:-0.04em;color:var(--dark);margin-bottom:var(--space-md);max-width:12ch}
.cover-title-soft{color:#64748B;font-weight:700}
.cover-chip-row{display:flex;flex-wrap:wrap;gap:var(--space-sm);margin:var(--space-md) 0}
.cover-pill-ok,.cover-pill-eaa{display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.04em;border:1px solid #E2E8F0;background:#fff}
.cover-pill-eaa.eaa-yes{border-color:#A7F3D0;color:#065F46;background:#ECFDF5}
.cover-pill-eaa.eaa-warn{border-color:#FDE68A;color:#92400E;background:#FFFBEB}
.cover-meta-light{border-top:1px solid #E2E8F0;padding-top:var(--space-md);margin-top:var(--space-sm)}
.cover-meta-light .cover-meta-label{color:#94A3B8}
.cover-meta-light .cover-meta-value{color:var(--dark)}
.cover-summary-line{font-size:13px;color:#64748B;margin-top:var(--space-lg);line-height:1.55;max-width:52ch}
.cover-sev-pills{display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-top:var(--space-md)}
.csp{font-size:11px;font-weight:600;padding:6px 14px;border-radius:999px;background:#fff;border:1px solid #E2E8F0;color:#475569}
.csp strong{font-weight:800;margin-right:4px}
.csp-crit{border-color:#FECACA;color:#991B1B;background:#FEF2F2}
.csp-ser{border-color:#FED7AA;color:#9A3412;background:#FFF7ED}
.csp-mod{border-color:#FDE68A;color:#854D0E;background:#FFFBEB}
.csp-min{border-color:#E2E8F0;color:#475569;background:#F8FAFC}
.cover-score-panel{background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:24px var(--space-lg) 26px;
  box-shadow:0 4px 24px rgba(10,37,64,.08);text-align:center;min-width:260px;max-width:300px;overflow:hidden;box-sizing:border-box;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.csc-label-light{font-size:15px;font-weight:600;color:#475569;margin-top:var(--space-sm)}
.csc-meta-light{font-size:12px;color:#64748B;margin-top:var(--space-sm);line-height:1.5}
.csc-secondary-light{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:var(--space-sm);padding:8px 10px;border:1px solid #E2E8F0;border-radius:10px;background:#F8FAFC}
.csc-secondary-light span{font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#64748B;line-height:1.25}
.csc-secondary-light strong{font-size:18px;color:#0F172A;line-height:1}
.csc-secondary-light small{font-size:10px;color:#94A3B8;line-height:1.2}
.cover-footer-light{border-top:1px solid #E2E8F0;padding-top:var(--space-md);margin-top:auto;flex-wrap:wrap;gap:var(--space-sm)}
.cover-footer-corp{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-sm)}
.cover-scanid-light{font-size:10px;color:#94A3B8;font-family:var(--mono)}
.cover-credit-line{font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748B}
.cover-footer-custom{font-size:11px;color:#94A3B8;flex:1;text-align:right}

/* Legacy premium dark (unused — kept for class safety) */
.cover-title-prem{font-size:34px;font-weight:900;line-height:1.1;letter-spacing:-1.5px;color:white;margin-bottom:var(--space-sm)}
.cover-badges{display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:var(--space-md)}
.cover-kpi-strip{display:flex;gap:20px;margin-top:var(--space-md)}
.cover-kpi{text-align:center}
.cover-kpi-val{display:block;font-size:28px;font-weight:800;line-height:1.1}
.cover-kpi-lbl{font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:0.5px}
.cover-score-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);
  border-radius:16px;padding:var(--space-xl) var(--space-lg);text-align:center;backdrop-filter:blur(8px);
  box-shadow:0 2px 16px rgba(0,0,0,.15);min-width:220px;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.csc-label{font-size:14px;color:rgba(255,255,255,.7);margin-top:var(--space-xs)}
.csc-risk{font-size:13px;color:rgba(255,255,255,.5);margin-top:var(--space-sm)}
.csc-fix{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px}

/* ═══════════════════════════════════════════════════
   COVER — Corporate (white, clean)
   ═══════════════════════════════════════════════════ */
.cover-corp{background:white}
.cover-title-corp{font-size:28px;font-weight:700;line-height:1.15;color:${dark};letter-spacing:-0.5px;margin-bottom:var(--space-sm)}

/* ── Cover: Audit type label ── */
.cover-audit-label{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;color:#9CA3AF;margin-bottom:var(--space-sm)}

/* ── Cover: Hero domain block ── */
.cover-domain-block{display:flex;flex-direction:column;gap:3px;margin-bottom:var(--space-md)}
.cover-domain-label{font-size:9px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;color:#9CA3AF}
.cover-domain-value{font-size:20px;font-weight:600;line-height:1.3;overflow-wrap:anywhere;word-break:break-word}
.cover-domain-value-dark{color:white}

/* ── Cover: Meta grid ── */
.cover-meta-grid{display:grid;grid-template-columns:repeat(4,auto);gap:var(--space-sm) var(--space-lg);margin-bottom:var(--space-md)}
.cover-meta-grid-dark{border-top:1px solid rgba(255,255,255,.08);padding-top:var(--space-md);margin-top:var(--space-xs)}
.cover-meta-cell{display:flex;flex-direction:column;gap:2px}
.cover-meta-label{display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;font-weight:600}
.cover-meta-value{font-size:13px;font-weight:700;color:#374151}

/* ── Cover: Info summary line ── */
.cover-info-line{font-size:12px;color:#9CA3AF;margin-bottom:var(--space-sm);line-height:1.4}

/* ── Cover: Severity mini-bar ── */
.cover-severity-bar{display:flex;flex-wrap:wrap;align-items:baseline;gap:var(--space-xs) 10px;font-size:11px;color:#6B7280;margin-bottom:var(--space-md);line-height:1.4}
.csb-item{white-space:nowrap}
.csb-count{font-weight:700;font-variant-numeric:tabular-nums;margin-right:2px}
.csb-sep{color:#E5E7EB;font-size:8px}
.cover-severity-bar-dark{color:rgba(255,255,255,.5)}
.cover-severity-bar-dark .csb-sep{color:rgba(255,255,255,.15)}

.cover-score-card-corp{background:#F9FAFB;border:1px solid #B8BEC6;border-radius:12px;padding:24px 20px 26px;text-align:center;min-width:240px;max-width:300px;overflow:hidden;box-sizing:border-box;
  box-shadow:0 1px 4px rgba(0,0,0,.05);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.csc-score{font-size:52px;font-weight:900;line-height:1;display:inline}
.csc-of{font-size:20px;font-weight:400;color:#9CA3AF;display:inline}
.csc-grade{font-size:13px;color:#6B7280;margin:12px 0 16px}
.csc-bar-track{height:9px;background:#E5E7EB;border-radius:999px;overflow:hidden;width:100%;max-width:210px;margin:14px auto 16px}
.csc-bar-fill{height:100%;border-radius:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.csc-secondary{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:0;padding:8px 10px;border:1px solid #E5E7EB;border-radius:10px;background:#fff}
.csc-secondary span{font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#6B7280;line-height:1.25}
.csc-secondary strong{font-size:16px;color:#111827;line-height:1}
.csc-secondary small{font-size:9px;color:#9CA3AF;line-height:1.2}
.csc-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:10px 20px 0;border-top:1px solid #E5E7EB;font-size:10px;line-height:1.25;color:#64748B}
.csc-meta span{white-space:nowrap}

/* ═══════════════════════════════════════════════════
   SECTION TITLES — consistent spacing
   ═══════════════════════════════════════════════════ */
.section-title{font-size:${isC ? "20px" : "24px"};font-weight:${titleWeight};margin-bottom:var(--space-lg);padding-bottom:var(--space-sm);
  border-bottom:${isC ? "2px" : "3px"} solid var(--primary);letter-spacing:-0.5px}
.corp-title{border-bottom-width:2px}
.subsection-title{font-size:16px;font-weight:700;margin:var(--space-lg) 0 var(--space-md);color:#374151}

/* ═══════════════════════════════════════════════════
   EXECUTIVE SUMMARY — v3 hero + cards
   ═══════════════════════════════════════════════════ */
.exec-summary-page{padding-top:var(--space-xl)}
.exec-page-head{margin-bottom:var(--space-xl)}
.exec-eyebrow{font-size:10px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#64748B;margin-bottom:var(--space-sm)}
.exec-page-title{font-size:28px;font-weight:900;letter-spacing:-0.03em;line-height:1.15}
.exec-title-accent{height:3px;width:72px;margin-top:var(--space-md);border-radius:2px;
  background:linear-gradient(90deg,var(--primary),var(--vn-navy));-webkit-print-color-adjust:exact;print-color-adjust:exact}

.exec-hero-panel{display:flex;align-items:stretch;gap:var(--space-2xl);padding:var(--space-2xl);margin-bottom:var(--space-2xl);
  background:linear-gradient(145deg,#FFFFFF 0%,var(--vn-surface) 100%);border:1px solid #E2E8F0;border-radius:20px;
  box-shadow:0 8px 40px rgba(10,37,64,.06);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.exec-hero-scorecol{flex:0 0 200px;text-align:left}
.exec-mega-score{font-size:88px;font-weight:900;line-height:0.95;letter-spacing:-0.04em;font-variant-numeric:tabular-nums}
.exec-mega-sub{display:flex;align-items:center;gap:var(--space-sm);margin-top:var(--space-xs);flex-wrap:wrap}
.exec-mega-of{font-size:18px;font-weight:600;color:#94A3B8}
.exec-grade-pill{font-size:12px;font-weight:800;padding:4px 12px;border:2px solid;border-radius:999px;background:#fff}
.exec-mega-label{font-size:14px;font-weight:600;color:#475569;margin-top:var(--space-md)}
.exec-mega-bar{height:8px;background:#E2E8F0;border-radius:999px;margin-top:var(--space-md);overflow:hidden}
.exec-mega-bar-fill{height:100%;border-radius:999px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.exec-hero-copy{flex:1;min-width:0}
.exec-lead{font-size:14px;color:#475569;line-height:1.7;margin-bottom:var(--space-md)}
.exec-lead-bullets{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--space-sm)}
.exec-lead-bullets li{font-size:13px;color:#334155;padding-left:var(--space-lg);position:relative;line-height:1.55}
.exec-lead-bullets li::before{content:"";position:absolute;left:0;top:0.55em;width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--vn-navy))}

.exec-cards-premium{gap:var(--space-lg);margin-bottom:var(--space-2xl)}
.exec-card-premium{background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:var(--space-lg) var(--space-xl);
  box-shadow:0 2px 12px rgba(10,37,64,.04)}
.exec-card-premium h3{font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--dark);margin-bottom:var(--space-sm)}
.exec-card-premium p{font-size:13px;color:#475569;line-height:1.65;margin:0}
.exec-alert-inline{color:#B91C1C;font-weight:600}

.metrics-heading-premium{margin-top:var(--space-xl);font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--dark);opacity:0.85;font-weight:800}
.metrics-grid-premium{gap:var(--space-md)}
.metric-card-premium{border:1px solid #E2E8F0;border-radius:14px;padding:var(--space-lg) var(--space-sm);background:#FAFBFC}

/* Corporate + fallback executive widgets */
.exec-health-row{display:flex;align-items:center;gap:var(--space-lg);margin-bottom:var(--space-lg)}
.exec-health-badge{display:flex;align-items:center;gap:var(--space-md);border:3px solid;border-radius:var(--r);padding:var(--space-md) var(--space-lg);
  background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ehb-score{font-size:48px;font-weight:900;line-height:1}
.ehb-meta{display:flex;flex-direction:column;gap:var(--space-xs)}
.ehb-grade{font-size:15px;font-weight:700;color:#374151}
.ehb-label{font-size:13px;color:#6B7280;font-weight:500}
.vni-badge{display:flex;align-items:center;gap:16px;justify-content:center;background:linear-gradient(135deg,#FFFBEB,#FFFFFF 45%,#FEF3C7);border:1px solid #FCD34D;border-radius:12px;padding:18px;box-shadow:0 0 18px rgba(245,158,11,.18);overflow:hidden;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.vni-score{font-size:56px;font-weight:900;line-height:.95;color:#D97706;font-variant-numeric:tabular-nums}
.vni-copy{text-align:left;min-width:0}.vni-label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#92400E;font-weight:800;line-height:1.25;overflow-wrap:anywhere}.vni-label span{display:block;color:#A16207;font-weight:600;text-transform:none;letter-spacing:0;margin-top:2px}.vni-tier{font-size:21px;font-weight:900;color:#B45309;margin-top:6px;line-height:1.05;overflow-wrap:anywhere}.vni-stars{display:block;color:#D97706;letter-spacing:1px;font-size:14px;margin-top:4px}
.exec-health-detail{flex:1}
.exec-health-detail p{font-size:13px;color:#4B5563;margin-bottom:var(--space-xs);line-height:1.6}

.exec-cards{display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-lg)}
.exec-card{background:var(--card-bg);border-radius:var(--r);padding:var(--space-md) var(--space-lg);border:var(--card-border);box-shadow:var(--shadow)}
.exec-card h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:var(--space-sm);text-transform:uppercase;letter-spacing:0.5px}
.exec-card p{font-size:13px;color:#4B5563;margin-bottom:var(--space-xs);line-height:1.6}
.exec-risk-row{display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)}
.exec-risk-label{font-size:15px;font-weight:800;white-space:nowrap}

.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-md)}
.metric-card{background:white;border:var(--card-border);border-radius:var(--r);padding:var(--space-md) var(--space-sm);text-align:center;box-shadow:var(--shadow)}
.metric-value{font-size:26px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
.metric-label{font-size:10px;color:#6B7280;margin-top:var(--space-xs);text-transform:uppercase;letter-spacing:0.5px;font-weight:600}

/* Corporate summary table */
.corp-summary-table{width:100%;border-collapse:collapse;margin-bottom:var(--space-lg)}
.corp-summary-table td{padding:10px 14px;border:1px solid #D1D5DB;font-size:13px}
.cst-label{font-weight:600;color:#374151;background:#F9FAFB;width:120px;white-space:nowrap}
.corp-prose{margin-top:var(--space-md)}.corp-prose h3{font-size:14px;font-weight:700;margin-bottom:var(--space-sm);color:#374151}
.corp-prose p{font-size:13px;color:#4B5563;margin-bottom:var(--space-sm);line-height:1.6}

/* ═══════════════════════════════════════════════════
   VISUAL BREAKDOWN
   ═══════════════════════════════════════════════════ */
.breakdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)}
.breakdown-card{background:var(--card-bg);border-radius:var(--r);padding:var(--space-lg);border:var(--card-border);box-shadow:var(--shadow)}
.breakdown-card h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:var(--space-md);text-transform:uppercase;letter-spacing:0.5px}
.chart-center{display:flex;justify-content:center}
.progress-stack{display:flex;flex-direction:column;gap:var(--space-md);padding-top:var(--space-sm)}
.mt-24{margin-top:var(--space-lg)}

.donut-wrap{display:flex;align-items:center;gap:var(--space-md)}
.legend-col{display:flex;flex-direction:column;gap:var(--space-sm)}
.legend-row{display:flex;align-items:center;gap:var(--space-sm)}
.legend-chip{width:12px;height:12px;border-radius:3px;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.legend-label{font-size:12px;color:#374151;font-weight:500}
.legend-val{font-size:12px;color:#6B7280;font-variant-numeric:tabular-nums}

.pbar-row{display:flex;align-items:center;gap:var(--space-sm)}
.pbar-label{font-size:12px;font-weight:500;color:#374151;min-width:70px}
.pbar-track{flex:1;background:${isC ? "#E5E7EB" : "#F3F4F6"};border-radius:7px;overflow:hidden}
.pbar-fill{transition:width .3s;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pbar-val{font-size:12px;font-weight:700;min-width:40px;text-align:right;font-variant-numeric:tabular-nums}

.status-table{width:100%;border-collapse:collapse}
.status-table td{padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}
.status-table td:first-child{font-weight:600;color:#374151}
.status-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:var(--space-sm);vertical-align:middle;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.quality-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-md);margin-top:var(--space-md)}
.quality-card{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:18px;box-shadow:0 4px 18px rgba(10,37,64,.05)}
.quality-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748B;font-weight:800;margin-bottom:10px}
.quality-card strong{display:block;font-size:28px;color:#111827;margin-bottom:14px}
.quality-meter{height:9px;background:#E5E7EB;border-radius:999px;overflow:hidden}
.quality-meter span{display:block;height:100%;border-radius:999px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.paradox-banner{display:flex;justify-content:space-between;gap:16px;align-items:center;background:#FFFBEB;border:1px solid #FCD34D;border-radius:14px;padding:16px 18px;color:#92400E;margin-bottom:18px}
.paradox-banner strong{font-size:15px}.paradox-banner span{font-size:13px;color:#78350F}
.worst-page-card{margin-top:18px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;display:flex;gap:12px;align-items:center;justify-content:space-between}
.worst-page-card span{font-size:12px;color:#475569;max-width:65%;overflow-wrap:anywhere}.worst-page-card em{font-style:normal;color:#B45309;font-weight:800}
.ai-table{width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden}
.ai-table th{background:#F8FAFC;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#475569;padding:10px;border-bottom:1px solid #E2E8F0}
.ai-table td{padding:10px;border-bottom:1px solid #EEF2F7;font-size:12px;vertical-align:top;color:#374151}
.ai-url{font-family:var(--mono);font-size:10px;color:#64748B;overflow-wrap:anywhere}

.maturity-indicator{display:flex;gap:var(--space-sm);margin-top:var(--space-md)}
.maturity-step{flex:1;text-align:center;padding:var(--space-md) var(--space-xs);border-radius:var(--rs);border:2px solid #E5E7EB;font-size:11px;color:#9CA3AF}
.maturity-step.active{background:var(--card-bg)}
.maturity-dot{width:12px;height:12px;border-radius:50%;margin:0 auto var(--space-sm);-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ═══════════════════════════════════════════════════
   AUDIT CARDS (premium)
   ═══════════════════════════════════════════════════ */
.issues-list{display:flex;flex-direction:column;gap:var(--space-lg)}
.audit-card{border:var(--card-border);border-radius:var(--r);box-shadow:var(--shadow);page-break-inside:avoid}
.ac-header{display:flex;align-items:flex-start;gap:var(--space-sm);padding:var(--space-md) var(--space-md);background:var(--card-bg);border-bottom:var(--card-border)}
.ac-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;color:white;
  font-size:12px;font-weight:700;flex-shrink:0;background:var(--primary);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ac-title{font-size:14px;font-weight:700;color:var(--dark);flex:1;min-width:0;
  white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.4}
.ac-body{padding:var(--space-md)}
.ac-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-md)}
.ac-section{margin-bottom:var(--space-sm)}
.ac-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;font-weight:700;margin-bottom:var(--space-xs)}
.ac-section p{font-size:12px;color:#374151;line-height:1.6}
.ac-footer{display:flex;flex-wrap:wrap;gap:var(--space-sm);padding-top:var(--space-sm);border-top:1px solid #F3F4F6}
.ac-chip{font-size:10px;padding:2px 8px;border-radius:var(--rs);background:#F3F4F6;color:#6B7280;font-weight:600}
.ac-chip-wcag{background:#F0FDFA;color:#0f172a}
.ac-tech-row{margin-top:var(--space-sm);font-size:10px;color:#9CA3AF}
.ac-tech-label{font-weight:600}
.ac-tech-row code{font-family:var(--mono);font-size:10px;background:#F3F4F6;padding:1px 4px;border-radius:3px}

/* ═══════════════════════════════════════════════════
   FINDINGS TABLE (corporate)
   ═══════════════════════════════════════════════════ */
.findings-table{width:100%;border-collapse:collapse;font-size:12px}
.findings-table th{background:#F3F4F6;padding:var(--space-sm) 10px;text-align:left;font-weight:700;border:1px solid #D1D5DB;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.findings-table td{padding:var(--space-sm) 10px;border:1px solid #D1D5DB;vertical-align:top}
.findings-table tbody tr:nth-child(even){background:#FAFAFA}
.ft-sev{font-weight:700;font-size:10px;letter-spacing:0.3px}
.ft-title{font-weight:600;white-space:normal;overflow-wrap:anywhere;word-break:break-word}
.ft-desc{font-size:11px;color:#4B5563;white-space:normal;overflow-wrap:anywhere;word-break:break-word}
.ft-num{text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums}

/* ═══════════════════════════════════════════════════
   ISSUE DETAIL CARDS (corporate full-text)
   ═══════════════════════════════════════════════════ */
.issue-detail-card{border-radius:var(--r);padding:var(--space-lg) var(--space-lg);margin-bottom:var(--space-lg);page-break-inside:avoid;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.idc-header{display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:var(--space-md)}
.idc-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;
  font-size:11px;font-weight:700;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.idc-title{font-size:14px;font-weight:700;color:var(--dark);flex:1;min-width:0;
  white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.4}
.idc-meta{font-size:11px;color:#6B7280;white-space:nowrap}
.idc-body{display:flex;flex-direction:column;gap:var(--space-md)}
.idc-section{margin:0}
.idc-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;font-weight:700;margin-bottom:var(--space-xs)}
.idc-section p{font-size:12px;color:#374151;line-height:1.6;margin:0}
.idc-elements{display:flex;flex-direction:column;gap:var(--space-sm);margin-top:var(--space-xs)}
.idc-element{display:flex;gap:var(--space-sm);align-items:flex-start}
.idc-el-num{font-size:11px;font-weight:700;color:#6B7280;min-width:18px;flex-shrink:0}
.idc-el-body{flex:1;min-width:0}
.idc-el-selector{font-size:11px;color:#374151;margin-bottom:2px}
.idc-el-selector code,.idc-el-html code{font-family:var(--mono);font-size:10px;background:rgba(0,0,0,.04);
  padding:2px 6px;border-radius:3px;display:inline-block;max-width:100%;overflow-wrap:anywhere;word-break:break-all;line-height:1.5}
.idc-el-html{font-size:10px;color:#6B7280}
.idc-more{font-size:11px;color:#9CA3AF;font-style:italic;margin-top:var(--space-xs)}
.idc-rule{font-size:10px;color:#9CA3AF;margin-top:var(--space-sm);padding-top:var(--space-sm);border-top:1px solid rgba(0,0,0,.06)}
.idc-rule code{font-family:var(--mono);font-size:10px;background:#F3F4F6;padding:1px 4px;border-radius:3px}

.empty-state{text-align:center;padding:var(--space-2xl) var(--space-lg);color:#6B7280;font-size:16px}

/* ═══════════════════════════════════════════════════
   TOP PRIORITY FIXES
   ═══════════════════════════════════════════════════ */
.tpf-section{margin-top:var(--space-lg);page-break-inside:avoid}
.tpf-table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:12px;margin-top:var(--space-sm);border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;background:white}
.tpf-table th{background:#F8FAFC;padding:12px 8px;text-align:left;font-weight:750;border-bottom:1px solid #E5E7EB;
  font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;line-height:1.25}
.tpf-table td{padding:12px 8px;border-bottom:1px solid #E5E7EB;vertical-align:middle;line-height:1.4}
.tpf-table tbody tr:nth-child(even){background:#F8FAFC}
.tpf-table tbody tr:last-child td{border-bottom:none}
.tpf-col-rank{width:34px}.tpf-col-issue{width:auto}.tpf-col-severity{width:102px}.tpf-col-elements{width:70px}.tpf-col-effort{width:104px}
.tpf-rank{text-align:center;font-weight:800;color:#64748B;font-variant-numeric:tabular-nums}
.tpf-title{font-weight:650;color:#1F2937;overflow-wrap:anywhere;word-break:normal;hyphens:auto}
.tpf-severity{text-align:left}
.tpf-num{text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums;color:#334155;font-weight:700}
.tpf-effort{white-space:nowrap;color:#475569;font-weight:650;font-variant-numeric:tabular-nums}
.tpf-effort-label{display:inline-flex;align-items:center;margin-right:4px;color:#94A3B8;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em}
.tpf-heading-premium{font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:var(--dark);font-weight:800;margin-top:var(--space-2xl)}
.tpf-table-premium{border-color:#E2E8F0;box-shadow:0 2px 16px rgba(10,37,64,.05)}
.tpf-table-premium th{background:var(--primary);color:#fff;border:none;padding:12px 8px;font-size:9px;letter-spacing:0.08em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.tpf-table-premium td{border-color:#F1F5F9}
.tpf-table-premium tbody tr:nth-child(even){background:var(--vn-surface)}
.tpf-table-premium tbody tr:hover{background:#F1F5F9}

/* ═══════════════════════════════════════════════════
   COVERAGE NOTE
   ═══════════════════════════════════════════════════ */
.coverage-note{margin-top:var(--space-lg);padding:var(--space-sm) var(--space-md);background:#FFF7ED;border:1px solid #FED7AA;border-radius:var(--rs);
  font-size:11px;color:#92400E;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ═══════════════════════════════════════════════════
   WCAG COMPLIANCE MATRIX
   ═══════════════════════════════════════════════════ */
.matrix-legend{display:flex;flex-wrap:wrap;gap:var(--space-sm) var(--space-lg);margin-bottom:var(--space-md);padding:var(--space-sm) var(--space-md);background:#F9FAFB;border:1px solid #E5E7EB;border-radius:var(--rs);
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.ml-item{display:inline-flex;align-items:center;gap:var(--space-sm);font-size:11px;color:#374151}
.matrix-summary{font-size:13px;color:#4B5563;margin-bottom:var(--space-md);line-height:1.6}
.wcag-matrix-table{width:100%;border-collapse:collapse;font-size:12px}
.wcag-matrix-table th{background:#F3F4F6;padding:var(--space-sm) 10px;text-align:left;font-weight:700;border:1px solid #D1D5DB;
  font-size:10px;text-transform:uppercase;letter-spacing:0.3px}
.wcag-matrix-table td{padding:var(--space-sm) 10px;border:1px solid #E5E7EB;vertical-align:middle}
.wcag-matrix-table tbody tr:nth-child(even){background:#FAFAFA}
.wcag-row-fail{background:#FEF2F2!important}
.wcag-criterion{font-weight:500;color:#374151}
.wcag-level{text-align:center}
.wcag-level-badge{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:var(--rs);background:#F0FDFA;color:#0f172a;
  font-size:10px;font-weight:700;min-width:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wcag-status-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:var(--rs);font-size:10px;font-weight:700;
  letter-spacing:0.3px;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wcag-count{text-align:center;font-weight:600;font-variant-numeric:tabular-nums}

/* ═══════════════════════════════════════════════════
   SCAN CONFIGURATION
   ═══════════════════════════════════════════════════ */
.scan-config-table{width:100%;border-collapse:collapse}
.scan-config-table td{padding:10px var(--space-md);border-bottom:1px solid #E5E7EB;font-size:13px}
.sct-label{font-weight:600;color:#374151;width:160px;background:#F9FAFB}
.scan-config-table code{font-family:var(--mono);font-size:11px;background:#F3F4F6;padding:2px 6px;border-radius:var(--rs);line-height:1.5}
.scan-page-row{font-size:11px;line-height:1.55;padding:2px 0;overflow-wrap:anywhere;word-break:break-word}
.scan-page-row span{color:#6B7280;margin-left:6px}

/* ═══════════════════════════════════════════════════
   AI VISION AUDIT TABLE
   ═══════════════════════════════════════════════════ */
.ai-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:var(--space-sm)}
.ai-table th{background:#F3F4F6;padding:var(--space-sm) 10px;text-align:left;font-weight:700;border:1px solid #D1D5DB;font-size:10px;text-transform:uppercase;letter-spacing:0.3px}
.ai-table td{padding:var(--space-sm) 10px;border:1px solid #E5E7EB;vertical-align:top;font-size:11px}
.ai-table tbody tr:nth-child(even){background:#FAFAFA}
.ai-table tbody tr.ai-row-mismatch{background:#FEF2F2!important}
.ai-url{font-family:var(--mono);font-size:9px;color:#6B7280;overflow-wrap:anywhere;word-break:break-all;line-height:1.5}
.ai-score-match{color:#16A34A}
.ai-score-mismatch{color:#DC2626}
.section-intro{font-size:13px;color:#4B5563;line-height:1.6;margin-bottom:var(--space-md)}

/* ═══════════════════════════════════════════════════
   TABLE OF CONTENTS
   ═══════════════════════════════════════════════════ */
.toc-nav{display:flex;flex-direction:column;gap:0}
.toc-entry{display:block;padding:var(--space-sm) var(--space-md);font-size:13px;color:#374151;text-decoration:none;border-bottom:1px solid #F3F4F6;transition:background .15s}
.toc-entry:hover{background:#F9FAFB}
.toc-level-2{font-weight:600;padding-left:var(--space-md)}
.toc-level-3{font-weight:400;padding-left:var(--space-xl);font-size:12px;color:#6B7280}

/* ═══════════════════════════════════════════════════
   EVIDENCE TABLES — hardened layout
   ═══════════════════════════════════════════════════ */
.ev-chunk-label{font-weight:400;color:#9CA3AF;font-size:10px}
.evidence-table{width:100%;max-width:100%;border-collapse:collapse;font-size:11px;margin-top:var(--space-sm);margin-bottom:var(--space-md);table-layout:fixed}
.evidence-table th{background:#F3F4F6;padding:var(--space-sm) var(--space-sm);text-align:left;font-weight:700;border:1px solid #E5E7EB;
  font-size:10px;text-transform:uppercase;letter-spacing:0.3px}
.evidence-table th:first-child{width:5%}
.evidence-table th:nth-child(2){width:25%}
.evidence-table th:nth-child(3){width:25%}
.evidence-table th:nth-child(4){width:45%}
.evidence-table td{padding:var(--space-sm) var(--space-sm);border:1px solid #E5E7EB;vertical-align:top;font-size:10px;min-height:32px;line-height:1.6}
.evidence-table tbody tr:nth-child(even){background:#FAFAFA}
.ev-num{text-align:center;font-weight:600;color:#6B7280;width:5%;font-variant-numeric:tabular-nums}
.ev-url{font-family:var(--mono);font-size:9px;color:#6B7280;overflow-wrap:anywhere;word-break:break-all;line-height:1.5;hyphens:auto}
.ev-mono{font-family:var(--mono);font-size:9px;color:#374151;
  white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-all;line-height:1.6;hyphens:auto}
.ev-failure{margin-top:6px;padding-top:6px;border-top:1px dashed #CBD5E1;color:#7F1D1D;white-space:pre-wrap}
.evidence-screenshots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:8px 0 14px}
.evidence-shot{margin:0;border:1px solid #E5E7EB;border-radius:8px;background:#F8FAFC;overflow:hidden;break-inside:avoid}
.evidence-shot-img{display:block;width:100%;height:118px;object-fit:cover;background:#FFFFFF;border-bottom:1px solid #E5E7EB}
.evidence-shot figcaption{padding:6px 8px;font-family:var(--mono);font-size:8px;color:#64748B;line-height:1.4;overflow-wrap:anywhere;word-break:break-all}

/* ═══════════════════════════════════════════════════
   COMPLIANCE & LEGAL
   ═══════════════════════════════════════════════════ */
.legal-grid{display:flex;flex-direction:column;gap:var(--space-md)}
.legal-card{background:var(--card-bg);border-radius:var(--r);padding:var(--space-lg);border:var(--card-border);box-shadow:var(--shadow)}
.legal-card h3{font-size:13px;font-weight:700;color:#374151;margin-bottom:var(--space-sm);text-transform:uppercase;letter-spacing:0.5px}
.legal-card p{font-size:13px;color:#4B5563;margin-bottom:var(--space-sm);line-height:1.6}
.legal-card ul{margin:var(--space-sm) 0 0 var(--space-lg);font-size:13px;color:#4B5563}
.legal-card li{margin-bottom:var(--space-xs)}
.eaa-context{font-size:12px;color:#6B7280;margin-bottom:var(--space-md);line-height:1.55}
.eaa-badge-hint{font-size:12px;color:#6B7280;margin-bottom:var(--space-md);line-height:1.55}
.eaa-badge{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #E5E7EB;font-size:11px;font-weight:600;margin-right:8px;vertical-align:middle}
.eaa-two-col{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin:var(--space-md) 0}
@media print{.eaa-two-col{grid-template-columns:1fr 1fr}}
.eaa-note{background:rgba(0,0,0,.025);padding:var(--space-md);border-radius:var(--r-sm);margin:var(--space-md) 0}
.eaa-note p{font-size:13px;margin-bottom:var(--space-xs)}
.eaa-note p:last-child{margin-bottom:0}
.eaa-learn-more{font-size:12px;margin-top:var(--space-md)}
.eaa-learn-more a{text-decoration:underline}
.audit-table{width:100%;border-collapse:collapse}
.audit-table td{padding:var(--space-sm) var(--space-md);border-bottom:1px solid #E5E7EB;font-size:13px}
.audit-table td:first-child{font-weight:600;color:#374151;width:140px}
.audit-table code{font-family:var(--mono);font-size:11px;background:#F3F4F6;padding:2px 6px;border-radius:var(--rs)}

/* ═══════════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════════ */
.cta-page{display:flex;align-items:center;justify-content:center}
.cta-2col{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl);align-items:start;max-width:700px;width:100%}
.cta-left h2{font-size:22px;font-weight:${titleWeight};margin-bottom:var(--space-sm)}
.cta-left p{font-size:13px;color:#4B5563;line-height:1.6;margin-bottom:var(--space-md)}
.cta-trust,.cta-bullets{list-style:none;padding:0;margin:0 0 var(--space-md)}
.cta-trust li,.cta-bullets li{font-size:12px;color:#374151;padding:var(--space-xs) 0;padding-left:var(--space-md);position:relative}
.cta-trust li::before,.cta-bullets li::before{content:"\\2713";position:absolute;left:0;color:var(--primary);font-weight:700}
.cta-contact{font-size:12px;color:#6B7280}.cta-contact a{color:var(--primary)}
.cta-right{display:flex;flex-direction:column;align-items:center;gap:var(--space-md)}
.cta-footer-text{font-size:11px;color:#D1D5DB;margin-top:var(--space-md);text-align:center}

.cta-button{display:inline-block;padding:var(--space-md) var(--space-xl);color:white;border-radius:var(--r);font-size:14px;font-weight:700;
  text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.12);-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ═══════════════════════════════════════════════════
   RUNNING HEADER/FOOTER (enterprise)
   ═══════════════════════════════════════════════════ */
.running-header,.running-footer{display:none}

/* ═══════════════════════════════════════════════════
   PRINT & PDF — professional polish
   ═══════════════════════════════════════════════════ */
@media print{
  body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;counter-reset:report-page}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{box-shadow:none;margin:0;border-radius:0;width:100%;min-height:auto;padding:18mm 16mm 20mm;page-break-after:always;position:relative;counter-increment:report-page}
  .page::after{content:"Page " counter(report-page);position:absolute;right:10mm;bottom:8mm;font-size:9px;color:#94A3B8;font-weight:600;letter-spacing:0.04em;z-index:2;pointer-events:none}
  .cover-page::after{right:10mm;bottom:8mm}
  .cover-page{padding:0}
  .cover-page .report-header{padding:18px 16mm 14px}
  .cover-page .header-divider{margin:0 16mm}
  .cover-page .cover-main{padding:18px 16mm}
  .cover-page .cover-footer{padding:0 16mm 14px}
  .cover-premium-light{background:var(--vn-surface)!important}
  .exec-hero-panel,.cover-score-panel{box-shadow:none!important}
  .cta-button{border:2px solid var(--primary);color:var(--primary)!important;background:transparent!important}
  .version-marker{display:block}
  /* No fixed running header — avoids duplicate domain/date on cover; domain appears in section content */
  .running-header{display:none!important}
  .running-footer{display:flex;position:fixed;bottom:0;left:0;right:0;justify-content:space-between;align-items:center;padding:0 16mm 7mm;font-size:8px;color:#B0B5BD;font-weight:400;letter-spacing:0.2px;z-index:100}
  .rf-center{position:absolute;left:50%;transform:translateX(-50%)}
  .running-footer .rf-right{display:none!important}
  /* Evidence table hardening */
  .evidence-table{max-width:100%;table-layout:fixed}
  .evidence-table thead{display:table-header-group}
  .evidence-table tr{page-break-inside:avoid}
  .evidence-table td,.evidence-table th{padding:6px 8px}
  /* Card protection */
  .audit-card,.issue-detail-card{page-break-inside:avoid}
  .breakdown-card,.legal-card,.exec-card{page-break-inside:avoid}
  /* Orphan header prevention */
  .section-title,.subsection-title{page-break-after:avoid}
  .ac-header,.idc-header{page-break-after:avoid}
  h3{page-break-after:avoid}
  /* Table header repeat */
  .tpf-table thead,.wcag-matrix-table thead,.findings-table thead{display:table-header-group}
  .tpf-table tr,.wcag-matrix-table tr,.findings-table tr{page-break-inside:avoid}
  .toc-entry{border-bottom:1px solid #E5E7EB}
  /* Prevent widows/orphans in prose */
  p{orphans:3;widows:3}
}
`;
}
