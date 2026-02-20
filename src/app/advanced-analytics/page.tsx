import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPortfolioAnalytics, calculatePriorityMatrix } from "@/lib/performance-analytics";
import { PerformanceImpactAnalysis } from "@/components/charts/PerformanceImpactAnalysis";
import { PortfolioDashboard } from "@/components/charts/PortfolioDashboard";
import { ComplianceLegalAssessment } from "@/components/charts/ComplianceLegalAssessment";
import { BarChart3, Zap, Building2, Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdvancedAnalyticsPage() {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/auth/login?redirect=/advanced-analytics");
  }

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's sites with latest scans including new performance data
  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    include: {
      scans: {
        where: { status: "done" },
        orderBy: { createdAt: "desc" },
        take: 10, // Get more scans for trend analysis
        select: {
          id: true,
          score: true,
          issues: true,
          impactCritical: true,
          impactSerious: true,
          impactModerate: true,
          impactMinor: true,
          createdAt: true,
          // Performance data
          performanceScore: true,
          firstContentfulPaint: true,
          largestContentfulPaint: true,
          cumulativeLayoutShift: true,
          firstInputDelay: true,
          totalBlockingTime: true,
          // SEO data
          seoScore: true,
          metaDescription: true,
          headingStructure: true,
          altTextCoverage: true,
          linkAccessibility: true,
          // Compliance data
          adaRiskLevel: true,
          wcag21Compliance: true,
          wcag22Compliance: true,
          complianceGaps: true,
          legalRiskScore: true,
          // Trend data
          scoreImprovement: true,
          raw: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Filter sites with scans
  const sitesWithScans = sites.filter(s => s.scans.length > 0);

  // Prepare performance data for analysis
  const performanceData = sitesWithScans.flatMap(site =>
    site.scans.map(scan => ({
      accessibilityScore: scan.score || 0,
      performanceScore: scan.performanceScore || 50,
      firstContentfulPaint: scan.firstContentfulPaint || 1500,
      largestContentfulPaint: scan.largestContentfulPaint || 2500,
      cumulativeLayoutShift: scan.cumulativeLayoutShift || 0.1,
      firstInputDelay: scan.firstInputDelay || 100,
      totalBlockingTime: scan.totalBlockingTime || 200,
      seoScore: scan.seoScore || 60,
      date: scan.createdAt.toISOString(),
      url: site.url
    }))
  );

  // Prepare portfolio data
  const portfolioSites = sitesWithScans.map(site => {
    const latestScan = site.scans[0];
    const previousScan = site.scans[1];

    return {
      id: site.id,
      url: site.url,
      score: latestScan.score || 0,
      issues: latestScan.issues || 0,
      riskLevel: (latestScan.adaRiskLevel || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      performanceScore: latestScan.performanceScore || 50,
      seoScore: latestScan.seoScore || 60,
      lastScanDate: latestScan.createdAt.toISOString(),
      trend: latestScan.scoreImprovement || 0
    };
  });

  // Prepare compliance data
  const complianceData = sitesWithScans.flatMap(site =>
    site.scans.map(scan => ({
      accessibilityScore: scan.score || 0,
      wcag21Compliance: scan.wcag21Compliance || 60,
      wcag22Compliance: scan.wcag22Compliance || 55,
      adaRiskLevel: (scan.adaRiskLevel || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      legalRiskScore: scan.legalRiskScore || 50,
      complianceGaps: Array.isArray(scan.complianceGaps) ? scan.complianceGaps as any[] : [],
      date: scan.createdAt.toISOString(),
      url: site.url
    }))
  );

  // Get portfolio analytics
  const portfolioAnalytics = await getPortfolioAnalytics(user.id);

  if (sitesWithScans.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
          <p className="text-muted-foreground mb-8">
            Run some accessibility scans to see advanced performance and compliance analytics
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Start Scanning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance optimization, portfolio management, and legal compliance insights
          </p>
        </div>
        <Link
          href="/analytics"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-foreground/80 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Analytics
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Sites Analyzed</div>
              <div className="text-3xl font-bold text-blue-600">{sitesWithScans.length}</div>
              <div className="text-sm text-muted-foreground">with performance data</div>
            </div>
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Avg Performance</div>
              <div className="text-3xl font-bold text-green-600">
                {Math.round(performanceData.reduce((sum, d) => sum + d.performanceScore, 0) / performanceData.length)}
              </div>
              <div className="text-sm text-muted-foreground">performance score</div>
            </div>
            <Zap className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Legal Risk</div>
              <div className="text-3xl font-bold text-yellow-600">
                {portfolioSites.filter(s => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length}
              </div>
              <div className="text-sm text-muted-foreground">high risk sites</div>
            </div>
            <Scale className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">WCAG 2.1</div>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(complianceData.reduce((sum, d) => sum + d.wcag21Compliance, 0) / complianceData.length)}%
              </div>
              <div className="text-sm text-muted-foreground">avg compliance</div>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Performance Impact Analysis */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Performance Impact Analysis</h2>
            <p className="text-muted-foreground">Correlation between accessibility, performance, and SEO</p>
          </div>
        </div>
        <PerformanceImpactAnalysis data={performanceData} />
      </div>

      {/* Multi-Site Portfolio Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Portfolio Dashboard</h2>
            <p className="text-muted-foreground">Cross-site performance comparison and priority matrix</p>
          </div>
        </div>
        <PortfolioDashboard sites={portfolioSites} />
      </div>

      {/* Compliance & Legal Assessment */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Scale className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Legal Compliance Assessment</h2>
            <p className="text-muted-foreground">WCAG compliance tracking and ADA risk evaluation</p>
          </div>
        </div>
        <ComplianceLegalAssessment data={complianceData} />
      </div>

      {/* Advanced Insights Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Insights Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Performance Optimization</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Sites with strong accessibility tend to have better performance</li>
              <li>• Core Web Vitals directly impact user experience and SEO</li>
              <li>• Focus on LCP and CLS for maximum performance gains</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Portfolio Management</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Use the priority matrix to focus on high-impact, low-effort fixes</li>
              <li>• Monitor trending sites to catch regressions early</li>
              <li>• Balance risk management across your entire portfolio</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Legal Compliance</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• WCAG 2.1 AA compliance reduces legal risk significantly</li>
              <li>• Document remediation efforts for legal protection</li>
              <li>• Regular monitoring prevents compliance drift</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium">Run New Scan</span>
          </Link>
          <Link
            href="/analytics"
            className="flex items-center justify-center px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Zap className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium">Basic Analytics</span>
          </Link>
          <Link
            href="/settings/billing"
            className="flex items-center justify-center px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Scale className="w-5 h-5 text-purple-600 mr-2" />
            <span className="font-medium">Upgrade Plan</span>
          </Link>
          <Link
            href="/settings/white-label"
            className="flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Building2 className="w-5 h-5 text-muted-foreground mr-2" />
            <span className="font-medium">White-label</span>
          </Link>
        </div>
      </div>
    </div>
  );
}