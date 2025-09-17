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

            /* Advanced Analysis Sections Styling */
            .advanced-roi {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 2px solid #22c55e;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .roi-metric {
                background: white;
                padding: 20px;
                border-radius: 12px;
                margin: 16px 0;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }

            .roi-value {
                font-size: 32px;
                font-weight: 800;
                color: #059669;
                margin-bottom: 8px;
            }

            .roi-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }

            .legal-assessment {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border: 2px solid #ef4444;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .risk-indicator {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 14px;
                color: white;
                margin: 8px 4px;
            }

            .competitive-analysis {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 2px solid #3b82f6;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .market-position {
                text-align: center;
                padding: 20px;
                margin: 16px 0;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                color: white;
            }

            .ux-impact {
                background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
                border: 2px solid #8b5cf6;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .ux-metric {
                background: white;
                padding: 16px;
                border-radius: 8px;
                margin: 12px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 4px solid #8b5cf6;
            }

            .seo-analysis {
                background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
                border: 2px solid #f97316;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .industry-compliance {
                background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
                border: 2px solid #eab308;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .compliance-status {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin: 8px 0;
            }

            .implementation-phases {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border: 2px solid #64748b;
                border-radius: 16px;
                padding: 30px;
                margin: 25px 0;
            }

            .phase-card {
                background: white;
                border-radius: 12px;
                padding: 24px;
                margin: 20px 0;
                border-left: 6px solid #3b82f6;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            }

            .phase-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .phase-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
            }

            .phase-duration {
                background: #3b82f6;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }

            .phase-cost {
                background: #f3f4f6;
                color: #1f2937;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                text-align: center;
                margin: 12px 0;
            }

            .task-list {
                list-style: none;
                padding: 0;
                margin: 16px 0;
            }

            .task-item {
                background: #f8fafc;
                padding: 8px 12px;
                margin: 6px 0;
                border-radius: 6px;
                border-left: 3px solid #3b82f6;
                font-size: 14px;
                color: #374151;
            }

            /* Executive Summary Styling */
            .executive-summary {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: white;
                border-radius: 16px;
                padding: 40px;
                margin: 30px 0;
                text-align: center;
            }

            .exec-metric {
                display: inline-block;
                margin: 16px 20px;
                text-align: center;
            }

            .exec-value {
                font-size: 36px;
                font-weight: 800;
                color: #60a5fa;
                display: block;
            }

            .exec-label {
                font-size: 14px;
                color: #cbd5e1;
                font-weight: 500;
                margin-top: 8px;
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

            <!-- Executive Summary Dashboard -->
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">📈 Executive Summary Dashboard</div>

                <div class="executive-summary">
                    <h2 style="font-size: 28px; margin-bottom: 30px; color: #f1f5f9;">Key Business Metrics at a Glance</h2>

                    <div class="exec-metric">
                        <span class="exec-value">$${comprehensiveAnalysis.advancedROI.annualRevenueLift.toLocaleString()}</span>
                        <div class="exec-label">Annual Revenue Opportunity</div>
                    </div>

                    <div class="exec-metric">
                        <span class="exec-value">${comprehensiveAnalysis.legalRisk.riskScore}%</span>
                        <div class="exec-label">Legal Risk Score</div>
                    </div>

                    <div class="exec-metric">
                        <span class="exec-value">${comprehensiveAnalysis.uxImpact.userExclusionRate}%</span>
                        <div class="exec-label">Users Currently Excluded</div>
                    </div>

                    <div class="exec-metric">
                        <span class="exec-value">${comprehensiveAnalysis.advancedROI.breakEvenMonths}</span>
                        <div class="exec-label">Months to Break Even</div>
                    </div>
                </div>
            </div>

            <!-- Advanced ROI Analysis -->
            <div class="page-break"></div>
            <div class="section">
                <div class="section-title">💎 Advanced ROI & Financial Projections</div>

                <div class="advanced-roi">
                    <h3 style="color: #059669; font-size: 22px; margin-bottom: 20px; text-align: center;">💰 5-Year Financial Impact Analysis</h3>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div class="roi-metric">
                            <div class="roi-value">$${comprehensiveAnalysis.advancedROI.monthlyRevenueLift.toLocaleString()}</div>
                            <div class="roi-label">Monthly Revenue Lift</div>
                        </div>
                        <div class="roi-metric">
                            <div class="roi-value">$${comprehensiveAnalysis.advancedROI.fiveYearProjection.toLocaleString()}</div>
                            <div class="roi-label">5-Year Revenue Projection</div>
                        </div>
                    </div>

                    <div style="background: white; padding: 24px; border-radius: 12px; margin: 20px 0;">
                        <h4 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">📊 Market Expansion Opportunities</h4>
                        <div style="font-size: 14px; color: #374151; line-height: 1.6;">
                            <p><strong>Untapped Revenue Stream: $${comprehensiveAnalysis.advancedROI.marketExpansionRevenue.toLocaleString()}/year</strong></p>
                            <ul style="margin: 16px 0; padding-left: 20px;">
                                <li>${comprehensiveAnalysis.advancedROI.customerLifetimeValueIncrease * 100}% increase in customer lifetime value</li>
                                <li>Access to ${comprehensiveAnalysis.advancedROI.disabledUserMarketShare * 100}% disabled user market (61 million Americans)</li>
                                <li>Government contract eligibility worth millions in potential revenue</li>
                                <li>Premium pricing justified by accessible, inclusive design</li>
                                <li>Reduced customer acquisition costs through improved retention</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Legal Risk Assessment -->
            <div class="section">
                <div class="section-title">⚖️ Comprehensive Legal Risk Assessment</div>

                <div class="legal-assessment">
                    <h3 style="color: #dc2626; font-size: 22px; margin-bottom: 20px; text-align: center;">🚨 Litigation Risk Analysis</h3>

                    <div style="text-align: center; margin: 20px 0;">
                        <div style="font-size: 48px; font-weight: 800; color: #dc2626; margin-bottom: 8px;">${comprehensiveAnalysis.legalRisk.riskScore}%</div>
                        <div style="font-size: 18px; color: #6b7280;">Legal Risk Score</div>
                        <div class="risk-indicator" style="background: ${comprehensiveAnalysis.legalRisk.riskScore > 70 ? '#dc2626' : comprehensiveAnalysis.legalRisk.riskScore > 40 ? '#f59e0b' : '#059669'};">
                            Lawsuit Probability: ${comprehensiveAnalysis.legalRisk.lawsuitProbability}
                        </div>
                    </div>

                    <div style="background: white; padding: 24px; border-radius: 12px; margin: 20px 0;">
                        <h4 style="color: #dc2626; font-size: 18px; margin-bottom: 16px;">💸 Financial Exposure</h4>
                        <div style="font-size: 24px; font-weight: 700; color: #dc2626; text-align: center; margin: 16px 0;">
                            ${comprehensiveAnalysis.legalRisk.estimatedLegalCosts}
                        </div>
                        <div style="font-size: 14px; color: #374151;">
                            <p><strong>Compliance Timeline:</strong> ${comprehensiveAnalysis.legalRisk.timeToCompliance}</p>
                            <p style="font-weight: 600; color: #dc2626; margin-top: 12px;">
                                Warning: This documented accessibility analysis could be used as evidence of known violations in legal proceedings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Industry Compliance -->
            <div class="section">
                <div class="section-title">🏛️ ${comprehensiveAnalysis.industryCompliance.industry} Compliance Analysis</div>

                <div class="industry-compliance">
                    <div style="text-align: center; margin: 20px 0;">
                        <div class="compliance-status" style="background: ${comprehensiveAnalysis.industryCompliance.complianceLevel === 'Compliant' ? '#059669' : '#dc2626'}; color: white;">
                            Current Status: ${comprehensiveAnalysis.industryCompliance.complianceLevel}
                        </div>
                    </div>

                    <div style="background: white; padding: 24px; border-radius: 12px; margin: 20px 0;">
                        <h4 style="color: #ca8a04; font-size: 18px; margin-bottom: 16px;">📋 Industry-Specific Requirements</h4>
                        <ul style="font-size: 14px; color: #374151; margin: 16px 0; padding-left: 20px;">
                            ${comprehensiveAnalysis.industryCompliance.specificRequirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                        <div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <strong style="color: #92400e;">Non-Compliance Penalties:</strong>
                            <div style="color: #78350f; margin-top: 8px;">${comprehensiveAnalysis.industryCompliance.penalties}</div>
                        </div>
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