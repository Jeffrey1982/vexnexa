"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from "recharts";
import {
  Zap,
  TrendingUp,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Target,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface PerformanceData {
  accessibilityScore: number;
  performanceScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  seoScore: number;
  date: string;
  url?: string;
}

interface PerformanceImpactAnalysisProps {
  data: PerformanceData[];
  className?: string;
}

export function PerformanceImpactAnalysis({ data, className = "" }: PerformanceImpactAnalysisProps) {
  // Calculate correlation and insights
  const analytics = useMemo(() => {
    if (data.length < 3) return null;

    // Calculate accessibility-performance correlation
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.accessibilityScore, 0);
    const sumY = data.reduce((sum, d) => sum + d.performanceScore, 0);
    const sumXY = data.reduce((sum, d) => sum + (d.accessibilityScore * d.performanceScore), 0);
    const sumXX = data.reduce((sum, d) => sum + (d.accessibilityScore * d.accessibilityScore), 0);
    const sumYY = data.reduce((sum, d) => sum + (d.performanceScore * d.performanceScore), 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    // Calculate averages
    const avgAccessibility = sumX / n;
    const avgPerformance = sumY / n;
    const avgSEO = data.reduce((sum, d) => sum + d.seoScore, 0) / n;

    // Core Web Vitals assessment
    const goodLCP = data.filter(d => d.largestContentfulPaint <= 2500).length / n;
    const goodFID = data.filter(d => d.firstInputDelay <= 100).length / n;
    const goodCLS = data.filter(d => d.cumulativeLayoutShift <= 0.1).length / n;
    const webVitalsScore = (goodLCP + goodFID + goodCLS) / 3;

    // Performance impact on SEO
    const seoCorrelation = data.length > 1 ?
      data.reduce((sum, d) => sum + (d.performanceScore * d.seoScore), 0) / n -
      (avgPerformance * avgSEO) : 0;

    return {
      correlation: isNaN(correlation) ? 0 : correlation,
      avgAccessibility: Math.round(avgAccessibility),
      avgPerformance: Math.round(avgPerformance),
      avgSEO: Math.round(avgSEO),
      webVitalsScore: Math.round(webVitalsScore * 100),
      seoCorrelation: Math.round(seoCorrelation * 100) / 100,
      trend: data.length > 1 ?
        data[data.length - 1].accessibilityScore - data[0].accessibilityScore : 0
    };
  }, [data]);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      id: index,
      size: item.seoScore / 5, // Size based on SEO score
      category: getPerformanceCategory(item.performanceScore, item.accessibilityScore)
    }));
  }, [data]);

  // Core Web Vitals trend data
  const vitalsData = useMemo(() => {
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      LCP: Math.round(item.largestContentfulPaint / 100) / 10, // Convert to seconds
      FID: Math.round(item.firstInputDelay),
      CLS: Math.round(item.cumulativeLayoutShift * 100) / 100,
      TBT: Math.round(item.totalBlockingTime / 10) / 10 // Convert to ms/10
    }));
  }, [data]);

  function getPerformanceCategory(performanceScore: number, accessibilityScore: number) {
    if (performanceScore >= 80 && accessibilityScore >= 80) return "excellent";
    if (performanceScore >= 60 && accessibilityScore >= 60) return "good";
    if (performanceScore >= 40 || accessibilityScore >= 40) return "needs-improvement";
    return "poor";
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "excellent": return "#10B981";
      case "good": return "#3B82F6";
      case "needs-improvement": return "#F59E0B";
      case "poor": return "#EF4444";
      default: return "#6B7280";
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-semibold mb-2">{data.url || "Page"}</div>
          <div className="space-y-1 text-sm">
            <div>Accessibility: {data.accessibilityScore}/100</div>
            <div>Performance: {data.performanceScore}/100</div>
            <div>SEO: {data.seoScore}/100</div>
            <div className="text-xs text-gray-500 mt-2">{data.date}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <Gauge className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="text-lg font-semibold">No performance data available</div>
          <div className="text-sm">Run scans to see performance analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Correlation</div>
                <div className={`text-2xl font-bold ${
                  analytics.correlation > 0.5 ? 'text-green-600' :
                  analytics.correlation > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(analytics.correlation * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">accessibility-performance</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Web Vitals</div>
                <div className={`text-2xl font-bold ${
                  analytics.webVitalsScore >= 75 ? 'text-green-600' :
                  analytics.webVitalsScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analytics.webVitalsScore}%
                </div>
                <div className="text-xs text-gray-500">passing thresholds</div>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Avg Performance</div>
            <div className={`text-2xl font-bold ${
              analytics.avgPerformance >= 80 ? 'text-green-600' :
              analytics.avgPerformance >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analytics.avgPerformance}
            </div>
            <div className="text-xs text-gray-500">performance score</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">SEO Impact</div>
                <div className={`text-2xl font-bold ${
                  analytics.avgSEO >= 80 ? 'text-green-600' :
                  analytics.avgSEO >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analytics.avgSEO}
                </div>
                <div className="text-xs text-gray-500">SEO score</div>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Correlation Scatter Plot */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance vs Accessibility</h3>
          <p className="text-sm text-gray-600">
            Correlation analysis between accessibility and performance scores
          </p>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              type="number"
              dataKey="accessibilityScore"
              name="Accessibility Score"
              domain={[0, 100]}
              tick={{ fill: '#000000', fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="performanceScore"
              name="Performance Score"
              domain={[0, 100]}
              tick={{ fill: '#000000', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference lines for good scores */}
            <ReferenceLine x={80} stroke="#10B981" strokeDasharray="3 3" />
            <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" />

            {/* Data points by category */}
            {["excellent", "good", "needs-improvement", "poor"].map(category => (
              <Scatter
                key={category}
                name={category}
                data={scatterData.filter(d => d.category === category)}
                fill={getCategoryColor(category)}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>

        <div className="flex justify-center mt-4 space-x-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Excellent (80+ both)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Good (60+ both)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Needs Improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Poor</span>
          </div>
        </div>
      </div>

      {/* Core Web Vitals Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Core Web Vitals Trends</h3>
          <p className="text-sm text-gray-600">
            Track key performance metrics over time
          </p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={vitalsData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#000000', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#000000', fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number, name: string) => {
                switch (name) {
                  case 'LCP': return [`${value}s`, 'LCP (Largest Contentful Paint)'];
                  case 'FID': return [`${value}ms`, 'FID (First Input Delay)'];
                  case 'CLS': return [value, 'CLS (Cumulative Layout Shift)'];
                  case 'TBT': return [`${value}ms`, 'TBT (Total Blocking Time)'];
                  default: return [value, name];
                }
              }}
            />
            <Legend />

            <Line
              type="monotone"
              dataKey="LCP"
              stroke="#EF4444"
              strokeWidth={2}
              name="LCP (s)"
            />
            <Line
              type="monotone"
              dataKey="FID"
              stroke="#F59E0B"
              strokeWidth={2}
              name="FID (ms)"
            />
            <Line
              type="monotone"
              dataKey="CLS"
              stroke="#8B5CF6"
              strokeWidth={2}
              name="CLS"
            />

            {/* Good thresholds */}
            <ReferenceLine y={2.5} stroke="#10B981" strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Performance Optimization Opportunities</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Accessibility-Performance Wins:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Image alt text improves both accessibility and SEO</li>
                  <li>• Proper heading structure helps page parsing</li>
                  <li>• Focus management reduces JavaScript overhead</li>
                  <li>• Color contrast reduces eye strain and improves readability</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Core Web Vitals Impact:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Optimize LCP: Improve image loading and server response</li>
                  <li>• Reduce FID: Minimize JavaScript execution time</li>
                  <li>• Fix CLS: Use proper image dimensions and fonts</li>
                  <li>• Lower TBT: Break up long-running tasks</li>
                </ul>
              </div>
            </div>

            {analytics && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Correlation strength:</span>
                  <span className={`font-bold ${
                    analytics.correlation > 0.5 ? 'text-green-600' :
                    analytics.correlation > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analytics.correlation > 0.7 ? 'Strong' :
                     analytics.correlation > 0.3 ? 'Moderate' : 'Weak'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Trend:</span>
                  <div className="flex items-center gap-1">
                    {analytics.trend > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : analytics.trend < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    ) : (
                      <span className="text-gray-600">Stable</span>
                    )}
                    <span className={analytics.trend > 0 ? 'text-green-600' : analytics.trend < 0 ? 'text-red-600' : 'text-gray-600'}>
                      {Math.abs(analytics.trend)} points
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}