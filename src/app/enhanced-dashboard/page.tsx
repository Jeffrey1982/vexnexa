import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DragDropDashboard } from "@/components/enhanced/DragDropDashboard";
import { InteractiveHeatmap } from "@/components/enhanced/InteractiveHeatmap";
import { BeforeAfterComparison } from "@/components/enhanced/BeforeAfterComparison";
import { ProgressAnimations } from "@/components/enhanced/ProgressAnimations";
import { SiteStructure3D } from "@/components/enhanced/SiteStructure3D";
import { TrendAnalysis } from "@/components/enhanced/TrendAnalysis";
import { CompetitorBenchmark } from "@/components/enhanced/CompetitorBenchmark";
import { ROICalculator } from "@/components/enhanced/ROICalculator";
import { ExecutiveSummary } from "@/components/enhanced/ExecutiveSummary";
import { RemediationMatrix } from "@/components/enhanced/RemediationMatrix";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrandedHeader from "@/components/white-label/BrandedHeader";
import BrandedFooter from "@/components/white-label/BrandedFooter";
import { BarChart3, TrendingUp, Target, Calculator, FileText, Settings } from "lucide-react";
import { computeIssueStats } from "@/lib/axe-types";

async function getEnhancedDashboardData(userId: string) {
  try {
    const recentScans = await prisma.scan.findMany({
      where: {
        site: { userId },
        status: "done",
        score: { not: null }
      },
      include: {
        site: true,
        page: true
      },
      orderBy: { createdAt: "desc" },
      take: 30
    });

    if (recentScans.length === 0) {
      return null;
    }

    const latestScan = recentScans[0];
    const previousScan = recentScans[1];

    // Extract violations from raw data
    let violations = [];
    if (latestScan.raw && typeof latestScan.raw === 'object' && 'violations' in latestScan.raw) {
      violations = (latestScan.raw as any).violations || [];
    }

    const issues = computeIssueStats(violations);

    // Generate mock trend data
    const trendData = recentScans.slice(0, 10).reverse().map((scan) => ({
      date: scan.createdAt.toISOString().split('T')[0],
      score: scan.score || 0,
      critical: scan.impactCritical || 0,
      serious: scan.impactSerious || 0,
      moderate: scan.impactModerate || 0,
      minor: scan.impactMinor || 0,
      totalIssues: (scan.impactCritical || 0) + (scan.impactSerious || 0) + (scan.impactModerate || 0) + (scan.impactMinor || 0),
      pagesScanned: 1
    }));

    // Mock competitor data
    const benchmarkData = {
      yourSite: {
        name: "Your Site",
        domain: latestScan.site.url,
        industry: "Technology",
        score: latestScan.score || 0,
        issues: {
          critical: issues.critical,
          serious: issues.serious,
          moderate: issues.moderate,
          minor: issues.minor
        },
        metrics: {
          wcagAA: Math.min(95, (latestScan.score || 0) + 10),
          wcagAAA: Math.max(60, (latestScan.score || 0) - 15),
          mobileScore: Math.max(70, (latestScan.score || 0) - 5),
          performanceScore: 85,
          userExperience: 78
        },
        rank: 3,
        userBase: "50K+"
      },
      competitors: [
        {
          name: "Competitor A",
          domain: "competitor-a.com",
          industry: "Technology",
          score: 92,
          issues: { critical: 1, serious: 3, moderate: 8, minor: 12 },
          metrics: { wcagAA: 95, wcagAAA: 85, mobileScore: 88, performanceScore: 90, userExperience: 85 },
          rank: 1,
          userBase: "100K+"
        },
        {
          name: "Competitor B",
          domain: "competitor-b.com",
          industry: "Technology",
          score: 87,
          issues: { critical: 2, serious: 5, moderate: 10, minor: 15 },
          metrics: { wcagAA: 88, wcagAAA: 75, mobileScore: 82, performanceScore: 85, userExperience: 80 },
          rank: 2,
          userBase: "75K+"
        }
      ],
      industryAverage: {
        score: 76,
        criticalIssues: 4,
        wcagAA: 82,
        wcagAAA: 65
      }
    };

    // Mock site structure for 3D visualization
    const siteStructure = {
      id: "root",
      url: latestScan.site.url,
      title: "Home Page",
      level: 0,
      score: latestScan.score || 0,
      issues: {
        critical: issues.critical,
        serious: issues.serious,
        moderate: issues.moderate,
        minor: issues.minor
      },
      children: [
        {
          id: "about",
          url: latestScan.site.url + "/about",
          title: "About",
          level: 1,
          score: Math.max(60, (latestScan.score || 0) - 10),
          issues: { critical: Math.max(0, issues.critical - 1), serious: 2, moderate: 3, minor: 4 },
          children: []
        },
        {
          id: "products",
          url: latestScan.site.url + "/products",
          title: "Products",
          level: 1,
          score: Math.max(55, (latestScan.score || 0) - 15),
          issues: { critical: 1, serious: 3, moderate: 5, minor: 6 },
          children: []
        }
      ]
    };

    // Executive summary data
    const executiveSummary = {
      overallScore: latestScan.score || 0,
      previousScore: previousScan?.score || undefined,
      issues: {
        critical: issues.critical,
        serious: issues.serious,
        moderate: issues.moderate,
        minor: issues.minor,
        total: issues.total
      },
      wcagCompliance: {
        aa: Math.min(95, (latestScan.score || 0) + 10),
        aaa: Math.max(60, (latestScan.score || 0) - 15)
      },
      trends: {
        scoreChange: previousScan ? (latestScan.score || 0) - (previousScan.score || 0) : 0,
        issuesChange: previousScan ? issues.total - (computeIssueStats(previousScan.raw ? (previousScan.raw as any).violations || [] : []).total) : 0,
        timeframe: "last scan"
      },
      recommendations: [
        {
          priority: "high" as const,
          action: "Fix color contrast issues on navigation elements",
          impact: "Improves readability for users with visual impairments",
          effort: "2-4 hours"
        },
        {
          priority: "medium" as const,
          action: "Add alt text to decorative images",
          impact: "Better screen reader compatibility",
          effort: "1-2 hours"
        },
        {
          priority: "low" as const,
          action: "Improve heading structure hierarchy",
          impact: "Enhanced content navigation",
          effort: "3-5 hours"
        }
      ],
      businessImpact: {
        potentialUsers: 15000,
        riskReduction: 85,
        estimatedROI: 25000
      },
      nextSteps: [
        "Prioritize critical accessibility issues for immediate resolution",
        "Implement automated accessibility testing in CI/CD pipeline",
        "Schedule quarterly accessibility audits",
        "Train development team on accessibility best practices"
      ]
    };

    // Mock remediation issues
    const remediationIssues = violations.slice(0, 20).map((violation: any, index: number) => ({
      id: `issue-${index}`,
      rule: violation.id || `Rule ${index + 1}`,
      description: violation.description || `Description for rule ${index + 1}`,
      impact: (violation.impact || 'minor') as 'critical' | 'serious' | 'moderate' | 'minor',
      effort: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      category: ['color', 'keyboard', 'content', 'structure', 'multimedia', 'forms'][Math.floor(Math.random() * 6)] as any,
      elementsAffected: violation.nodes?.length || Math.floor(Math.random() * 10) + 1,
      estimatedHours: Math.floor(Math.random() * 8) + 1,
      dependencies: [],
      businessValue: Math.floor(Math.random() * 100),
      wcagLevel: 'AA' as const,
      testability: 'automated' as const,
      status: 'not-started' as const
    }));

    return {
      latestScan,
      previousScan,
      violations,
      issues,
      trendData,
      benchmarkData,
      siteStructure,
      executiveSummary,
      remediationIssues
    };
  } catch (error) {
    console.error("Failed to fetch enhanced dashboard data:", error);
    return null;
  }
}

export default async function EnhancedDashboardPage() {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/login");
  }

  const dashboardData = await getEnhancedDashboardData(user.id);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandedHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
              <p className="text-gray-600 mb-6">
                Complete at least one accessibility scan to access the enhanced dashboard features.
              </p>
              <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  const handleIssueUpdate = (issueId: string, updates: any) => {
    // This would be handled by a server action in a real implementation
    console.log('Update issue:', issueId, updates);
  };

  return (
    <div className="min-h-screen bg-background">
      <BrandedHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold font-display tracking-tight">Enhanced Dashboard</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Advanced analytics and insights for accessibility management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="remediation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Remediation
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              ROI
            </TabsTrigger>
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Widgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExecutiveSummary data={dashboardData.executiveSummary} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressAnimations
                score={dashboardData.latestScan.score || 0}
                issues={dashboardData.issues}
              />
              <InteractiveHeatmap
                violations={dashboardData.violations}
                websiteUrl={dashboardData.latestScan.site.url}
              />
            </div>

            {dashboardData.previousScan && (
              <BeforeAfterComparison
                beforeScan={{
                  id: dashboardData.previousScan.id,
                  score: dashboardData.previousScan.score || 0,
                  date: dashboardData.previousScan.createdAt,
                  issues: computeIssueStats(dashboardData.previousScan.raw ? (dashboardData.previousScan.raw as any).violations || [] : []),
                  violations: dashboardData.previousScan.raw ? (dashboardData.previousScan.raw as any).violations || [] : []
                }}
                afterScan={{
                  id: dashboardData.latestScan.id,
                  score: dashboardData.latestScan.score || 0,
                  date: dashboardData.latestScan.createdAt,
                  issues: dashboardData.issues,
                  violations: dashboardData.violations
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <TrendAnalysis data={dashboardData.trendData} />
            <CompetitorBenchmark currentScore={85} websiteUrl="https://example.com" />
            <SiteStructure3D siteData={dashboardData.siteStructure} />
          </TabsContent>

          <TabsContent value="remediation" className="space-y-6">
            <RemediationMatrix
              issues={dashboardData.remediationIssues}
              onUpdateIssue={handleIssueUpdate}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Reports</CardTitle>
                <CardDescription>
                  Generate comprehensive reports with advanced visualizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Enhanced reporting features are integrated into your existing scan reports.
                  Visit any completed scan to see the new visualizations and analytics.
                </p>
                <Button asChild>
                  <a href={`/scans/${dashboardData.latestScan.id}/report`}>
                    View Latest Enhanced Report
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roi" className="space-y-6">
            <ROICalculator />
          </TabsContent>

          <TabsContent value="widgets" className="space-y-6">
            <DragDropDashboard />
          </TabsContent>
        </Tabs>
      </div>
      <BrandedFooter />
    </div>
  );
}