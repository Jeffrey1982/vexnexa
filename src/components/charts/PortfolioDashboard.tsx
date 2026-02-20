"use client";

import { useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend
} from "recharts";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from "lucide-react";

interface PortfolioSite {
  id: string;
  url: string;
  score: number;
  issues: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  performanceScore: number;
  seoScore: number;
  lastScanDate: string;
  trend: number; // Score change from previous scan
}

interface PortfolioDashboardProps {
  sites: PortfolioSite[];
  className?: string;
}

export function PortfolioDashboard({ sites, className = "" }: PortfolioDashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  // Calculate impact score (0-10)
  function calculateImpact(site: PortfolioSite): number {
    const riskMultiplier = {
      'CRITICAL': 10,
      'HIGH': 7,
      'MEDIUM': 4,
      'LOW': 1
    };

    return Math.min(10,
      (riskMultiplier[site.riskLevel] * 0.4) +
      (Math.max(0, 100 - site.score) * 0.05) +
      (Math.min(site.issues, 50) * 0.1)
    );
  }

  // Calculate effort score (0-10)
  function calculateEffort(site: PortfolioSite): number {
    return Math.min(10,
      Math.sqrt(site.issues) * 0.8 +
      (site.performanceScore < 50 ? 2 : 0) +
      (site.seoScore < 50 ? 1 : 0)
    );
  }

  // Calculate priority (impact/effort ratio)
  const calculatePriority = useCallback((site: PortfolioSite): number => {
    const impact = calculateImpact(site);
    const effort = Math.max(1, calculateEffort(site)); // Avoid division by zero
    return Math.round((impact / effort) * 100) / 100;
  }, []);

  // Calculate portfolio analytics
  const analytics = useMemo(() => {
    if (sites.length === 0) return null;

    const totalSites = sites.length;
    const avgScore = Math.round(sites.reduce((sum, site) => sum + site.score, 0) / totalSites);
    const totalIssues = sites.reduce((sum, site) => sum + site.issues, 0);

    // Risk distribution
    const riskDistribution = {
      LOW: sites.filter(s => s.riskLevel === 'LOW').length,
      MEDIUM: sites.filter(s => s.riskLevel === 'MEDIUM').length,
      HIGH: sites.filter(s => s.riskLevel === 'HIGH').length,
      CRITICAL: sites.filter(s => s.riskLevel === 'CRITICAL').length
    };

    // Performance correlation
    const performanceCorrelation = sites.length > 1 ?
      calculateCorrelation(sites.map(s => s.score), sites.map(s => s.performanceScore)) : 0;

    // Trending sites
    const improvingSites = sites.filter(s => s.trend > 0).length;
    const decliningSites = sites.filter(s => s.trend < 0).length;

    // Priority matrix (impact vs effort)
    const priorityMatrix = sites.map(site => ({
      ...site,
      impact: calculateImpact(site),
      effort: calculateEffort(site),
      priority: calculatePriority(site)
    })).sort((a, b) => b.priority - a.priority);

    return {
      totalSites,
      avgScore,
      totalIssues,
      riskDistribution,
      performanceCorrelation,
      improvingSites,
      decliningSites,
      priorityMatrix: priorityMatrix.slice(0, 10) // Top 10 priorities
    };
  }, [sites, calculatePriority]);

  function calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 2) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  }

  // Filter sites based on risk level
  const filteredSites = useMemo(() => {
    if (selectedFilter === 'all') return sites;
    return sites.filter(site => site.riskLevel === selectedFilter.toUpperCase());
  }, [sites, selectedFilter]);

  // Prepare chart data
  const riskChartData = analytics ? [
    { name: 'Low Risk', value: analytics.riskDistribution.LOW, color: '#10B981' },
    { name: 'Medium Risk', value: analytics.riskDistribution.MEDIUM, color: '#F59E0B' },
    { name: 'High Risk', value: analytics.riskDistribution.HIGH, color: '#EF4444' },
    { name: 'Critical Risk', value: analytics.riskDistribution.CRITICAL, color: '#7C2D12' }
  ].filter(item => item.value > 0) : [];

  const performanceData = filteredSites.map(site => ({
    name: site.url.replace(/^https?:\/\//, '').slice(0, 20) + '...',
    accessibility: site.score,
    performance: site.performanceScore,
    seo: site.seoScore,
    fullUrl: site.url
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-semibold mb-1">{data.fullUrl}</div>
          <div className="space-y-1 text-sm">
            <div>Accessibility: {data.accessibility}/100</div>
            <div>Performance: {data.performance}/100</div>
            <div>SEO: {data.seo}/100</div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!sites || sites.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-muted-foreground ${className}`}>
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <div className="text-lg font-semibold">No portfolio data available</div>
          <div className="text-sm">Add sites to see portfolio analytics</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Sites</div>
                <div className="text-2xl font-bold text-blue-600">{analytics.totalSites}</div>
                <div className="text-xs text-muted-foreground">in portfolio</div>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-muted-foreground">Portfolio Average</div>
            <div className={`text-2xl font-bold ${
              analytics.avgScore >= 80 ? 'text-green-600' :
              analytics.avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analytics.avgScore}
            </div>
            <div className="text-xs text-muted-foreground">accessibility score</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Improving</div>
                <div className="text-2xl font-bold text-green-600">{analytics.improvingSites}</div>
                <div className="text-xs text-muted-foreground">sites trending up</div>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">High Risk</div>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.riskDistribution.HIGH + analytics.riskDistribution.CRITICAL}
                </div>
                <div className="text-xs text-muted-foreground">sites need attention</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Risk Distribution and Portfolio Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>

          {riskChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} sites`, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <div className="text-green-600 font-semibold">All Sites Low Risk!</div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Correlation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#000000', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#000000', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Bar dataKey="accessibility" fill="#3B82F6" name="Accessibility" />
              <Bar dataKey="performance" fill="#10B981" name="Performance" />
              <Bar dataKey="seo" fill="#F59E0B" name="SEO" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Matrix */}
      {analytics && analytics.priorityMatrix.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Priority Matrix</h3>
              <p className="text-sm text-muted-foreground">Sites prioritized by impact vs effort ratio</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical Risk</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Site</th>
                  <th className="text-center py-2">Score</th>
                  <th className="text-center py-2">Issues</th>
                  <th className="text-center py-2">Risk Level</th>
                  <th className="text-center py-2">Impact</th>
                  <th className="text-center py-2">Effort</th>
                  <th className="text-center py-2">Priority</th>
                  <th className="text-center py-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {analytics.priorityMatrix.slice(0, 10).map((site, index) => (
                  <tr key={site.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{site.url.replace(/^https?:\/\//, '')}</span>
                      </div>
                    </td>
                    <td className="text-center py-2">
                      <span className={`font-bold ${
                        site.score >= 80 ? 'text-green-600' :
                        site.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {site.score}
                      </span>
                    </td>
                    <td className="text-center py-2">{site.issues}</td>
                    <td className="text-center py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        site.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        site.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        site.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {site.riskLevel}
                      </span>
                    </td>
                    <td className="text-center py-2">
                      <span className="font-medium">{site.impact.toFixed(1)}</span>
                    </td>
                    <td className="text-center py-2">
                      <span className="font-medium">{site.effort.toFixed(1)}</span>
                    </td>
                    <td className="text-center py-2">
                      <span className="font-bold text-purple-600">{site.priority.toFixed(2)}</span>
                    </td>
                    <td className="text-center py-2">
                      <div className="flex items-center justify-center">
                        {site.trend > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : site.trend < 0 ? (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portfolio Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Users className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Portfolio Insights</h4>

            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Key Recommendations:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Focus on top {Math.min(3, analytics.priorityMatrix.length)} priority sites for maximum impact</li>
                    <li>• {analytics.riskDistribution.CRITICAL > 0 ?
                      `Address ${analytics.riskDistribution.CRITICAL} critical risk sites immediately` :
                      'Great job! No critical risk sites detected'}</li>
                    <li>• Performance correlation: {
                      analytics.performanceCorrelation > 0.5 ? 'Strong positive correlation with accessibility' :
                      analytics.performanceCorrelation > 0 ? 'Moderate correlation - room for improvement' :
                      'Weak correlation - investigate performance bottlenecks'
                    }</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Portfolio Health:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Average score: {analytics.avgScore >= 75 ? 'Good' : analytics.avgScore >= 50 ? 'Fair' : 'Needs improvement'}</li>
                    <li>• Risk distribution: {
                      analytics.riskDistribution.LOW / analytics.totalSites > 0.7 ? 'Well managed' :
                      analytics.riskDistribution.CRITICAL === 0 ? 'Stable' : 'Requires attention'
                    }</li>
                    <li>• Trending: {analytics.improvingSites} improving, {analytics.decliningSites} declining</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}