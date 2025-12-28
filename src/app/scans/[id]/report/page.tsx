import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ImpactBadge } from "@/components/ImpactBadge";
import { KeyValue } from "@/components/KeyValue";
import { formatDate } from "@/lib/format";
import { computeIssueStats, Violation, getTopViolations, normalizeImpact } from "@/lib/axe-types";
import { PrintButton } from "@/components/PrintButton";
import {
  getScanTrendData,
  getBenchmarkComparison,
  getScanComparison,
  getViolationTrends,
  calculateWCAGCompliance
} from "@/lib/analytics";
import {
  ScoreTrendChart,
  IssuesTrendChart,
  BenchmarkChart,
  ViolationDistributionChart,
  ViolationTrendChart,
  ComparisonCard
} from "@/components/charts";
import { InteractiveHeatmap } from "@/components/enhanced/InteractiveHeatmap";
import { BeforeAfterComparison } from "@/components/enhanced/BeforeAfterComparison";
import { RemediationMatrix } from "@/components/enhanced/RemediationMatrix";
import { MultiFormatExporter } from "@/components/enhanced/MultiFormatExporter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandedHeader from "@/components/white-label/BrandedHeader";
import BrandedFooter from "@/components/white-label/BrandedFooter";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getScanDetails(id: string) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        site: {
          include: {
            user: true,
          },
        },
        page: true,
      },
    });
    return scan;
  } catch (error) {
    console.error("Failed to fetch scan:", error);
    return null;
  }
}

async function getEnhancedAnalytics(scan: any) {
  try {
    // Get trend data for the last 30 days
    const trendData = await getScanTrendData(
      scan.siteId,
      scan.pageId,
      30
    );

    // Get benchmark comparison
    const benchmarkComparison = await getBenchmarkComparison({
      score: scan.score || 0,
      impactCritical: scan.impactCritical,
      impactSerious: scan.impactSerious,
      impactModerate: scan.impactModerate,
      impactMinor: scan.impactMinor,
    });

    // Get scan comparison
    const scanComparison = await getScanComparison(scan.id);

    // Get violation trends
    const violationTrends = await getViolationTrends(
      scan.siteId,
      scan.pageId,
      30
    );

    return {
      trendData,
      benchmarkComparison,
      scanComparison,
      violationTrends,
    };
  } catch (error) {
    console.error("Failed to get enhanced analytics:", error);
    return {
      trendData: [],
      benchmarkComparison: null,
      scanComparison: { current: { score: scan.score || 0, issues: scan.issues || 0, critical: scan.impactCritical, serious: scan.impactSerious, moderate: scan.impactModerate, minor: scan.impactMinor } },
      violationTrends: [],
    };
  }
}


export default async function PrintReportPage({ params }: PageProps) {
  const { id } = await params;
  const scan = await getScanDetails(id);

  if (!scan) {
    notFound();
  }

  // Extract violations from raw data
  let violations: Violation[] = [];
  if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
    violations = (scan.raw as any).violations || [];
  }

  const stats = computeIssueStats(violations);
  const topViolations = getTopViolations(violations, 20);
  const siteUrl = scan.page?.url || scan.site.url;

  // Get enhanced analytics
  const analytics = await getEnhancedAnalytics(scan);

  // Calculate WCAG compliance
  const wcagAACompliance = (scan as any).wcagAACompliance || calculateWCAGCompliance(violations, "AA");
  const wcagAAACompliance = (scan as any).wcagAAACompliance || calculateWCAGCompliance(violations, "AAA");

  return (
    <>
      <BrandedHeader />
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-size: 12pt; line-height: 1.4; }
          .print-page-break { page-break-before: always; }
          h1 { font-size: 24pt; color: #1f2937 !important; }
          h2 { font-size: 18pt; color: #374151 !important; margin-top: 20pt; margin-bottom: 10pt; }
          h3 { font-size: 14pt; color: #4b5563 !important; margin-top: 15pt; margin-bottom: 8pt; }
          .print-table { border-collapse: collapse; width: 100%; margin-bottom: 15pt; }
          .print-table th, .print-table td { border: 1pt solid #e5e7eb; padding: 8pt; text-align: left; vertical-align: top; }
          .print-table th { background-color: #f9fafb; font-weight: bold; }
        }
        @page { margin: 1in; size: A4; }
      `}} />

      <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
        <div className="flex justify-between items-center mb-6 no-print">
          <PrintButton />
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Accessibility Report</h1>
          <p className="text-xl text-gray-600 mb-1">{new URL(siteUrl).hostname}</p>
          <p className="text-lg text-blue-600">{siteUrl}</p>
          <div className="mt-4">
            {scan.score !== null && <ScoreBadge score={scan.score} size="lg" />}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Executive Summary</h2>

          <table className="print-table w-full mb-6">
            <tbody>
              <tr>
                <td className="font-semibold bg-gray-50">Scan Date</td>
                <td>{formatDate(scan.createdAt)}</td>
                <td className="font-semibold bg-gray-50">Score</td>
                <td className="font-bold text-lg">{scan.score || 0}/100</td>
              </tr>
              <tr>
                <td className="font-semibold bg-gray-50">Status</td>
                <td className="uppercase">{scan.status}</td>
                <td className="font-semibold bg-gray-50">Total Issues</td>
                <td className="font-bold text-lg">{stats.total}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-gray-50">WCAG AA Compliance</td>
                <td className="font-bold text-lg">{wcagAACompliance}%</td>
                <td className="font-semibold bg-gray-50">WCAG AAA Compliance</td>
                <td className="font-bold text-lg">{wcagAAACompliance}%</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-xl font-semibold mb-3">Issues by Impact Level</h3>
          <table className="print-table w-full">
            <thead>
              <tr>
                <th className="text-center">Critical</th>
                <th className="text-center">Serious</th>
                <th className="text-center">Moderate</th>
                <th className="text-center">Minor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-center text-2xl font-bold text-red-600">{stats.critical}</td>
                <td className="text-center text-2xl font-bold text-orange-600">{stats.serious}</td>
                <td className="text-center text-2xl font-bold text-yellow-600">{stats.moderate}</td>
                <td className="text-center text-2xl font-bold text-gray-600">{stats.minor}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="no-print mb-8">
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="interactive">Interactive</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-8">
              {/* Scan Comparison */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Comparison Analysis</h2>
                <ComparisonCard comparison={analytics.scanComparison} />
              </div>

              {/* Benchmark Comparison */}
              {analytics.benchmarkComparison && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Industry Benchmark</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <BenchmarkChart
                      comparison={analytics.benchmarkComparison}
                      height={250}
                    />
                  </div>
                </div>
              )}

              {/* Violation Distribution */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Issues Distribution</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <ViolationDistributionChart
                    data={{
                      critical: stats.critical,
                      serious: stats.serious,
                      moderate: stats.moderate,
                      minor: stats.minor
                    }}
                    height={300}
                  />
                </div>
              </div>

              {/* Historical Trends */}
              {analytics.trendData.length > 1 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Historical Trends</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Score Trend</h3>
                      <ScoreTrendChart
                        data={analytics.trendData}
                        height={250}
                        showLegend={false}
                      />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Issues Trend</h3>
                      <IssuesTrendChart
                        data={analytics.trendData}
                        height={250}
                        showLegend={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Violation Trends */}
              {analytics.violationTrends.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Violation Trends</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <ViolationTrendChart
                      violations={analytics.violationTrends}
                      height={350}
                      maxRules={6}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="interactive" className="space-y-6">
              {/* Interactive Heatmap */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Interactive Accessibility Heatmap</h2>
                <InteractiveHeatmap
                  violations={violations}
                  websiteUrl={siteUrl}
                  className="min-h-[600px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              {/* Before/After Comparison */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Before/After Analysis</h2>
                <BeforeAfterComparison
                  beforeScan={{
                    id: 'previous',
                    score: ('previous' in analytics.scanComparison && analytics.scanComparison.previous?.score) || 0,
                    date: new Date(),
                    issues: {
                      total: ('previous' in analytics.scanComparison && analytics.scanComparison.previous?.issues) || 0,
                      critical: ('previous' in analytics.scanComparison && analytics.scanComparison.previous?.critical) || 0,
                      serious: ('previous' in analytics.scanComparison && analytics.scanComparison.previous?.serious) || 0,
                      moderate: ('previous' in analytics.scanComparison && analytics.scanComparison.previous?.moderate) || 0,
                      minor: ('previous' in analytics.scanComparison && analytics.scanComparison.previous?.minor) || 0
                    },
                    violations: []
                  }}
                  afterScan={{
                    id: scan.id,
                    score: scan.score || 0,
                    date: scan.createdAt,
                    issues: stats,
                    violations: violations.map(v => ({
                      id: v.id,
                      impact: v.impact || 'minor',
                      description: v.description,
                      nodes: v.nodes.map(n => ({ target: n.target }))
                    }))
                  }}
                />
              </div>

              {/* Remediation Matrix */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Remediation Priority Matrix</h2>
                <RemediationMatrix
                  issues={violations.map((v, i) => ({
                    id: `${v.id}-${i}`,
                    rule: v.id,
                    description: v.description,
                    impact: (v.impact as 'critical' | 'serious' | 'moderate' | 'minor') || 'minor',
                    effort: 'medium' as const,
                    category: 'structure' as const,
                    elementsAffected: v.nodes.length,
                    estimatedHours: 2,
                    dependencies: [],
                    businessValue: v.impact === 'critical' ? 100 : v.impact === 'serious' ? 75 : 50,
                    wcagLevel: 'AA' as const,
                    testability: 'automated' as const,
                    assignee: '',
                    status: 'not-started' as const,
                    dueDate: new Date()
                  }))}
                  onUpdateIssue={() => {}}
                />
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              {/* Multi-Format Export */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Export Options</h2>
                <MultiFormatExporter
                  scanData={{
                    id: scan.id,
                    url: scan.site.url,
                    score: scan.score || 0,
                    issues: stats,
                    violations: violations,
                    createdAt: scan.createdAt
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Top Issues */}
        {topViolations.length > 0 && (
          <>
            <div className="print-page-break">
              <h2 className="text-2xl font-semibold mb-4">Top {Math.min(topViolations.length, 20)} Accessibility Violations</h2>
              
              <table className="print-table w-full">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Rule</th>
                    <th style={{ width: '12%' }}>Impact</th>
                    <th style={{ width: '8%' }}>Elements</th>
                    <th style={{ width: '55%' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {topViolations.slice(0, 15).map((violation, index) => (
                    <tr key={index}>
                      <td>
                        <div className="font-mono text-sm font-semibold mb-1">
                          {violation.id}
                        </div>
                        <div className="text-sm">
                          {violation.help}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                            violation.impact === 'critical' ? 'bg-red-100 text-red-800' :
                            violation.impact === 'serious' ? 'bg-orange-100 text-orange-800' :
                            violation.impact === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {violation.impact || 'minor'}
                        </span>
                      </td>
                      <td className="text-center font-semibold">
                        {violation.nodes.length}
                      </td>
                      <td className="text-sm">
                        {violation.description.length > 200 
                          ? violation.description.substring(0, 200) + "..."
                          : violation.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed Issues */}
            <div className="print-page-break">
              <h2 className="text-2xl font-semibold mb-4">Detailed Issue Analysis</h2>
              
              {topViolations.slice(0, 10).map((violation, index) => (
                <div key={index} className="mb-6 border border-gray-300 rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold">{violation.help}</h3>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {violation.id}
                      </span>
                      <ImpactBadge impact={normalizeImpact(violation.impact)} />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {violation.description}
                  </p>
                  
                  <p className="text-sm font-medium mb-2">
                    Affects {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
                  </p>
                  
                  {violation.nodes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Sample CSS Selectors:</p>
                      <ul className="list-disc list-inside text-xs font-mono text-gray-600 ml-4">
                        {violation.nodes.slice(0, 5).map((node, nodeIndex) => (
                          <li key={nodeIndex} className="mb-1">
                            {node.target.join(", ")}
                          </li>
                        ))}
                        {violation.nodes.length > 5 && (
                          <li className="text-gray-500">
                            ... and {violation.nodes.length - 5} more elements
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>Generated by VexNexa on {formatDate(new Date())}</p>
          <p>Report ID: {scan.id.slice(-8)}</p>
        </div>
      </div>
      <BrandedFooter />
    </>
  );
}