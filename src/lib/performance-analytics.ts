import { prisma } from "./prisma";

export interface PerformanceMetrics {
  performanceScore: number;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  cumulativeLayoutShift: number | null;
  firstInputDelay: number | null;
  totalBlockingTime: number | null;
}

export interface SEOMetrics {
  seoScore: number;
  metaDescription: string | null;
  headingStructure: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    hasProperHierarchy: boolean;
  };
  altTextCoverage: number;
  linkAccessibility: number;
}

export interface ComplianceRisk {
  adaRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  wcag21Compliance: number;
  wcag22Compliance: number;
  complianceGaps: {
    category: string;
    issues: string[];
    severity: string;
  }[];
  legalRiskScore: number;
}

// Enhanced Google PageSpeed Insights API integration
export async function getPerformanceMetrics(url: string): Promise<PerformanceMetrics | null> {
  const API_KEY = process.env.PAGESPEED_API_KEY;

  // If API key is available, use real PageSpeed Insights
  if (API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}&strategy=desktop&category=PERFORMANCE`,
        {
          signal: AbortSignal.timeout(30_000),
          headers: {
            'User-Agent': 'VexNexa Performance Analyzer'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const lighthouseResult = data.lighthouseResult;
        const categories = lighthouseResult?.categories;
        const audits = lighthouseResult?.audits;

        const score = categories?.performance?.score;
        if (typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 1 && audits) {
          const measurement = (key: string): number | null => {
            const value = audits[key]?.numericValue;
            return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
          };
          return {
            performanceScore: Math.round(score * 100),
            firstContentfulPaint: measurement('first-contentful-paint'),
            largestContentfulPaint: measurement('largest-contentful-paint'),
            cumulativeLayoutShift: measurement('cumulative-layout-shift'),
            firstInputDelay: measurement('first-input-delay') ?? measurement('max-potential-fid'),
            totalBlockingTime: measurement('total-blocking-time')
          };
        }
      }
    } catch (error) {
      console.warn('PageSpeed Insights metrics unavailable');
    }
  }

  // Missing measurements stay missing. Never persist invented performance
  // scores as if they came from a completed PageSpeed measurement.
  return null;
}

// Analyze SEO correlation with accessibility
export function analyzeSEOMetrics(violations: any[]): SEOMetrics {
  const imageViolations = violations.filter(v => v.id?.includes('image-alt') || v.id?.includes('alt'));
  const headingViolations = violations.filter(v => v.id?.includes('heading'));
  const linkViolations = violations.filter(v => v.id?.includes('link'));

  // Calculate heading structure from violations
  const headingStructure = {
    h1: 1, // Assume at least one H1
    h2: Math.max(0, 3 - headingViolations.length),
    h3: Math.max(0, 5 - headingViolations.length),
    h4: Math.max(0, 2 - headingViolations.length),
    h5: 0,
    h6: 0,
    hasProperHierarchy: headingViolations.length < 2
  };

  // Calculate coverage metrics
  const totalImages = 10; // Simulated
  const imagesWithAlt = Math.max(0, totalImages - imageViolations.length);
  const altTextCoverage = (imagesWithAlt / totalImages) * 100;

  const totalLinks = 15; // Simulated
  const accessibleLinks = Math.max(0, totalLinks - linkViolations.length);
  const linkAccessibility = (accessibleLinks / totalLinks) * 100;

  // Calculate overall SEO score based on accessibility
  const seoScore = Math.round(
    (altTextCoverage * 0.3) +
    (linkAccessibility * 0.3) +
    (headingStructure.hasProperHierarchy ? 40 : 20)
  );

  return {
    seoScore,
    metaDescription: seoScore > 70 ? "Well-structured page with good accessibility practices" : null,
    headingStructure,
    altTextCoverage,
    linkAccessibility
  };
}

// Calculate legal compliance risk
export function calculateComplianceRisk(
  accessibilityScore: number,
  violations: any[]
): ComplianceRisk {
  const criticalViolations = violations.filter(v => v.impact === 'critical').length;
  const seriousViolations = violations.filter(v => v.impact === 'serious').length;
  const totalViolations = violations.length;

  // Determine ADA risk level
  let adaRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (criticalViolations > 5 || accessibilityScore < 40) {
    adaRiskLevel = 'CRITICAL';
  } else if (criticalViolations > 2 || seriousViolations > 10 || accessibilityScore < 60) {
    adaRiskLevel = 'HIGH';
  } else if (seriousViolations > 5 || accessibilityScore < 75) {
    adaRiskLevel = 'MEDIUM';
  } else {
    adaRiskLevel = 'LOW';
  }

  // Calculate WCAG compliance
  const wcag21Compliance = Math.max(0, 100 - (totalViolations * 2));
  const wcag22Compliance = Math.max(0, wcag21Compliance - 5);

  // Identify compliance gaps
  const complianceGaps = [
    {
      category: 'Perceivable',
      issues: violations.filter(v =>
        v.id?.includes('color-contrast') ||
        v.id?.includes('image-alt') ||
        v.id?.includes('video')
      ).map(v => v.id || 'Unknown issue'),
      severity: 'high'
    },
    {
      category: 'Operable',
      issues: violations.filter(v =>
        v.id?.includes('keyboard') ||
        v.id?.includes('focus') ||
        v.id?.includes('link')
      ).map(v => v.id || 'Unknown issue'),
      severity: 'medium'
    },
    {
      category: 'Understandable',
      issues: violations.filter(v =>
        v.id?.includes('label') ||
        v.id?.includes('heading') ||
        v.id?.includes('language')
      ).map(v => v.id || 'Unknown issue'),
      severity: 'medium'
    },
    {
      category: 'Robust',
      issues: violations.filter(v =>
        v.id?.includes('html') ||
        v.id?.includes('valid') ||
        v.id?.includes('aria')
      ).map(v => v.id || 'Unknown issue'),
      severity: 'low'
    }
  ].filter(gap => gap.issues.length > 0);

  // Calculate legal risk score
  const legalRiskScore = Math.min(100,
    (criticalViolations * 15) +
    (seriousViolations * 8) +
    (totalViolations * 2) +
    (adaRiskLevel === 'CRITICAL' ? 30 : adaRiskLevel === 'HIGH' ? 20 : adaRiskLevel === 'MEDIUM' ? 10 : 0)
  );

  return {
    adaRiskLevel,
    wcag21Compliance,
    wcag22Compliance,
    complianceGaps,
    legalRiskScore
  };
}

// Calculate performance-accessibility correlation
export function calculatePerformanceCorrelation(scans: any[]) {
  if (scans.length < 5) return null;

  const validScans = scans.filter(s => s.performanceScore && s.score);
  if (validScans.length < 3) return null;

  // Simple correlation calculation
  const n = validScans.length;
  const sumX = validScans.reduce((sum, s) => sum + s.performanceScore, 0);
  const sumY = validScans.reduce((sum, s) => sum + s.score, 0);
  const sumXY = validScans.reduce((sum, s) => sum + (s.performanceScore * s.score), 0);
  const sumXX = validScans.reduce((sum, s) => sum + (s.performanceScore * s.performanceScore), 0);
  const sumYY = validScans.reduce((sum, s) => sum + (s.score * s.score), 0);

  const correlation = (n * sumXY - sumX * sumY) /
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return isNaN(correlation) ? null : Math.round(correlation * 100) / 100;
}

// Get portfolio-wide analytics
export async function getPortfolioAnalytics(userId: string) {
  const sites = await prisma.site.findMany({
    where: { userId },
    include: {
      scans: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const sitesWithScans = sites.filter(s => s.scans.length > 0);
  if (sitesWithScans.length === 0) return null;

  const totalSites = sitesWithScans.length;
  const avgScore = sitesWithScans.reduce((sum, s) => sum + (s.scans[0].score || 0), 0) / totalSites;
  const totalIssues = sitesWithScans.reduce((sum, s) => sum + (s.scans[0].issues || 0), 0);

  // Calculate risk distribution
  const riskDistribution = {
    low: sitesWithScans.filter(s => (s.scans[0].legalRiskScore || 0) < 25).length,
    medium: sitesWithScans.filter(s => {
      const risk = s.scans[0].legalRiskScore || 0;
      return risk >= 25 && risk < 50;
    }).length,
    high: sitesWithScans.filter(s => {
      const risk = s.scans[0].legalRiskScore || 0;
      return risk >= 50 && risk < 75;
    }).length,
    critical: sitesWithScans.filter(s => (s.scans[0].legalRiskScore || 0) >= 75).length
  };

  // Performance correlation
  const performanceCorrelation = calculatePerformanceCorrelation(
    sitesWithScans.flatMap(s => s.scans)
  );

  return {
    totalSites,
    avgScore: Math.round(avgScore),
    totalIssues,
    riskDistribution,
    performanceCorrelation,
    topPerformingSites: sitesWithScans
      .sort((a, b) => (b.scans[0].score || 0) - (a.scans[0].score || 0))
      .slice(0, 5)
      .map(s => ({
        url: s.url,
        score: s.scans[0].score,
        issues: s.scans[0].issues
      })),
    worstPerformingSites: sitesWithScans
      .sort((a, b) => (a.scans[0].score || 0) - (b.scans[0].score || 0))
      .slice(0, 5)
      .map(s => ({
        url: s.url,
        score: s.scans[0].score,
        issues: s.scans[0].issues,
        riskLevel: s.scans[0].adaRiskLevel
      }))
  };
}

// Priority matrix calculation for portfolio
export function calculatePriorityMatrix(sites: any[]) {
  return sites.map(site => {
    const latestScan = site.scans[0];
    if (!latestScan) return null;

    // Impact: based on issues and risk level
    const impact = Math.min(10,
      (latestScan.impactCritical * 3) +
      (latestScan.impactSerious * 2) +
      (latestScan.impactModerate * 1) +
      (latestScan.legalRiskScore || 0) / 10
    );

    // Effort: based on total issues and complexity
    const effort = Math.min(10,
      Math.sqrt(latestScan.issues || 0) +
      (latestScan.performanceScore ? (100 - latestScan.performanceScore) / 20 : 2)
    );

    return {
      siteId: site.id,
      url: site.url,
      impact: Math.round(impact),
      effort: Math.round(effort),
      priority: Math.round(impact / effort * 100) / 100,
      score: latestScan.score,
      riskLevel: latestScan.adaRiskLevel
    };
  }).filter(Boolean).sort((a, b) => (b?.priority || 0) - (a?.priority || 0));
}
