import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Violation, computeIssueStats, getTopViolations } from "@/lib/axe-types";
import { formatDate } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits, addPageUsage } from "@/lib/billing/entitlements";
import { calculateWCAGCompliance } from "@/lib/analytics";

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
    const siteUrl = scan.page?.url || scan.site.url;
    const wcagAACompliance = calculateWCAGCompliance(violations, "AA");

    // Get score category and description
    const getScoreInfo = (score: number) => {
      if (score >= 90) return { category: 'excellent', label: 'Excellent', description: 'Your website meets most accessibility standards with minimal issues.' };
      if (score >= 75) return { category: 'good', label: 'Good', description: 'Your website has good accessibility with some areas for improvement.' };
      if (score >= 60) return { category: 'fair', label: 'Fair', description: 'Your website has moderate accessibility issues that should be addressed.' };
      if (score >= 40) return { category: 'poor', label: 'Poor', description: 'Your website has significant accessibility barriers that need attention.' };
      return { category: 'critical', label: 'Critical', description: 'Your website has serious accessibility issues requiring immediate action.' };
    };

    const scoreInfo = getScoreInfo(scan.score || 0);

    // Generate beautiful HTML for PDF conversion
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${brandName} - Accessibility Report</title>
            <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

            @page {
                margin: 15mm;
                size: A4;
                @top-center {
                    content: "${brandName} Accessibility Report";
                    font-size: 10px;
                    color: #64748b;
                    font-family: 'Inter', sans-serif;
                    font-weight: 500;
                }
                @bottom-center {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10px;
                    color: #64748b;
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                }
            }

            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                margin: 0;
                padding: 0;
                color: #0f172a;
                line-height: 1.6;
                background: #ffffff;
                font-size: 14px;
                -webkit-font-smoothing: antialiased;
            }

            /* Beautiful Header */
            .header {
                background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                margin-bottom: 30px;
                border-radius: 0 0 15px 15px;
                position: relative;
                overflow: hidden;
            }

            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255,255,255,0.03) 10px,
                    rgba(255,255,255,0.03) 20px
                );
                z-index: 1;
            }

            .header-content {
                position: relative;
                z-index: 2;
            }

            .logo {
                font-size: 24px;
                font-weight: 800;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: white;
            }

            .logo-icon {
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .report-title {
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 8px;
                color: white;
            }

            .report-subtitle {
                font-size: 14px;
                opacity: 0.9;
                color: white;
                font-weight: 400;
            }

            /* Website Info */
            .website-info {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 25px;
                border: 1px solid #bfdbfe;
            }

            .website-url {
                font-size: 16px;
                color: #1e40af;
                font-weight: 600;
                word-break: break-all;
                margin-bottom: 5px;
            }

            .scan-date {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
            }

            /* Score Hero */
            .score-hero {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-radius: 15px;
                padding: 35px;
                text-align: center;
                margin-bottom: 30px;
                border: 2px solid #e2e8f0;
                position: relative;
                overflow: hidden;
            }

            .score-hero::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
                z-index: 1;
            }

            .score-hero-content {
                position: relative;
                z-index: 2;
            }

            .score-circle {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                font-weight: 900;
                color: white;
                position: relative;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }

            .score-circle::before {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent);
                z-index: -1;
            }

            .score-excellent {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            .score-good {
                background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
            }
            .score-fair {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }
            .score-poor {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            }
            .score-critical {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }

            .score-label {
                font-size: 22px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 10px;
            }

            .score-description {
                font-size: 14px;
                color: #475569;
                max-width: 400px;
                margin: 0 auto;
                line-height: 1.5;
            }

            /* Metrics Grid */
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }

            .metric-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                border: 2px solid #e2e8f0;
                position: relative;
                overflow: hidden;
            }

            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                border-radius: 10px 10px 0 0;
            }

            .metric-card.wcag::before { background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); }
            .metric-card.performance::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
            .metric-card.seo::before { background: linear-gradient(90deg, #06b6d4, #0891b2); }
            .metric-card.issues::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

            .metric-content {
                position: relative;
                z-index: 1;
            }

            .metric-icon {
                font-size: 18px;
                margin-bottom: 8px;
                display: block;
                opacity: 0.8;
            }

            .metric-value {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 5px;
                line-height: 1;
            }

            .metric-label {
                font-size: 10px;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Section Styling */
            .section {
                margin-bottom: 30px;
            }

            .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-title::before {
                content: '';
                width: 4px;
                height: 20px;
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                border-radius: 2px;
            }

            /* Impact Cards */
            .impact-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 25px;
            }

            .impact-card {
                background: white;
                border-radius: 10px;
                padding: 18px;
                text-align: center;
                border: 2px solid transparent;
                position: relative;
            }

            .impact-icon {
                font-size: 14px;
                margin-bottom: 6px;
                display: block;
            }

            .impact-value {
                font-size: 24px;
                font-weight: 800;
                margin-bottom: 4px;
                line-height: 1;
            }

            .impact-label {
                font-size: 9px;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.8px;
            }

            .critical {
                color: #dc2626;
                border-color: #fca5a5;
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            }

            .serious {
                color: #ea580c;
                border-color: #fdba74;
                background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            }

            .moderate {
                color: #d97706;
                border-color: #fcd34d;
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            }

            .minor {
                color: #64748b;
                border-color: #cbd5e1;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            }

            /* Violations Section */
            .violations-container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                border: 2px solid #e2e8f0;
                margin-bottom: 25px;
            }

            .violations-header {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                padding: 15px 20px;
                border-bottom: 1px solid #e2e8f0;
            }

            .violations-title {
                font-size: 16px;
                font-weight: 700;
                color: #0f172a;
                margin: 0;
            }

            .violation-item {
                padding: 18px;
                border-bottom: 1px solid #f1f5f9;
            }

            .violation-item:last-child {
                border-bottom: none;
            }

            .violation-header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 10px;
            }

            .violation-impact-badge {
                flex-shrink: 0;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 8px;
                font-weight: 700;
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
                color: #64748b;
                border: 1px solid #e5e7eb;
            }

            .violation-content {
                flex: 1;
            }

            .violation-title {
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
                margin-bottom: 5px;
                line-height: 1.3;
            }

            .violation-description {
                font-size: 12px;
                color: #64748b;
                line-height: 1.4;
                margin-bottom: 8px;
            }

            .violation-elements {
                font-size: 10px;
                color: #9ca3af;
                background: #f8fafc;
                padding: 6px 8px;
                border-radius: 4px;
                border-left: 2px solid #e2e8f0;
                font-family: 'JetBrains Mono', 'Consolas', monospace;
            }

            /* Footer */
            .footer {
                margin-top: 40px;
                padding-top: 15px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 10px;
            }

            .footer-logo {
                font-weight: 600;
                color: ${primaryColor};
                margin-bottom: 3px;
            }

            /* Page Break Controls */
            .page-break {
                page-break-before: always;
            }

            .avoid-break {
                page-break-inside: avoid;
            }

            /* Print optimizations */
            @media print {
                body {
                    background: white !important;
                }

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
            <!-- Beautiful Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo">
                        ${brandLogo ?
                            `<div class="logo-icon"><img src="${brandLogo}" alt="${brandName}" style="height: 16px; width: auto;" /></div>` :
                            `<div class="logo-icon">🛡️</div>`
                        }
                        <span>${brandName}</span>
                    </div>
                    <div class="report-title">Accessibility Compliance Report</div>
                    <div class="report-subtitle">Professional WCAG Analysis & Assessment</div>
                </div>
            </div>

            <!-- Website Info -->
            <div class="website-info">
                <div class="website-url">${siteUrl}</div>
                <div class="scan-date">Scanned on ${formatDate(scan.createdAt)} • Generated on ${formatDate(new Date())}</div>
            </div>

            <!-- Score Hero -->
            <div class="score-hero avoid-break">
                <div class="score-hero-content">
                    <div class="score-circle score-${scoreInfo.category}">
                        ${scan.score || 0}
                    </div>
                    <div class="score-label">${scoreInfo.label} Accessibility Score</div>
                    <div class="score-description">${scoreInfo.description}</div>
                </div>
            </div>

            <!-- Metrics Grid -->
            <div class="metrics-grid avoid-break">
                <div class="metric-card wcag">
                    <div class="metric-content">
                        <div class="metric-icon">📋</div>
                        <div class="metric-value">${wcagAACompliance}%</div>
                        <div class="metric-label">WCAG 2.1 AA</div>
                    </div>
                </div>
                <div class="metric-card performance">
                    <div class="metric-content">
                        <div class="metric-icon">⚡</div>
                        <div class="metric-value">${scan.performanceScore || 'N/A'}</div>
                        <div class="metric-label">Performance</div>
                    </div>
                </div>
                <div class="metric-card seo">
                    <div class="metric-content">
                        <div class="metric-icon">🔍</div>
                        <div class="metric-value">${scan.seoScore || 'N/A'}</div>
                        <div class="metric-label">SEO Score</div>
                    </div>
                </div>
                <div class="metric-card issues">
                    <div class="metric-content">
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

            <!-- Footer -->
            <div class="footer">
                <div class="footer-logo">${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="height: 12px; width: auto; margin-right: 4px; vertical-align: middle;" />` : '🛡️ '}${brandName} Accessibility Platform</div>
                <div>This report was generated automatically using axe-core accessibility testing engine.</div>
                <div>For detailed remediation guidance, visit your dashboard${whiteLabel?.supportEmail ? ` or contact ${whiteLabel.supportEmail}` : ''}.</div>
            </div>
        </body>
        </html>
    `;

    // Record usage
    await addPageUsage(user.id, 1);

    // Return HTML content that can be converted to PDF by the browser
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${brandName}-accessibility-report-${new Date().toISOString().split('T')[0]}.html"`,
      },
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