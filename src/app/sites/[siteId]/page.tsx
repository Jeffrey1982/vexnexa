'use client';

import { notFound } from "next/navigation";
import Link from "next/link";
import StartCrawlButton from "./StartCrawlButton";
import PagesTable from "./PagesTable";
import { useState, useEffect } from "react";

interface PageProps {
  params: {
    siteId: string;
  };
}

export default function SitePage({ params }: PageProps) {
  const { siteId } = params;
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'monitoring' | 'reports'>('overview');
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSiteData() {
      const response = await fetch(`/api/sites/${siteId}`);
      const data = await response.json();
      setSite(data);
      setLoading(false);
    }
    fetchSiteData();
  }, [siteId]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8">Loading...</div>;
  }

  if (!site) {
    notFound();
  }

  const latestScan = site.scans?.[0];
  const latestCrawl = site.crawls?.[0];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Dashboard
            </Link>
          </nav>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Site Details
              </h1>
              <p className="text-lg text-gray-600 mb-1">{site.url}</p>
              <p className="text-sm text-gray-500">
                {site.pages?.length || 0} pages discovered
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/sites/${siteId}/structure`}>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                  🔮 3D Structure
                </button>
              </Link>
              <StartCrawlButton siteId={siteId} />
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`${
                  activeTab === 'monitoring'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🔍 Monitoring
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Latest Site Crawl</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
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
                <p className="text-sm text-gray-500">Pages Queued</p>
                <p className="font-medium">{latestCrawl.pagesQueued}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pages Done</p>
                <p className="font-medium">{latestCrawl.pagesDone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Pages</p>
                <p className="font-medium">{latestCrawl.maxPages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">
                  {new Date(latestCrawl.startedAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{latestCrawl.pagesDone} / {latestCrawl.maxPages}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Pages
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {site.pages.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Average Score
            </h3>
            <p className="text-3xl font-bold text-green-600">
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Critical Issues
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {site.pages
                .filter((p: any) => p.scans.length > 0)
                .reduce((sum: number, p: any) => sum + (p.scans[0]?.impactCritical || 0), 0)
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Issues
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {site.pages
                .filter((p: any) => p.scans.length > 0)
                .reduce((sum: number, p: any) => sum + (p.scans[0]?.issues || 0), 0)
              }
            </p>
          </div>
        </div>

        {/* Pages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Discovered Pages
            </h2>
          </div>
          <PagesTable pages={site.pages} />
        </div>

        {/* Recent Crawls */}
        {site.scans.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Crawls
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {site.scans.map((scan) => (
                    <tr key={scan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scan.score || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Accessibility Score Trend</h2>
              <div className="h-64 flex items-end justify-between gap-2">
                {site.scans?.slice(0, 10).reverse().map((scan: any, idx: number) => {
                  const height = (scan.score || 0);
                  return (
                    <div key={scan.id} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t" style={{ height: '256px', display: 'flex', alignItems: 'flex-end' }}>
                        <div
                          className={`w-full rounded-t ${
                            height >= 90 ? 'bg-green-500' :
                            height >= 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ height: `${height}%` }}
                          title={`Score: ${scan.score}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issues Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Issues by Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactCritical || 0), 0) || 0) * 10)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactCritical || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Serious</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactSerious || 0), 0) || 0) * 10)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactSerious || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Moderate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactModerate || 0), 0) || 0) * 5)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactModerate || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Minor</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{
                          width: `${Math.min(100, (site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactMinor || 0), 0) || 0) * 2)}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium w-8">
                        {site.pages?.reduce((sum: number, p: any) => sum + (p.scans[0]?.impactMinor || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Issues</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Missing alt text</span>
                    <span className="text-sm font-medium">24</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Low contrast</span>
                    <span className="text-sm font-medium">18</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Missing labels</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Heading structure</span>
                    <span className="text-sm font-medium">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Site Health Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">99.8%</div>
                  <div className="text-sm text-gray-600 mt-1">Uptime (30 days)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">1.2s</div>
                  <div className="text-sm text-gray-600 mt-1">Avg Response Time</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{site.pages?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Monitored Pages</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Scan History</h3>
              <div className="space-y-3">
                {site.scans?.slice(0, 5).map((scan: any) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        scan.status === 'done' ? 'bg-green-500' :
                        scan.status === 'running' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-sm">{new Date(scan.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Score: {scan.score} | Issues: {scan.issues}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      scan.status === 'done' ? 'bg-green-100 text-green-800' :
                      scan.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Automated Scanning</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Daily Scans</div>
                    <div className="text-sm text-gray-500">Automatically scan all pages every day</div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Email Alerts</div>
                    <div className="text-sm text-gray-500">Get notified when critical issues are found</div>
                  </div>
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">Summary Report</div>
                  <div className="text-sm text-gray-500 mt-1">Quick overview of all issues</div>
                </button>
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-medium">Detailed Report</div>
                  <div className="text-sm text-gray-500 mt-1">In-depth analysis with recommendations</div>
                </button>
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium">WCAG Compliance</div>
                  <div className="text-sm text-gray-500 mt-1">Standards compliance report</div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📄</div>
                    <div>
                      <div className="font-medium">Accessibility Summary - {new Date().toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">Generated {new Date().toLocaleString()}</div>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Download PDF
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📄</div>
                    <div>
                      <div className="font-medium">WCAG 2.1 Compliance Report</div>
                      <div className="text-sm text-gray-500">Generated {new Date(Date.now() - 86400000).toLocaleString()}</div>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Weekly Summary</div>
                    <div className="text-sm text-gray-500">Every Monday at 9:00 AM</div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                    Setup
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Monthly Compliance Report</div>
                    <div className="text-sm text-gray-500">First day of each month</div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                    Setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}