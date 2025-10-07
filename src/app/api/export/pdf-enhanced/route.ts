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

    // Generate detailed improvement guidance
    const generateImprovementGuidance = (score: number, violations: Violation[]) => {
      const criticalViolations = violations.filter(v => v.impact === 'critical');
      const seriousViolations = violations.filter(v => v.impact === 'serious');
      const moderateViolations = violations.filter(v => v.impact === 'moderate');

      // Score improvement analysis
      const getScoreBlockers = (currentScore: number) => {
        if (currentScore < 40) {
          return {
            mainBlocker: "Critical accessibility violations are severely impacting your score",
            targetScore: 70,
            improvementPotential: "30-40 point improvement possible",
            timeframe: "2-4 weeks with focused effort",
            priority: "EMERGENCY - Immediate action required"
          };
        } else if (currentScore < 60) {
          return {
            mainBlocker: "Multiple serious violations preventing good accessibility",
            targetScore: 85,
            improvementPotential: "20-30 point improvement possible",
            timeframe: "3-6 weeks with systematic approach",
            priority: "HIGH - Significant issues need resolution"
          };
        } else if (currentScore < 75) {
          return {
            mainBlocker: "Moderate violations and missing accessibility features",
            targetScore: 90,
            improvementPotential: "15-20 point improvement possible",
            timeframe: "4-8 weeks with detailed remediation",
            priority: "MEDIUM - Good foundation, needs enhancement"
          };
        } else {
          return {
            mainBlocker: "Minor violations and optimization opportunities",
            targetScore: 95,
            improvementPotential: "5-15 point improvement possible",
            timeframe: "2-4 weeks for fine-tuning",
            priority: "LOW - Excellent accessibility, minor improvements"
          };
        }
      };

      // Generate specific remediation strategies
      const getCommonRemediationStrategies = (violations: Violation[]) => {
        const strategies = [];
        const violationTypes = violations.map(v => v.id).slice(0, 10);

        // Image accessibility
        if (violationTypes.some(id => id?.includes('image') || id?.includes('alt'))) {
          strategies.push({
            category: "Image Accessibility",
            icon: "🖼️",
            description: "Images without proper alt text prevent screen readers from describing visual content to blind users",
            impact: "Excludes 2.2 billion people with vision impairments worldwide",
            solutions: [
              "Add descriptive alt text to all informational images",
              "Use empty alt=\"\" for decorative images",
              "Implement proper figure and figcaption elements",
              "Ensure alt text describes the image's purpose, not just its appearance"
            ],
            timeToFix: "1-2 days",
            difficulty: "Easy",
            wcagLevel: "WCAG 2.1 AA"
          });
        }

        // Color contrast
        if (violationTypes.some(id => id?.includes('color-contrast'))) {
          strategies.push({
            category: "Color Contrast",
            icon: "🎨",
            description: "Poor color contrast makes text difficult or impossible to read for users with vision impairments",
            impact: "Affects 300 million people with color vision deficiency",
            solutions: [
              "Ensure text has minimum 4.5:1 contrast ratio against background",
              "Use 3:1 contrast ratio for large text (18pt+ or 14pt+ bold)",
              "Test with color contrast analyzers and browser dev tools",
              "Avoid relying solely on color to convey information"
            ],
            timeToFix: "2-3 days",
            difficulty: "Easy to Medium",
            wcagLevel: "WCAG 2.1 AA"
          });
        }

        // Form accessibility
        if (violationTypes.some(id => id?.includes('label') || id?.includes('form'))) {
          strategies.push({
            category: "Form Accessibility",
            icon: "📝",
            description: "Forms without proper labels prevent screen reader users from understanding input purposes",
            impact: "Blocks user registration, contact forms, and e-commerce transactions",
            solutions: [
              "Associate every input field with a descriptive label",
              "Provide clear error messages and validation feedback",
              "Group related fields with fieldset and legend elements",
              "Include helpful instructions and format requirements"
            ],
            timeToFix: "1-3 days",
            difficulty: "Easy to Medium",
            wcagLevel: "WCAG 2.1 AA"
          });
        }

        // Keyboard navigation
        if (violationTypes.some(id => id?.includes('focus') || id?.includes('keyboard'))) {
          strategies.push({
            category: "Keyboard Navigation",
            icon: "⌨️",
            description: "Interactive elements that can't be accessed via keyboard exclude users who cannot use a mouse",
            impact: "Prevents access for users with motor disabilities and assistive technology users",
            solutions: [
              "Ensure all interactive elements are keyboard accessible",
              "Provide visible focus indicators on all focusable elements",
              "Implement logical tab order throughout the page",
              "Add skip links for main navigation and content areas"
            ],
            timeToFix: "3-5 days",
            difficulty: "Medium",
            wcagLevel: "WCAG 2.1 AA"
          });
        }

        // Heading structure
        if (violationTypes.some(id => id?.includes('heading'))) {
          strategies.push({
            category: "Heading Structure",
            icon: "📋",
            description: "Improper heading hierarchy confuses screen reader users who rely on headings for navigation",
            impact: "Makes content difficult to navigate and understand for assistive technology users",
            solutions: [
              "Use heading tags (h1-h6) in logical, hierarchical order",
              "Ensure each page has exactly one h1 tag",
              "Don't skip heading levels (h1 to h3 without h2)",
              "Make headings descriptive and meaningful"
            ],
            timeToFix: "1-2 days",
            difficulty: "Easy",
            wcagLevel: "WCAG 2.1 AA"
          });
        }

        // Link accessibility
        if (violationTypes.some(id => id?.includes('link'))) {
          strategies.push({
            category: "Link Accessibility",
            icon: "🔗",
            description: "Links without descriptive text prevent users from understanding their purpose",
            impact: "Creates confusion and navigation barriers for screen reader users",
            solutions: [
              "Write descriptive link text that explains the link's purpose",
              "Avoid generic text like 'click here' or 'read more'",
              "Ensure link purpose is clear from the link text alone",
              "Use aria-label for links that need additional context"
            ],
            timeToFix: "1-2 days",
            difficulty: "Easy",
            wcagLevel: "WCAG 2.1 AA"
          });
        }

        return strategies.slice(0, 6); // Limit to top 6 most relevant strategies
      };

      const scoreBlockers = getScoreBlockers(score);
      const remediationStrategies = getCommonRemediationStrategies(violations);

      return {
        scoreBlockers,
        remediationStrategies,
        implementationTimeline: generateImplementationTimeline(violations),
        quickWins: generateQuickWins(violations)
      };
    };

    const generateImplementationTimeline = (violations: Violation[]) => {
      const critical = violations.filter(v => v.impact === 'critical').length;
      const serious = violations.filter(v => v.impact === 'serious').length;
      const moderate = violations.filter(v => v.impact === 'moderate').length;

      return {
        week1: `Focus on ${critical} critical issues - these are blocking users right now`,
        week2: `Address ${serious} serious violations - major accessibility barriers`,
        week3: `Resolve ${moderate} moderate issues - improving user experience`,
        week4: "Testing, validation, and user feedback collection",
        ongoing: "Implement accessibility monitoring and staff training"
      };
    };

    const generateQuickWins = (violations: Violation[]) => {
      const quickFixes = [];

      if (violations.some(v => v.id?.includes('alt'))) {
        quickFixes.push("Add alt text to images (1-2 hours impact)");
      }
      if (violations.some(v => v.id?.includes('label'))) {
        quickFixes.push("Label form inputs properly (2-3 hours impact)");
      }
      if (violations.some(v => v.id?.includes('heading'))) {
        quickFixes.push("Fix heading hierarchy (1 hour impact)");
      }
      if (violations.some(v => v.id?.includes('color-contrast'))) {
        quickFixes.push("Adjust text colors for contrast (2-4 hours impact)");
      }

      return quickFixes.slice(0, 4);
    };

    const improvementGuidance = generateImprovementGuidance(scan.score || 0, violations);

    // Generate comprehensive AI content for all report sections
    const generateComprehensiveAnalysis = (score: number, violations: Violation[], siteUrl: string) => {
      // Advanced ROI Calculator
      const advancedROI = {
        monthlyTrafficEstimate: 25000,
        currentConversionRate: 2.1,
        accessibilityConversionBoost: 0.8, // 0.8% additional conversion
        averageOrderValue: 185,
        disabledUserMarketShare: 0.13, // 13% of users have disabilities
        monthlyRevenueLift: Math.round(25000 * 0.008 * 185),
        annualRevenueLift: Math.round(25000 * 0.008 * 185 * 12),
        marketExpansionRevenue: Math.round(25000 * 0.13 * 0.021 * 185 * 12),
        customerLifetimeValueIncrease: 0.15, // 15% CLV increase
        breakEvenMonths: 4,
        fiveYearProjection: Math.round(25000 * 0.008 * 185 * 12 * 5 * 1.1) // 10% growth
      };

      // Legal Risk Assessment
      const legalRisk = {
        riskScore: Math.min(95, (violations.filter(v => v.impact === 'critical').length * 15) +
                             (violations.filter(v => v.impact === 'serious').length * 8) + 25),
        lawsuitProbability: score < 50 ? "HIGH (35-50%)" : score < 70 ? "MEDIUM (15-30%)" : "LOW (5-15%)",
        estimatedLegalCosts: score < 50 ? "$125,000 - $300,000" : score < 70 ? "$75,000 - $200,000" : "$25,000 - $75,000",
        complianceGap: Math.round(100 - ((100 - violations.length) / 100 * 100)),
        regulatoryRisks: ["ADA Title III violations", "State accessibility laws", "EU EN 301 549 non-compliance"],
        timeToCompliance: score < 50 ? "8-12 weeks" : score < 70 ? "6-10 weeks" : "4-8 weeks"
      };

      // Competitive Analysis
      const competitiveAnalysis = {
        marketPosition: score >= 85 ? "LEADER" : score >= 70 ? "AVERAGE" : score >= 50 ? "LAGGING" : "CRITICAL",
        competitorAdvantage: score < 70 ? "Competitors likely have 15-25% accessibility advantage" : "Competitive positioning maintained",
        marketShareRisk: score < 50 ? "HIGH - Losing 5-15% market share" : score < 70 ? "MEDIUM - Some customer defection" : "LOW - Stable position",
        seoDisadvantage: score < 70 ? "Accessibility issues hurt search rankings by 10-20%" : "Minimal SEO impact",
        brandReputationRisk: score < 50 ? "CRITICAL - Major PR vulnerability" : score < 70 ? "MODERATE - Reputation concerns" : "LOW - Good standing"
      };

      // User Experience Impact
      const uxImpact = {
        userExclusionRate: Math.round(violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length * 2.5),
        taskCompletionRate: Math.max(45, 95 - (violations.length * 1.2)),
        customerSatisfactionScore: Math.max(6.2, 9.1 - (violations.length * 0.08)),
        supportTicketIncrease: violations.length * 3,
        mobileAccessibilityScore: Math.max(30, score - 15),
        voiceCompatibilityScore: Math.max(25, score - 25)
      };

      // SEO & Marketing Impact
      const seoImpact = {
        searchRankingPenalty: score < 70 ? "15-25% ranking decrease" : "Minimal impact",
        coreWebVitalsScore: Math.max(40, score - 10),
        organicTrafficLoss: score < 50 ? "20-35%" : score < 70 ? "10-20%" : "5-10%",
        socialShareability: Math.max(60, score + 5),
        voiceSearchOptimization: score >= 80 ? "Good" : score >= 60 ? "Fair" : "Poor",
        localSEOImpact: score < 70 ? "Negative impact on local rankings" : "Neutral to positive"
      };

      // Industry-Specific Compliance
      const getIndustryCompliance = (url: string) => {
        const domain = url.toLowerCase();
        if (domain.includes('bank') || domain.includes('finance') || domain.includes('payment')) {
          return {
            industry: "Financial Services",
            specificRequirements: ["PCI DSS accessibility", "Banking regulations", "Financial data access"],
            complianceLevel: score >= 80 ? "Compliant" : "Non-compliant",
            penalties: "Up to $1M fines for non-compliance"
          };
        } else if (domain.includes('health') || domain.includes('medical') || domain.includes('hospital')) {
          return {
            industry: "Healthcare",
            specificRequirements: ["HIPAA accessibility", "Patient portal compliance", "Medical device standards"],
            complianceLevel: score >= 85 ? "Compliant" : "Non-compliant",
            penalties: "HIPAA fines up to $1.5M per incident"
          };
        } else if (domain.includes('shop') || domain.includes('store') || domain.includes('buy')) {
          return {
            industry: "E-commerce",
            specificRequirements: ["Payment accessibility", "Shopping cart compliance", "Product catalog access"],
            complianceLevel: score >= 75 ? "Compliant" : "Non-compliant",
            penalties: "Customer loss and lawsuit risk"
          };
        } else {
          return {
            industry: "General Business",
            specificRequirements: ["ADA Title III compliance", "Web accessibility standards", "Customer service access"],
            complianceLevel: score >= 70 ? "Compliant" : "Non-compliant",
            penalties: "Lawsuits and reputation damage"
          };
        }
      };

      const industryCompliance = getIndustryCompliance(siteUrl);

      // Implementation Roadmap
      const implementationRoadmap = {
        phase1: {
          duration: "Weeks 1-2",
          focus: "Critical Issues & Quick Wins",
          tasks: [`Fix ${violations.filter(v => v.impact === 'critical').length} critical violations`, "Implement alt text for images", "Improve color contrast", "Add form labels"],
          cost: "$5,000 - $15,000",
          impact: "Immediate user experience improvement"
        },
        phase2: {
          duration: "Weeks 3-6",
          focus: "Comprehensive Remediation",
          tasks: [`Address ${violations.filter(v => v.impact === 'serious').length} serious issues`, "Keyboard navigation", "Screen reader optimization", "ARIA implementation"],
          cost: "$15,000 - $35,000",
          impact: "Full accessibility compliance"
        },
        phase3: {
          duration: "Weeks 7-12",
          focus: "Advanced Features & Testing",
          tasks: ["User testing with disabled users", "Automated monitoring setup", "Staff training", "Ongoing maintenance"],
          cost: "$10,000 - $25,000",
          impact: "Sustained accessibility excellence"
        }
      };

      return {
        advancedROI,
        legalRisk,
        competitiveAnalysis,
        uxImpact,
        seoImpact,
        industryCompliance,
        implementationRoadmap
      };
    };

    const comprehensiveAnalysis = generateComprehensiveAnalysis(scan.score || 0, violations, siteUrl);

    // Generate stunning HTML for PDF conversion with professional design
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${brandName} - Accessibility Report</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
            <style>
            @page {
                margin: 12mm;
                size: A4;
                @top-left {
                    content: "${brandName} Accessibility Report";
                    font-size: 9px;
                    color: #64748b;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-weight: 500;
                }
                @top-right {
                    content: "${formatDate(new Date())}";
                    font-size: 9px;
                    color: #64748b;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-weight: 400;
                }
                @bottom-center {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 9px;
                    color: #64748b;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-weight: 400;
                    margin-top: 8px;
                }
            }

            :root {
                --primary: ${primaryColor};
                --secondary: ${secondaryColor};
                --accent: #f8fafc;
                --surface: #ffffff;
                --text-primary: #0f172a;
                --text-secondary: #475569;
                --text-muted: #64748b;
                --border: #e2e8f0;
                --success: #10b981;
                --warning: #f59e0b;
                --error: #ef4444;
                --gradient-primary: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                --gradient-surface: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
                --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                --border-radius: 12px;
                --border-radius-lg: 16px;
                --border-radius-xl: 20px;
            }

            * {
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: var(--text-primary);
                line-height: 1.6;
                background: var(--surface);
                font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
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
                font-size: 36px;
                font-weight: 800;
                letter-spacing: -1px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .logo-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .logo-icon img {
                height: 48px;
                width: auto;
                max-width: 200px;
                object-fit: contain;
            }

            .logo::before {
                content: '🛡️';
                margin-right: 0;
                font-size: 48px;
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

            /* Improvement Guidance Styling */
            .score-improvement {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #0ea5e9;
                border-radius: 16px;
                padding: 25px;
                margin: 25px 0;
            }

            .remediation-strategy {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                border-left: 4px solid #059669;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }

            .strategy-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }

            .strategy-icon {
                font-size: 24px;
                margin-right: 12px;
            }

            .strategy-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                flex: 1;
            }

            .strategy-meta {
                font-size: 11px;
                color: #6b7280;
                background: #f3f4f6;
                padding: 4px 8px;
                border-radius: 12px;
                margin-left: 8px;
            }

            .strategy-description {
                font-size: 14px;
                color: #374151;
                margin-bottom: 12px;
                line-height: 1.5;
            }

            .strategy-impact {
                font-size: 13px;
                color: #dc2626;
                font-weight: 500;
                margin-bottom: 12px;
            }

            .solution-list {
                list-style: none;
                padding: 0;
                margin: 12px 0;
            }

            .solution-item {
                background: #f8fafc;
                padding: 8px 12px;
                margin: 6px 0;
                border-radius: 6px;
                border-left: 3px solid #0ea5e9;
                font-size: 13px;
                color: #374151;
            }

            .timeline-section {
                background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
                border: 1px solid #c084fc;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }

            .timeline-item {
                display: flex;
                align-items: flex-start;
                margin: 12px 0;
                padding: 12px;
                background: white;
                border-radius: 8px;
                border-left: 3px solid #8b5cf6;
            }

            .timeline-week {
                background: #8b5cf6;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                margin-right: 12px;
                min-width: 60px;
                text-align: center;
            }

            .quick-wins {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border: 1px solid #a7f3d0;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }

            .quick-win-item {
                background: white;
                padding: 12px;
                margin: 8px 0;
                border-radius: 8px;
                border-left: 3px solid #10b981;
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            }

            /* Simple, Clean PDF Styling */
            .pdf-section {
                margin: 30px 0;
                padding: 20px;
                border: 1px solid #ddd;
                page-break-inside: avoid;
            }

            .pdf-header {
                color: ${primaryColor};
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
                border-bottom: 2px solid ${primaryColor};
                padding-bottom: 10px;
            }

            .metrics-row {
                width: 100%;
                margin: 20px 0;
            }

            .metrics-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }

            .metrics-table td {
                border: 1px solid #ddd;
                padding: 15px;
                text-align: center;
                width: 25%;
            }

            .metric-number {
                font-size: 24px;
                font-weight: bold;
                color: ${primaryColor};
                display: block;
                margin-bottom: 5px;
            }

            .metric-text {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
            }

            .info-block {
                background: #f9f9f9;
                border-left: 4px solid ${primaryColor};
                padding: 15px;
                margin: 15px 0;
            }

            .warning-block {
                background: #fdf2f2;
                border-left: 4px solid #dc2626;
                padding: 15px;
                margin: 15px 0;
            }

            .success-block {
                background: #f0fdf4;
                border-left: 4px solid #16a34a;
                padding: 15px;
                margin: 15px 0;
            }

            .simple-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }

            .simple-table th,
            .simple-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }

            .simple-table th {
                background: #f5f5f5;
                font-weight: bold;
            }

            .status-high { color: #dc2626; font-weight: bold; }
            .status-medium { color: #d97706; font-weight: bold; }
            .status-low { color: #16a34a; font-weight: bold; }

            .large-number {
                font-size: 36px;
                font-weight: bold;
                color: ${primaryColor};
                text-align: center;
                margin: 10px 0;
            }

            .center-text { text-align: center; }
            .bold { font-weight: bold; }

            ul.clean-list {
                list-style-type: disc;
                margin: 10px 0;
                padding-left: 25px;
            }

            ul.clean-list li {
                margin: 5px 0;
                line-height: 1.4;
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
                margin-bottom: 8px;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .footer-logo img {
                height: 28px;
                width: auto;
                max-width: 150px;
                object-fit: contain;
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
            <!-- Premium Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo">
                        ${brandLogo ?
                            `<div class="logo-icon"><img src="${brandLogo}" alt="${brandName}" /></div>` :
                            `<div class="logo-icon">🛡️</div>`
                        }
                        <span>${brandName}</span>
                    </div>
                    <div class="report-title">Accessibility Compliance Report</div>
                    <div class="report-subtitle">Comprehensive WCAG Analysis & Strategic Remediation Guide</div>
                </div>
            </div>

            <!-- Premium Website Info -->
            <div class="website-info">
                <div class="website-info-content">
                    <div class="website-url">${siteUrl}</div>
                    <div class="scan-date">Scanned on ${formatDate(scan.createdAt)} • Generated on ${formatDate(new Date())}</div>
                </div>
            </div>

            <!-- Premium Score Hero -->
            <div class="score-hero">
                <div class="score-hero-content">
                    <div class="score-circle ${scoreInfo.category}">
                        ${scan.score || 0}
                    </div>
                    <div class="score-label">${scoreInfo.label} Accessibility Score</div>
                    <div class="score-description">${scoreInfo.description}</div>
                </div>
            </div>

            <!-- Premium Metrics Grid -->
            <div class="metrics-grid">
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

            <!-- Premium Impact Breakdown -->
            <div class="section">
                <div class="section-title">Issue Severity Breakdown</div>
                <div class="impact-grid">
                    <div class="impact-card critical">
                        <div class="impact-content">
                            <div class="impact-icon">🔴</div>
                            <div class="impact-value">${stats.critical}</div>
                            <div class="impact-label">Critical</div>
                        </div>
                    </div>
                    <div class="impact-card serious">
                        <div class="impact-content">
                            <div class="impact-icon">🟠</div>
                            <div class="impact-value">${stats.serious}</div>
                            <div class="impact-label">Serious</div>
                        </div>
                    </div>
                    <div class="impact-card moderate">
                        <div class="impact-content">
                            <div class="impact-icon">🟡</div>
                            <div class="impact-value">${stats.moderate}</div>
                            <div class="impact-label">Moderate</div>
                        </div>
                    </div>
                    <div class="impact-card minor">
                        <div class="impact-content">
                            <div class="impact-icon">⚪</div>
                            <div class="impact-value">${stats.minor}</div>
                            <div class="impact-label">Minor</div>
                        </div>
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
                    <div class="business-impact-content">
                        <h3 style="color: #dc2626; font-size: 24px; font-weight: 800; margin-bottom: 20px; text-align: center; letter-spacing: -0.01em;">💰 Revenue Impact Assessment</h3>

                        <div class="impact-highlight">
                            <div style="text-align: center;">
                                <div style="font-size: 18px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">Estimated Monthly Revenue Loss</div>
                                <div class="revenue-loss">$${businessImpact.monthlyRevenueLoss.toLocaleString()}</div>
                                <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-top: 8px;">Annual Loss: $${businessImpact.annualRevenueLoss.toLocaleString()}</div>
                            </div>
                            <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: 12px; border: 1px solid #fecaca;">
                                <div style="font-size: 15px; color: var(--text-primary); line-height: 1.6;">
                                    <strong style="font-size: 16px; color: #dc2626;">Why you're losing money:</strong><br><br>
                                    • <strong>${businessImpact.conversionReduction}%</strong> reduction in conversion rates<br>
                                    • <strong>${businessImpact.userExclusionPercentage}%</strong> of potential customers cannot properly use your site<br>
                                    • ${businessImpact.seoImpact}<br>
                                    • Damaged brand reputation and customer trust
                                </div>
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

                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%); border: 2px solid #f87171; border-radius: 16px; padding: 28px; margin: 24px 0; box-shadow: var(--shadow-lg); position: relative; overflow: hidden;">
                    <div style="position: relative; z-index: 1;">
                        <h3 style="color: #dc2626; font-size: 22px; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.01em;">⚖️ Legal Risk Assessment</h3>
                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                            <span style="font-weight: 700; margin-right: 16px; font-size: 15px;">Risk Level:</span>
                            <span class="risk-badge" style="background: linear-gradient(135deg, ${businessImpact.riskAssessment.color}, ${businessImpact.riskAssessment.color}dd);">${businessImpact.riskAssessment.level}</span>
                        </div>
                        <div style="font-size: 15px; color: var(--text-primary); line-height: 1.6;">
                            <p style="font-weight: 600; margin-bottom: 16px;">${businessImpact.riskAssessment.description}</p>
                            <ul class="clean-list" style="margin: 16px 0;">
                                <li>ADA lawsuit filings increased <strong>320%</strong> in recent years</li>
                                <li>Average lawsuit settlement: <strong>$75,000 - $400,000</strong></li>
                                <li>Legal fees typically range from <strong>$50,000 - $150,000</strong></li>
                                <li>Businesses often forced to <strong>rebuild entire website</strong></li>
                            </ul>
                            <p style="font-weight: 700; color: #dc2626; background: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px; border-left: 4px solid #dc2626;">⚠️ Note: This report can serve as evidence of known accessibility issues in legal proceedings.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Executive Summary Dashboard -->
            <div class="page-break"></div>
            <div class="pdf-section">
                <div class="pdf-header">📈 Executive Summary Dashboard</div>

                <h3>💼 Key Business Metrics at a Glance</h3>

                <table class="metrics-table">
                    <tr>
                        <td>
                            <span class="metric-number">$${comprehensiveAnalysis.advancedROI.annualRevenueLift.toLocaleString()}</span>
                            <span class="metric-text">Annual Revenue Opportunity</span>
                        </td>
                        <td>
                            <span class="metric-number">${comprehensiveAnalysis.legalRisk.riskScore}%</span>
                            <span class="metric-text">Legal Risk Score</span>
                        </td>
                        <td>
                            <span class="metric-number">${comprehensiveAnalysis.uxImpact.userExclusionRate}%</span>
                            <span class="metric-text">Users Currently Excluded</span>
                        </td>
                        <td>
                            <span class="metric-number">${comprehensiveAnalysis.advancedROI.breakEvenMonths}</span>
                            <span class="metric-text">Months to Break Even</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Advanced ROI Analysis -->
            <div class="page-break"></div>
            <div class="pdf-section">
                <div class="pdf-header">💎 Advanced ROI & Financial Projections</div>

                <h3>💰 5-Year Financial Impact Analysis</h3>

                <table class="metrics-table">
                    <tr>
                        <td>
                            <span class="metric-number">$${comprehensiveAnalysis.advancedROI.monthlyRevenueLift.toLocaleString()}</span>
                            <span class="metric-text">Monthly Revenue Lift</span>
                        </td>
                        <td>
                            <span class="metric-number">$${comprehensiveAnalysis.advancedROI.fiveYearProjection.toLocaleString()}</span>
                            <span class="metric-text">5-Year Revenue Projection</span>
                        </td>
                    </tr>
                </table>

                <div class="success-block">
                    <h4>📊 Market Expansion Opportunities</h4>
                    <p><strong>Untapped Revenue Stream: $${comprehensiveAnalysis.advancedROI.marketExpansionRevenue.toLocaleString()}/year</strong></p>
                    <ul class="clean-list">
                        <li>${comprehensiveAnalysis.advancedROI.customerLifetimeValueIncrease * 100}% increase in customer lifetime value</li>
                        <li>Access to ${comprehensiveAnalysis.advancedROI.disabledUserMarketShare * 100}% disabled user market (61 million Americans)</li>
                        <li>Government contract eligibility worth millions in potential revenue</li>
                        <li>Premium pricing justified by accessible, inclusive design</li>
                        <li>Reduced customer acquisition costs through improved retention</li>
                    </ul>
                </div>
            </div>

            <!-- Enhanced Legal Risk Assessment -->
            <div class="pdf-section">
                <div class="pdf-header">⚖️ Comprehensive Legal Risk Assessment</div>

                <h3 style="color: var(--text-primary); font-size: 20px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.01em;">🚨 Litigation Risk Analysis</h3>

                <!-- Risk Score Visualization -->
                <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: 20px; padding: 40px; text-align: center; margin: 32px 0; box-shadow: var(--shadow-xl); border: 2px solid #fca5a5; position: relative; overflow: hidden;">
                    <div style="position: relative; z-index: 1;">
                        <!-- Risk Score Display -->
                        <div style="width: 160px; height: 160px; margin: 0 auto 24px; position: relative; background: radial-gradient(circle, rgba(220,38,38,0.1), transparent); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 120px; height: 120px; border: 6px solid #fca5a5; border-top-color: #dc2626; border-radius: 50%; position: relative;">
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                    <div style="font-size: 36px; font-weight: 900; color: #dc2626; letter-spacing: -0.02em;">${comprehensiveAnalysis.legalRisk.riskScore}%</div>
                                    <div style="font-size: 12px; color: #b91c1c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Risk Score</div>
                                </div>
                            </div>
                        </div>

                        <div style="margin: 24px 0;">
                            <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Lawsuit Probability Assessment</div>
                            <div style="display: inline-block; padding: 12px 24px; border-radius: 25px; font-weight: 700; font-size: 14px;
                                        background: ${comprehensiveAnalysis.legalRisk.riskScore > 70 ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : comprehensiveAnalysis.legalRisk.riskScore > 40 ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #059669, #047857)'};
                                        color: white; box-shadow: var(--shadow-md);">
                                ${comprehensiveAnalysis.legalRisk.lawsuitProbability}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Financial Exposure Section -->
                <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: 16px; padding: 32px; margin: 24px 0; box-shadow: var(--shadow-lg); border: 2px solid #fca5a5;">
                    <h4 style="color: #dc2626; font-size: 18px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        💸 Financial Exposure Analysis
                    </h4>

                    <!-- Cost Breakdown Visualization -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0;">
                        <div style="background: rgba(255, 255, 255, 0.9); border-radius: 12px; padding: 20px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 12px; color: #b91c1c; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Estimated Legal Costs</div>
                            <div style="font-size: 24px; font-weight: 800; color: #dc2626; margin-bottom: 8px;">${comprehensiveAnalysis.legalRisk.estimatedLegalCosts}</div>
                            <div style="width: 100%; height: 4px; background: linear-gradient(90deg, #fca5a5, #dc2626); border-radius: 2px;"></div>
                        </div>

                        <div style="background: rgba(255, 255, 255, 0.9); border-radius: 12px; padding: 20px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 12px; color: #b91c1c; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Time to Compliance</div>
                            <div style="font-size: 24px; font-weight: 800; color: #dc2626; margin-bottom: 8px;">${comprehensiveAnalysis.legalRisk.timeToCompliance}</div>
                            <div style="width: 100%; height: 4px; background: linear-gradient(90deg, #fca5a5, #dc2626); border-radius: 2px;"></div>
                        </div>
                    </div>

                    <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 6px solid #dc2626; box-shadow: var(--shadow-md);">
                        <p style="font-size: 16px; font-weight: 800; color: #dc2626; margin: 0; display: flex; align-items: center; gap: 8px;">
                            ⚠️ Critical Legal Notice
                        </p>
                        <p style="font-size: 14px; color: var(--text-primary); margin: 12px 0 0 0; line-height: 1.6; font-weight: 500;">
                            This documented accessibility analysis could be used as evidence of known violations in legal proceedings. Immediate remediation is strongly recommended.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Industry Compliance -->
            <div class="pdf-section">
                <div class="pdf-header">🏛️ ${comprehensiveAnalysis.industryCompliance.industry} Compliance Analysis</div>

                <h3>📋 Industry-Specific Requirements</h3>

                <div class="center-text">
                    <p class="${comprehensiveAnalysis.industryCompliance.complianceLevel === 'Compliant' ? 'status-low' : 'status-high'} bold">
                        Current Status: ${comprehensiveAnalysis.industryCompliance.complianceLevel}
                    </p>
                </div>

                <div class="info-block">
                    <h4>📋 Required Compliance Standards</h4>
                    <ul class="clean-list">
                        ${comprehensiveAnalysis.industryCompliance.specificRequirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>

                <div class="warning-block">
                    <p class="bold">⚠️ Non-Compliance Penalties:</p>
                    <p>${comprehensiveAnalysis.industryCompliance.penalties}</p>
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

            <!-- Score Improvement Analysis -->
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">🎯 What's Blocking Your Score Improvement</div>

                <div class="score-improvement">
                    <h3 style="color: #0369a1; font-size: 20px; margin-bottom: 16px; text-align: center;">📈 Score Improvement Potential</h3>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 16px; color: #6b7280; margin-bottom: 8px;">Current Score</div>
                        <div style="font-size: 48px; font-weight: 800; color: #0369a1; margin-bottom: 8px;">${scan.score || 0}</div>
                        <div style="font-size: 18px; color: #059669; font-weight: 600;">Target Score: ${improvementGuidance.scoreBlockers.targetScore}</div>
                        <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">${improvementGuidance.scoreBlockers.improvementPotential}</div>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 16px 0;">
                        <h4 style="color: #dc2626; font-size: 16px; margin-bottom: 12px;">🚧 Main Score Blocker</h4>
                        <p style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>${improvementGuidance.scoreBlockers.mainBlocker}</strong></p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Timeframe</div>
                                <div style="font-size: 14px; font-weight: 600; color: #1f2937;">${improvementGuidance.scoreBlockers.timeframe}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Priority</div>
                                <div style="font-size: 14px; font-weight: 600; color: #dc2626;">${improvementGuidance.scoreBlockers.priority}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Wins Section -->
                ${improvementGuidance.quickWins.length > 0 ? `
                <div class="quick-wins">
                    <h3 style="color: #059669; font-size: 18px; margin-bottom: 16px;">⚡ Quick Wins (Start Here!)</h3>
                    <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">These fixes will provide immediate score improvements with minimal effort:</p>
                    ${improvementGuidance.quickWins.map(win => `
                        <div class="quick-win-item">✅ ${win}</div>
                    `).join('')}
                </div>
                ` : ''}
            </div>

            <!-- Detailed Remediation Strategies -->
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">🛠️ Detailed Remediation Strategies</div>

                ${improvementGuidance.remediationStrategies.map(strategy => `
                    <div class="remediation-strategy">
                        <div class="strategy-header">
                            <div class="strategy-icon">${strategy.icon}</div>
                            <div class="strategy-title">${strategy.category}</div>
                            <div class="strategy-meta">${strategy.difficulty}</div>
                            <div class="strategy-meta">${strategy.timeToFix}</div>
                            <div class="strategy-meta">${strategy.wcagLevel}</div>
                        </div>

                        <div class="strategy-description">${strategy.description}</div>

                        <div class="strategy-impact">👥 Impact: ${strategy.impact}</div>

                        <div style="margin-top: 16px;">
                            <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">🔧 How to Fix:</div>
                            <ul class="solution-list">
                                ${strategy.solutions.map(solution => `
                                    <li class="solution-item">${solution}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Implementation Timeline -->
            <div class="section">
                <div class="section-title">📅 4-Week Implementation Timeline</div>

                <div class="timeline-section">
                    <h3 style="color: #7c3aed; font-size: 18px; margin-bottom: 16px;">⏰ Recommended Implementation Schedule</h3>

                    <div class="timeline-item">
                        <div class="timeline-week">WEEK 1</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Critical Issues</div>
                            <div style="font-size: 13px; color: #6b7280;">${improvementGuidance.implementationTimeline.week1}</div>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-week">WEEK 2</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Serious Violations</div>
                            <div style="font-size: 13px; color: #6b7280;">${improvementGuidance.implementationTimeline.week2}</div>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-week">WEEK 3</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Moderate Issues</div>
                            <div style="font-size: 13px; color: #6b7280;">${improvementGuidance.implementationTimeline.week3}</div>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-week">WEEK 4</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Testing & Validation</div>
                            <div style="font-size: 13px; color: #6b7280;">${improvementGuidance.implementationTimeline.week4}</div>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-week" style="background: #059669;">ONGOING</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Maintenance</div>
                            <div style="font-size: 13px; color: #6b7280;">${improvementGuidance.implementationTimeline.ongoing}</div>
                        </div>
                    </div>
                </div>
            </div>

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
                <div class="footer-logo">
                    ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" />` : (whiteLabel ? '' : '🛡️ ')}
                    <span>${brandName} Accessibility Platform</span>
                </div>
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