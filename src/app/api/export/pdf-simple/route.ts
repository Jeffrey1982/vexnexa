import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Violation, computeIssueStats, getTopViolations } from "@/lib/axe-types";
import { formatDate } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits, addPageUsage } from "@/lib/billing/entitlements";
import {
  getScanTrendData,
  getBenchmarkComparison,
  getScanComparison,
  calculateWCAGCompliance
} from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    // Check authentication and limits
    const user = await requireAuth();
    
    await assertWithinLimits({
      userId: user.id,
      action: "export_pdf",
      pages: 1
    });

    const { scanId } = await req.json();

    if (!scanId) {
      return NextResponse.json({ error: "Scan ID is required" }, { status: 400 });
    }

    // Fetch scan data
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: {
          include: {
            user: true,
          },
        },
        page: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Get white-label settings for branding
    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { userId: user.id }
    });

    // Use white-label branding or fallback to TutusPorta
    const brandName = whiteLabel?.companyName || 'TutusPorta';
    const brandLogo = whiteLabel?.logoUrl;
    const primaryColor = whiteLabel?.primaryColor || '#3b82f6';
    const secondaryColor = whiteLabel?.secondaryColor || '#1e40af';

    // Extract violations
    let violations: Violation[] = [];
    if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
      violations = (scan.raw as any).violations || [];
    }

    const stats = computeIssueStats(violations);
    const topViolations = getTopViolations(violations, 20);
    const siteUrl = scan.page?.url || scan.site.url;

    // Get enhanced analytics for PDF
    const benchmarkComparison = await getBenchmarkComparison({
      score: scan.score || 0,
      impactCritical: scan.impactCritical,
      impactSerious: scan.impactSerious,
      impactModerate: scan.impactModerate,
      impactMinor: scan.impactMinor,
    });

    const scanComparison = await getScanComparison(scan.id);
    const wcagAACompliance = calculateWCAGCompliance(violations, "AA");
    const wcagAAACompliance = calculateWCAGCompliance(violations, "AAA");

    // Get score category and description
    const getScoreInfo = (score: number) => {
      if (score >= 90) return { category: 'score-excellent', label: 'Excellent', description: 'Your website meets most accessibility standards with minimal issues.' };
      if (score >= 75) return { category: 'score-good', label: 'Good', description: 'Your website has good accessibility with some areas for improvement.' };
      if (score >= 60) return { category: 'score-fair', label: 'Fair', description: 'Your website has moderate accessibility issues that should be addressed.' };
      if (score >= 40) return { category: 'score-poor', label: 'Poor', description: 'Your website has significant accessibility barriers that need attention.' };
      return { category: 'score-critical', label: 'Critical', description: 'Your website has serious accessibility issues requiring immediate action.' };
    };

    const scoreInfo = getScoreInfo(scan.score || 0);

    // Generate beautiful HTML for PDF conversion
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
            @page {
                margin: 15mm;
                size: A4;
                @top-center {
                    content: "${brandName} Accessibility Report";
                    font-size: 10px;
                    color: #6b7280;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                @bottom-center {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10px;
                    color: #6b7280;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: #1f2937;
                line-height: 1.6;
                background: white;
            }

            /* Header Section */
            .header {
                background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
                color: white;
                padding: 40px;
                text-align: center;
                margin-bottom: 40px;
            }

            .logo {
                font-size: 32px;
                font-weight: 800;
                letter-spacing: -1px;
                margin-bottom: 16px;
            }

            .logo::before {
                content: '🛡️';
                margin-right: 12px;
                font-size: 28px;
            }

            .report-title {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .report-subtitle {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 300;
            }

            /* Score Hero Section */
            .score-hero {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                margin-bottom: 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border: 1px solid #e2e8f0;
            }

            .score-circle {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: 800;
                color: white;
                position: relative;
            }

            .score-excellent { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
            .score-good { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); }
            .score-fair { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); }
            .score-poor { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
            .score-critical { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

            .score-label {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 8px;
            }

            .score-description {
                font-size: 14px;
                color: #6b7280;
                max-width: 400px;
                margin: 0 auto;
            }

            /* Metrics Grid */
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 40px;
            }

            .metric-card {
                background: white;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
                position: relative;
            }

            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                border-radius: 12px 12px 0 0;
            }

            .metric-card.wcag::before { background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); }
            .metric-card.performance::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
            .metric-card.seo::before { background: linear-gradient(90deg, #06b6d4, #0891b2); }
            .metric-card.issues::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

            .metric-icon {
                font-size: 20px;
                margin-bottom: 8px;
                display: block;
                opacity: 0.8;
            }

            .metric-value {
                font-size: 24px;
                font-weight: 800;
                color: #1f2937;
                margin-bottom: 4px;
                line-height: 1;
            }

            .metric-label {
                font-size: 11px;
                color: #6b7280;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Section Styling */
            .section {
                margin-bottom: 40px;
            }

            .section-title {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-title::before {
                content: '';
                width: 4px;
                height: 24px;
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                border-radius: 2px;
            }

            /* Impact Cards */
            .impact-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
                margin-bottom: 30px;
            }

            .impact-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border: 2px solid transparent;
            }

            .impact-icon {
                font-size: 16px;
                margin-bottom: 8px;
                display: block;
            }

            .impact-value {
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 4px;
                line-height: 1;
            }

            .impact-label {
                font-size: 10px;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 1px;
            }

            .critical {
                color: #dc2626;
                border-color: #fecaca;
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            }

            .serious {
                color: #ea580c;
                border-color: #fed7aa;
                background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            }

            .moderate {
                color: #d97706;
                border-color: #fde68a;
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            }

            .minor {
                color: #6b7280;
                border-color: #e5e7eb;
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            }

            /* Violations Section */
            .violations-container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
                margin-bottom: 30px;
            }

            .violations-header {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                padding: 16px 20px;
                border-bottom: 1px solid #e5e7eb;
            }

            .violations-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0;
            }

            .violation-item {
                padding: 20px;
                border-bottom: 1px solid #f1f5f9;
            }

            .violation-item:last-child {
                border-bottom: none;
            }

            .violation-header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 12px;
            }

            .violation-impact-badge {
                flex-shrink: 0;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .violation-impact-badge.critical {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            .violation-impact-badge.serious {
                background: #fff7ed;
                color: #ea580c;
                border: 1px solid #fed7aa;
            }

            .violation-impact-badge.moderate {
                background: #fffbeb;
                color: #d97706;
                border: 1px solid #fde68a;
            }

            .violation-impact-badge.minor {
                background: #f9fafb;
                color: #6b7280;
                border: 1px solid #e5e7eb;
            }

            .violation-content {
                flex: 1;
            }

            .violation-title {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 6px;
                line-height: 1.4;
            }

            .violation-description {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.5;
                margin-bottom: 10px;
            }

            .violation-elements {
                font-size: 11px;
                color: #9ca3af;
                background: #f9fafb;
                padding: 6px 10px;
                border-radius: 6px;
                border-left: 3px solid #e5e7eb;
                font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            }

            /* Website Info */
            .website-info {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 30px;
                border: 1px solid #bfdbfe;
            }

            .website-url {
                font-size: 14px;
                color: #1e40af;
                font-weight: 500;
                word-break: break-all;
            }

            .scan-date {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }

            /* Footer */
            .footer {
                margin-top: 60px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 11px;
            }

            .footer-logo {
                font-weight: 600;
                color: ${primaryColor};
                margin-bottom: 4px;
            }

            /* Page Break Controls */
            .page-break {
                page-break-before: always;
                break-before: always;
            }

            .avoid-break {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .section {
                margin-bottom: 40px;
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .metric-card {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .impact-card {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .violation-item {
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 8px;
            }

            .violations-container {
                page-break-inside: auto;
                break-inside: auto;
            }

            /* Ensure grids don't break poorly */
            .metrics-grid {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .impact-grid {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            /* Print optimizations */
            @media print {
                .score-hero,
                .metric-card,
                .violations-container,
                .website-info {
                    box-shadow: none !important;
                }

                /* Ensure proper spacing between sections */
                .section {
                    margin-bottom: 30px;
                }

                /* Prevent orphaned headers */
                .section-title {
                    page-break-after: avoid;
                    break-after: avoid;
                }

                .violations-header {
                    page-break-after: avoid;
                    break-after: avoid;
                }

                /* Control violation item spacing */
                .violation-item {
                    margin-bottom: 0;
                    padding: 15px;
                }

                /* Ensure website info doesn't break awkwardly */
                .website-info {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .score-hero {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            }
            </style>
        </head>
        <body>
            <!-- Header -->
            <div class="header">
                <div class="logo">${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="height: 40px; width: auto; margin-bottom: 12px;" />` : (whiteLabel ? brandName : '🛡️ ' + brandName)}</div>
                <div class="report-title">Accessibility Compliance Report</div>
                <div class="report-subtitle">Comprehensive WCAG Analysis & Remediation Guide</div>
            </div>

            <!-- Website Info -->
            <div class="website-info avoid-break">
                <div class="website-url">${siteUrl}</div>
                <div class="scan-date">Scanned on ${formatDate(scan.createdAt)} • Generated on ${formatDate(new Date())}</div>
            </div>

            <!-- Score Hero -->
            <div class="score-hero avoid-break">
                <div class="score-circle ${scoreInfo.category}">
                    ${scan.score || 0}
                </div>
                <div class="score-label">${scoreInfo.label} Accessibility Score</div>
                <div class="score-description">${scoreInfo.description}</div>
            </div>

            <!-- Metrics Grid -->
            <div class="section avoid-break">
                <div class="metrics-grid">
                    <div class="metric-card wcag">
                        <div class="metric-icon">📋</div>
                        <div class="metric-value">${wcagAACompliance}%</div>
                        <div class="metric-label">WCAG 2.1 AA</div>
                    </div>
                    <div class="metric-card performance">
                        <div class="metric-icon">⚡</div>
                        <div class="metric-value">${scan.performanceScore || 'N/A'}</div>
                        <div class="metric-label">Performance</div>
                    </div>
                    <div class="metric-card seo">
                        <div class="metric-icon">🔍</div>
                        <div class="metric-value">${scan.seoScore || 'N/A'}</div>
                        <div class="metric-label">SEO Score</div>
                    </div>
                    <div class="metric-card issues">
                        <div class="metric-icon">⚠️</div>
                        <div class="metric-value">${stats.total}</div>
                        <div class="metric-label">Total Issues</div>
                    </div>
                </div>
            </div>

            <!-- Impact Breakdown -->
            <div class="section avoid-break">
                <div class="section-title">Issue Severity Breakdown</div>
                <div class="impact-grid">
                    <div class="impact-card critical">
                        <div class="impact-icon">🔴</div>
                        <div class="impact-value">${stats.critical}</div>
                        <div class="impact-label">Critical</div>
                    </div>
                    <div class="impact-card serious">
                        <div class="impact-icon">🟠</div>
                        <div class="impact-value">${stats.serious}</div>
                        <div class="impact-label">Serious</div>
                    </div>
                    <div class="impact-card moderate">
                        <div class="impact-icon">🟡</div>
                        <div class="impact-value">${stats.moderate}</div>
                        <div class="impact-label">Moderate</div>
                    </div>
                    <div class="impact-card minor">
                        <div class="impact-icon">⚪</div>
                        <div class="impact-value">${stats.minor}</div>
                        <div class="impact-label">Minor</div>
                    </div>
                </div>
            </div>

        ${scan.performanceScore ? `
        <div class="section avoid-break">
            <div class="section-title">Performance & SEO Analysis</div>
            <div class="metrics-grid">
                <div class="metric-card performance">
                    <div class="metric-icon">⚡</div>
                    <div class="metric-value">${scan.performanceScore}/100</div>
                    <div class="metric-label">Performance Score</div>
                </div>
                <div class="metric-card seo">
                    <div class="metric-icon">🔍</div>
                    <div class="metric-value">${scan.seoScore || 0}/100</div>
                    <div class="metric-label">SEO Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🖼️</div>
                    <div class="metric-value">${Math.round(scan.altTextCoverage || 0)}%</div>
                    <div class="metric-label">Alt Text Coverage</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🔗</div>
                    <div class="metric-value">${Math.round(scan.linkAccessibility || 0)}%</div>
                    <div class="metric-label">Link Accessibility</div>
                </div>
            </div>
        </div>
        ` : ''}

        ${scan.adaRiskLevel ? `
        <div class="section avoid-break">
            <div class="section-title">Legal Compliance Assessment</div>
            <div class="metrics-grid">
                <div class="metric-card issues">
                    <div class="metric-icon">⚖️</div>
                    <div class="metric-value" style="color: ${
                        scan.adaRiskLevel === 'CRITICAL' ? '#dc2626' :
                        scan.adaRiskLevel === 'HIGH' ? '#ea580c' :
                        scan.adaRiskLevel === 'MEDIUM' ? '#d97706' : '#059669'
                    }">${scan.adaRiskLevel}</div>
                    <div class="metric-label">ADA Risk Level</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">📊</div>
                    <div class="metric-value">${Math.round(scan.legalRiskScore || 0)}/100</div>
                    <div class="metric-label">Legal Risk Score</div>
                </div>
                <div class="metric-card wcag">
                    <div class="metric-icon">📋</div>
                    <div class="metric-value">${Math.round(scan.wcag21Compliance || 0)}%</div>
                    <div class="metric-label">WCAG 2.1 Compliance</div>
                </div>
                <div class="metric-card wcag">
                    <div class="metric-icon">📋</div>
                    <div class="metric-value">${Math.round(scan.wcag22Compliance || 0)}%</div>
                    <div class="metric-label">WCAG 2.2 Compliance</div>
                </div>
            </div>
        </div>
        ` : ''}

            <!-- Top Issues -->
            ${topViolations.length > 0 ? `
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">Priority Issues Requiring Attention</div>
                <div class="violations-container">
                    <div class="violations-header">
                        <div class="violations-title">Top ${topViolations.length} Most Critical Issues</div>
                    </div>
                    ${topViolations.slice(0, 10).map((violation, index) => `
                        <div class="violation-item">
                            <div class="violation-header">
                                <div class="violation-impact-badge ${violation.impact?.toLowerCase() || 'minor'}">${violation.impact || 'Minor'}</div>
                                <div class="violation-content">
                                    <div class="violation-title">${index + 1}. ${violation.help || 'Accessibility Issue'}</div>
                                    <div class="violation-description">${violation.description || 'No description available.'}</div>
                                    <div class="violation-elements">
                                        Affects ${violation.nodes?.length || 0} element${(violation.nodes?.length || 0) !== 1 ? 's' : ''}: ${violation.nodes?.slice(0, 3).map(node => node.target.join(' > ')).join(', ') || 'No selectors available'}${(violation.nodes?.length || 0) > 3 ? ` and ${(violation.nodes?.length || 0) - 3} more...` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

        ${benchmarkComparison ? `
        <div class="section avoid-break">
            <div class="section-title">Industry Benchmark Comparison</div>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">🎯</div>
                    <div class="metric-value">${benchmarkComparison.userScore}/100</div>
                    <div class="metric-label">Your Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">📈</div>
                    <div class="metric-value">${benchmarkComparison.industryAvg.toFixed(1)}/100</div>
                    <div class="metric-label">Industry Average</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">${benchmarkComparison.difference >= 0 ? '📈' : '📉'}</div>
                    <div class="metric-value" style="color: ${benchmarkComparison.difference >= 0 ? '#059669' : '#DC2626'}">${benchmarkComparison.difference >= 0 ? '+' : ''}${benchmarkComparison.difference.toFixed(1)}</div>
                    <div class="metric-label">Difference</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🏆</div>
                    <div class="metric-value">${benchmarkComparison.category === 'above_average' ? 'Above Avg' : benchmarkComparison.category === 'below_average' ? 'Below Avg' : 'Average'}</div>
                    <div class="metric-label">Performance</div>
                </div>
            </div>
        </div>
        ` : ''}

        ${scanComparison.previous && scanComparison.changes ? `
        <div class="section avoid-break">
            <div class="section-title">Progress Since Previous Scan</div>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">${scanComparison.changes.score >= 0 ? '📈' : '📉'}</div>
                    <div class="metric-value" style="color: ${scanComparison.changes.score >= 0 ? '#059669' : '#DC2626'}">${scanComparison.changes.score >= 0 ? '+' : ''}${scanComparison.changes.score}</div>
                    <div class="metric-label">Score Change</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🔴</div>
                    <div class="metric-value" style="color: ${scanComparison.changes.critical <= 0 ? '#059669' : '#DC2626'}">${scanComparison.changes.critical >= 0 ? '+' : ''}${scanComparison.changes.critical}</div>
                    <div class="metric-label">Critical Change</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">✅</div>
                    <div class="metric-value" style="color: #059669">${scanComparison.changes.issuesFixed}</div>
                    <div class="metric-label">Issues Fixed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🚨</div>
                    <div class="metric-value" style="color: #DC2626">${scanComparison.changes.newIssues}</div>
                    <div class="metric-label">New Issues</div>
                </div>
            </div>
        </div>
        ` : ''}

            <!-- Footer -->
            <div class="footer">
                <div class="footer-logo">${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="height: 16px; width: auto; margin-right: 8px; vertical-align: middle;" />` : (whiteLabel ? '' : '🛡️ ')}${brandName} Accessibility Platform</div>
                <div>This report was generated automatically using axe-core accessibility testing engine.</div>
                <div>For detailed remediation guidance, visit your dashboard${whiteLabel?.supportEmail ? ` or contact ${whiteLabel.supportEmail}` : (whiteLabel ? '' : ' or contact our accessibility experts')}.</div>
            </div>
        </body>
        </html>
    `;

    // Return HTML content that can be converted to PDF by the browser
    // Track usage
    await addPageUsage(user.id, 1);

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="tutusporta-${scanId}-report.html"`,
      },
    });

  } catch (error) {
    console.error("Report generation failed:", error);
    
    // Handle billing errors
    if (error instanceof Error) {
      if ((error as any).code === "UPGRADE_REQUIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "UPGRADE_REQUIRED",
            feature: (error as any).feature
          },
          { status: 402 }
        );
      }
      
      if ((error as any).code === "LIMIT_REACHED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "LIMIT_REACHED",
            limit: (error as any).limit,
            current: (error as any).current
          },
          { status: 429 }
        );
      }
      
      if ((error as any).code === "TRIAL_EXPIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "TRIAL_EXPIRED"
          },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}