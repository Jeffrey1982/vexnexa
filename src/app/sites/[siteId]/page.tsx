'use client';

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import StartCrawlButton from "./StartCrawlButton";
import PagesTable from "./PagesTable";
import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { createClient } from "@/lib/supabase/client-new";

export default function SitePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'monitoring' | 'reports'>('overview');
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const response = await fetch(`/api/sites/${siteId}`);
      const data = await response.json();
      setSite(data);
      setLoading(false);
    }
    fetchData();
  }, [siteId, supabase]);

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Loading...</div>;
  }

  if (!site) {
    notFound();
  }

  const latestScan = site.scans?.[0];
  const latestCrawl = site.crawls?.[0];

  // Calculate top issues from real scan data
  const calculateTopIssues = () => {
    const violationCounts: Record<string, { count: number; description: string }> = {};

    // Aggregate violations from all pages' latest scans
    site.pages?.forEach((page: any) => {
      const latestPageScan = page.scans?.[0];
      if (latestPageScan?.raw && typeof latestPageScan.raw === 'object' && 'violations' in latestPageScan.raw) {
        const violations = (latestPageScan.raw as any).violations || [];
        violations.forEach((violation: any) => {
          const id = violation.id || 'unknown';
          const description = violation.description || violation.help || id;
          const nodeCount = violation.nodes?.length || 1;

          if (!violationCounts[id]) {
            violationCounts[id] = { count: 0, description };
          }
          violationCounts[id].count += nodeCount;
        });
      }
    });

    // Sort by count and return top 5
    return Object.entries(violationCounts)
      .map(([id, data]) => ({
        id,
        description: data.description,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topIssues = calculateTopIssues();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/dashboard"
              className="text-primary-500 hover:text-primary-600 text-sm"
            >
              ← Back to Dashboard
            </Link>
          </nav>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Site Details
              </h1>
              <p className="text-lg text-muted-foreground mb-1">{site.url}</p>
              <p className="text-sm text-muted-foreground">
                {site.pages?.length || 0} pages discovered
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/sites/${siteId}/structure`}>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
                  🔮 3D Structure
                </button>
              </Link>
              <StartCrawlButton siteId={siteId} />
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`${
                  activeTab === 'monitoring'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🔍 Monitoring
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`${
                  activeTab === 'reports'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📄 Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
        {/* Crawl Status */}
        {latestCrawl && (
          <div className="bg-card rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Latest Site Crawl</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`font-medium ${
                  latestCrawl.status === 'done' ? 'text-green-600' :
                  latestCrawl.status === 'running' ? 'text-blue-600' :
                  latestCrawl.status === 'error' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {latestCrawl.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Queued</p>
                <p className="font-medium">{latestCrawl.pagesQueued}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Done</p>
                <p className="font-medium">{latestCrawl.pagesDone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Pages</p>
                <p className="font-medium">{latestCrawl.maxPages}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">
                  {new Date(latestCrawl.startedAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{latestCrawl.pagesDone} / {latestCrawl.maxPages}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (latestCrawl.pagesDone / Math.max(1, latestCrawl.maxPages)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Site Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Total Pages
            </h3>
            <p className="text-3xl font-bold text-blue-500">
              {site.pages.length}
            </p>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Average Score
            </h3>
            <p className="text-3xl font-bold text-blue-300">
              {site.pages?.length > 0
                ? Math.round(
                    site.pages
                      .filter((p: any) => p.scans.length > 0)
                      .reduce((sum: number, p: any) => sum + (p.scans[0]?.score || 0), 0) /
                    site.pages.filter((p: any) => p.scans.length > 0).length
                  ) || 0
                : 0
              }
            </p>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Critical Issues
            </h3>
            <p className="text-3xl font-bold text-primary-500">
              {site.pages
                .filter((p: any) => p.scans.length > 0)
                .reduce((sum: number, p: any) => sum + (p.scans[0]?.impactCritical || 0), 0)
              }
            </p>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Total Issues
            </h3>
            <p className="text-3xl font-bold text-gold-500">
              {site.pages
                .filter((p: any) => p.scans.length > 0)
                .reduce((sum: number, p: any) => sum + (p.scans[0]?.issues || 0), 0)
              }
            </p>
          </div>
        </div>

        {/* Pages Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Discovered Pages
            </h2>
          </div>
          <PagesTable pages={site.pages} />
        </div>

        {/* Recent Crawls */}
        {site.scans.length > 0 && (
          <div className="mt-8 bg-card rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Recent Crawls
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {site.scans.map((scan: any) => (
                    <tr key={scan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {new Date(scan.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          scan.status === 'done' 
                            ? 'bg-green-100 text-green-800'
                            : scan.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : scan.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {scan.score || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {scan.issues || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Score Trend Chart */}
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Accessibility Score Trend</h2>
              {(!site.scans || site.scans.length === 0) ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No scan data available yet. Run a scan to see trends.
                </div>
              ) : (
                <div className="h-64 flex items-end gap-2">
                  {site.scans.slice(0, 10).reverse().map((scan: any) => {
                    const score = scan.score || 0;
                    return (
                      <div key={scan.id} className="flex-1 flex flex-col items-center h-full justify-end">
                        <div className="text-xs font-medium text-foreground mb-1">{score}</div>
                        <div
                          className={`w-full rounded-t transition-all ${
                            score >= 90 ? 'bg-blue-400' :
                            score >= 70 ? 'bg-gold-500' :
                            'bg-primary-500'
                          }`}
                          style={{ height: `${Math.max(score, 2)}%` }}
                          title={`Score: ${score}`}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1.5 truncate w-full text-center">
                          {new Date(scan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Issues Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Issues by Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Critical</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactCritical || 0), 0) || 0) * 10)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-foreground">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactCritical || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Serious</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactSerious || 0), 0) || 0) * 10)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-foreground">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactSerious || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Moderate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactModerate || 0), 0) || 0) * 5)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-foreground">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactModerate || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Minor</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactMinor || 0), 0) || 0) * 2)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-foreground">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactMinor || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Issues</h3>
                <div className="space-y-2">
                  {topIssues.length > 0 ? (
                    topIssues.map((issue, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b">
                        <span className="text-sm text-muted-foreground" title={issue.id}>
                          {issue.description.length > 40
                            ? issue.description.substring(0, 40) + '...'
                            : issue.description}
                        </span>
                        <span className="text-sm font-medium">{issue.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No issues found. Scan your pages to see violations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Site Health Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-blue-500">{site.scans?.length || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Scans</div>
                </div>
                <div className="text-center p-4 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-primary-500">
                    {site.scans?.filter((s: any) => s.status === 'done').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Completed Scans</div>
                </div>
                <div className="text-center p-4 bg-gold-50 dark:bg-gold-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-gold-600">{site.pages?.length || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Monitored Pages</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Scan History</h3>
              {(!site.scans || site.scans.length === 0) ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No scans have been run yet. Start a crawl to begin monitoring.
                </div>
              ) : (
                <div className="space-y-3">
                  {site.scans.slice(0, 5).map((scan: any) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          scan.status === 'done' ? 'bg-blue-400' :
                          scan.status === 'running' ? 'bg-gold-500' :
                          'bg-primary-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-sm">{new Date(scan.createdAt).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Score: {scan.score ?? 'N/A'} | Issues: {scan.issues ?? 0}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        scan.status === 'done' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        scan.status === 'running' ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300' :
                        'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Scan Reports</h2>
              {(!site.scans || site.scans.filter((s: any) => s.status === 'done').length === 0) ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No completed scans yet. Run a scan to generate reports.
                </div>
              ) : (
                <div className="space-y-3">
                  {site.scans.filter((s: any) => s.status === 'done').slice(0, 10).map((scan: any) => (
                    <div key={scan.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📄</div>
                        <div>
                          <div className="font-medium">
                            Scan Report — Score: {scan.score ?? 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(scan.createdAt).toLocaleString()} · {scan.issues ?? 0} issues
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/scans/${scan.id}`}
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                      >
                        View Report →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
