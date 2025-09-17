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
    const topViolations = getTopViolations(violations, 10);

    // Calculate WCAG compliance
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
    const siteUrl = scan.page?.url || scan.site.url;

    // Calculate business impact metrics for sales-focused reporting
    const calculateBusinessImpact = (score: number, violations: Violation[]) => {
      const criticalCount = violations.filter(v => v.impact === 'critical').length;
      const seriousCount = violations.filter(v => v.impact === 'serious').length;

      // Estimate potential revenue impact (conservative estimates)
      const estimatedMonthlyVisitors = 10000; // Conservative baseline
      const averageConversionRate = 2.5; // Industry average
      const averageOrderValue = 150; // Conservative estimate

      // Accessibility barriers typically reduce conversion by 20-40%
      const conversionReduction = Math.min(40, (criticalCount * 5) + (seriousCount * 2));
      const monthlyRevenueLoss = Math.round(
        (estimatedMonthlyVisitors * (averageConversionRate / 100) * averageOrderValue * (conversionReduction / 100))
      );

      // Legal risk assessment
      const getRiskLevel = () => {
        if (criticalCount > 5 || score < 40) return { level: 'CRITICAL', color: '#dc2626', description: 'High lawsuit risk' };
        if (criticalCount > 2 || score < 60) return { level: 'HIGH', color: '#ea580c', description: 'Significant legal exposure' };
        if (criticalCount > 0 || score < 75) return { level: 'MEDIUM', color: '#d97706', description: 'Moderate risk level' };
        return { level: 'LOW', color: '#059669', description: 'Minimal legal risk' };
      };

      const riskAssessment = getRiskLevel();

      return {
        monthlyRevenueLoss,
        annualRevenueLoss: monthlyRevenueLoss * 12,
        riskAssessment,
        conversionReduction,
        userExclusionPercentage: Math.min(25, criticalCount * 2 + seriousCount),
        seoImpact: score < 70 ? 'Negative SEO impact likely' : 'Minimal SEO impact'
      };
    };

    const businessImpact = calculateBusinessImpact(scan.score || 0, violations);

    // Generate beautiful HTML for PDF conversion
    const html = `
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

            /* Business Impact Styling */
            .business-impact {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border: 2px solid #fecaca;
                border-radius: 16px;
                padding: 30px;
                margin-bottom: 30px;
            }

            .impact-highlight {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #dc2626;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .revenue-loss {
                font-size: 32px;
                font-weight: 800;
                color: #dc2626;
                text-align: center;
                margin: 16px 0;
            }

            .risk-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: white;
                margin: 8px 0;
            }

            .competitive-analysis {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                padding: 25px;
                margin: 20px 0;
            }

            .action-items {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 1px solid #bbf7d0;
                border-radius: 12px;
                padding: 25px;
                margin: 20px 0;
            }

            .action-item {
                display: flex;
                align-items: flex-start;
                margin: 12px 0;
                padding: 12px;
                background: white;
                border-radius: 8px;
                border-left: 3px solid #22c55e;
            }

            .action-priority {
                background: #22c55e;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                margin-right: 12px;
                min-width: 50px;
                text-align: center;
            }

            .urgency-banner {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 12px;
                margin: 20px 0;
                font-weight: 600;
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

            /* Page Break */
            .page-break {
                page-break-before: always;
            }

            /* Print optimizations */
            @media print {
                .score-hero,
                .metric-card,
                .violations-container,
                .website-info {
                    box-shadow: none !important;
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
            <div class="website-info">
                <div class="website-url">${siteUrl}</div>
                <div class="scan-date">Scanned on ${formatDate(scan.createdAt)} • Generated on ${formatDate(new Date())}</div>
            </div>

            <!-- Score Hero -->
            <div class="score-hero">
                <div class="score-circle ${scoreInfo.category}">
                    ${scan.score || 0}
                </div>
                <div class="score-label">${scoreInfo.label} Accessibility Score</div>
                <div class="score-description">${scoreInfo.description}</div>
            </div>

            <!-- Metrics Grid -->
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

            <!-- Impact Breakdown -->
            <div class="section">
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

            <!-- Business Impact Analysis -->
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">📊 Business Impact Analysis</div>

                ${businessImpact.riskAssessment.level !== 'LOW' ? `
                <div class="urgency-banner">
                    ⚠️ IMMEDIATE ACTION REQUIRED: Your website accessibility issues are costing you customers and creating legal liability
                </div>
                ` : ''}

                <div class="business-impact">
                    <h3 style="color: #dc2626; font-size: 20px; margin-bottom: 16px; text-align: center;">💰 Revenue Impact Assessment</h3>

                    <div class="impact-highlight">
                        <div style="text-align: center;">
                            <div style="font-size: 16px; color: #6b7280; margin-bottom: 8px;">Estimated Monthly Revenue Loss</div>
                            <div class="revenue-loss">$${businessImpact.monthlyRevenueLoss.toLocaleString()}</div>
                            <div style="font-size: 20px; font-weight: 600; color: #dc2626;">Annual Loss: $${businessImpact.annualRevenueLoss.toLocaleString()}</div>
                        </div>
                        <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-radius: 8px;">
                            <div style="font-size: 14px; color: #374151;">
                                <strong>Why you're losing money:</strong><br>
                                • ${businessImpact.conversionReduction}% reduction in conversion rates<br>
                                • ${businessImpact.userExclusionPercentage}% of potential customers cannot properly use your site<br>
                                • ${businessImpact.seoImpact}<br>
                                • Damaged brand reputation and customer trust
                            </div>
                        </div>
                    </div>
                </div>

                <div class="competitive-analysis">
                    <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 16px;">🏆 Competitive Disadvantage</h3>
                    <div style="font-size: 14px; color: #374151; line-height: 1.6;">
                        <p><strong>Your competitors with accessible websites are:</strong></p>
                        <ul style="margin: 16px 0; padding-left: 20px;">
                            <li>Capturing customers you're losing to accessibility barriers</li>
                            <li>Ranking higher in search results (Google prioritizes accessible sites)</li>
                            <li>Building stronger brand reputation and customer loyalty</li>
                            <li>Avoiding costly lawsuits and legal fees</li>
                            <li>Expanding their market reach to disabled users (26% of population)</li>
                        </ul>
                        <p style="font-weight: 600; color: #dc2626;">Every day you delay accessibility improvements, you're handing revenue to competitors.</p>
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 16px;">⚖️ Legal Risk Assessment</h3>
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="font-weight: 600; margin-right: 12px;">Risk Level:</span>
                        <span class="risk-badge" style="background-color: ${businessImpact.riskAssessment.color};">${businessImpact.riskAssessment.level}</span>
                    </div>
                    <div style="font-size: 14px; color: #374151;">
                        <p><strong>${businessImpact.riskAssessment.description}</strong></p>
                        <ul style="margin: 12px 0; padding-left: 20px;">
                            <li>ADA lawsuit filings increased 320% in recent years</li>
                            <li>Average lawsuit settlement: $75,000 - $400,000</li>
                            <li>Legal fees typically range from $50,000 - $150,000</li>
                            <li>Businesses often forced to rebuild entire website</li>
                        </ul>
                        <p style="font-weight: 600;">Note: This report can serve as evidence of known accessibility issues in legal proceedings.</p>
                    </div>
                </div>
            </div>

            <!-- Top Issues -->
            ${topViolations.length > 0 ? `
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">Priority Issues Requiring Attention</div>
                <div class="violations-container">
                    <div class="violations-header">
                        <div class="violations-title">Top ${topViolations.length} Most Critical Issues</div>
                    </div>
                    ${topViolations.map((violation, index) => `
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

            <!-- Actionable Recommendations -->
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">🚀 Immediate Action Plan & ROI Projections</div>

                <div class="action-items">
                    <h3 style="color: #059669; font-size: 18px; margin-bottom: 20px;">✅ Recommended Next Steps</h3>

                    <div class="action-item">
                        <div class="action-priority" style="background: #dc2626;">HIGH</div>
                        <div>
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Immediate Critical Issue Resolution</div>
                            <div style="font-size: 13px; color: #6b7280;">Address ${stats.critical} critical and ${stats.serious} serious accessibility violations within 30 days</div>
                        </div>
                    </div>

                    <div class="action-item">
                        <div class="action-priority" style="background: #f59e0b;">MED</div>
                        <div>
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Comprehensive Accessibility Audit</div>
                            <div style="font-size: 13px; color: #6b7280;">Full website audit including user testing with disabled users</div>
                        </div>
                    </div>

                    <div class="action-item">
                        <div class="action-priority" style="background: #22c55e;">LOW</div>
                        <div>
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Ongoing Accessibility Monitoring</div>
                            <div style="font-size: 13px; color: #6b7280;">Implement automated testing and staff training programs</div>
                        </div>
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #7dd3fc; border-radius: 12px; padding: 25px; margin: 20px 0;">
                    <h3 style="color: #0369a1; font-size: 18px; margin-bottom: 16px;">💎 Investment ROI Analysis</h3>
                    <div style="font-size: 14px; color: #374151;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0;">
                            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 800; color: #0369a1;">$${(businessImpact.annualRevenueLoss * 0.7).toLocaleString()}</div>
                                <div style="font-size: 12px; color: #6b7280;">Potential Annual Revenue Recovery</div>
                            </div>
                            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 800; color: #059669;">3-6 months</div>
                                <div style="font-size: 12px; color: #6b7280;">Typical ROI Payback Period</div>
                            </div>
                        </div>
                        <p><strong>Why accessibility improvements pay for themselves:</strong></p>
                        <ul style="margin: 12px 0; padding-left: 20px;">
                            <li>Increased conversion rates (typically 20-30% improvement)</li>
                            <li>Expanded customer base (+26% potential market reach)</li>
                            <li>Improved SEO rankings and organic traffic</li>
                            <li>Enhanced brand reputation and customer loyalty</li>
                            <li>Legal protection and risk mitigation</li>
                        </ul>
                    </div>
                </div>

                ${whiteLabel ? `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #92400e; font-size: 16px; margin-bottom: 12px;">📞 Ready to Get Started?</h3>
                    <div style="font-size: 14px; color: #78350f;">
                        <p style="margin-bottom: 8px;"><strong>Contact ${brandName} for a free consultation:</strong></p>
                        ${whiteLabel.supportEmail ? `<p>Email: ${whiteLabel.supportEmail}</p>` : ''}
                        ${whiteLabel.phone ? `<p>Phone: ${whiteLabel.phone}</p>` : ''}
                        ${whiteLabel.website ? `<p>Website: ${whiteLabel.website}</p>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-logo">${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="height: 16px; width: auto; margin-right: 8px; vertical-align: middle;" />` : (whiteLabel ? '' : '🛡️ ')}${brandName} Accessibility Platform</div>
                <div>This report was generated automatically using axe-core accessibility testing engine.</div>
                <div>For detailed remediation guidance, visit your dashboard${whiteLabel?.supportEmail ? ` or contact ${whiteLabel.supportEmail}` : (whiteLabel ? '' : ' or contact our accessibility experts')}.</div>
            </div>
        </body>
        </html>
    `;

    // Record usage
    await addPageUsage(user.id, 1);

    // Return HTML response (client-side will handle PDF generation)
    return NextResponse.json({
      success: true,
      html: html,
      filename: `accessibility-report-${scan.site.url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    });

  } catch (error: any) {
    console.error("PDF export error:", error);

    if (error.code === "TRIAL_EXPIRED") {
      return NextResponse.json(
        {
          error: error.message,
          code: "TRIAL_EXPIRED"
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}