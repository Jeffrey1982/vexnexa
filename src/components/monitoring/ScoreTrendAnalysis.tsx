"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendDataPoint {
  date: string;
  score: number;
  issues: number;
  wcagAACompliance?: number;
  performanceScore?: number;
  siteUrl: string;
  siteId: string;
}

interface TrendAnalysisData {
  trends: TrendDataPoint[];
  insights: {
    overallTrend: 'improving' | 'declining' | 'stable';
    trendPercentage: number;
    bestPerformingSite: string;
    worstPerformingSite: string;
    avgScoreChange: number;
    patterns: Array<{
      type: 'seasonal' | 'weekly' | 'gradual' | 'sudden';
      description: string;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    recommendations: string[];
  };
  predictions: {
    nextWeekScore: number;
    confidence: number;
    factors: string[];
  };
}

interface ScoreTrendAnalysisProps {
  timeRange?: '7d' | '30d' | '90d';
  siteFilter?: string;
  className?: string;
}

export function ScoreTrendAnalysis({
  timeRange = '30d',
  siteFilter = 'all',
  className
}: ScoreTrendAnalysisProps) {
  const [data, setData] = useState<TrendAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(timeRange);
  const [selectedSite, setSelectedSite] = useState(siteFilter);

  useEffect(() => {
    fetchTrendData();
  }, [selectedRange, selectedSite]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeRange: selectedRange,
        ...(selectedSite !== 'all' && { siteId: selectedSite })
      });

      const response = await fetch(`/api/monitoring/trends?${params}`);
      if (response.ok) {
        const trendData = await response.json();
        setData(trendData);
      }
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50 border-green-200';
      case 'declining': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'seasonal': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <BarChart3 className="w-4 h-4" />;
      case 'gradual': return <TrendingUp className="w-4 h-4" />;
      case 'sudden': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUp className="w-3 h-3" />
          <span className="text-xs">+{change.toFixed(1)}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <ArrowDown className="w-3 h-3" />
          <span className="text-xs">{change.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="w-3 h-3" />
          <span className="text-xs">0%</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("text-center py-8", className)}>
        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Trend Data Available</h3>
        <p className="text-muted-foreground">
          Insufficient historical data for trend analysis. Run more scans to generate insights.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as '7d' | '30d' | '90d')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSite} onValueChange={(value) => setSelectedSite(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {/* Site options would be populated from API */}
          </SelectContent>
        </Select>
      </div>

      {/* Overall Trend Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTrendIcon(data.insights.overallTrend)}
            Overall Trend Analysis
          </CardTitle>
          <CardDescription>
            Accessibility score trends and patterns over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={cn(
              "p-4 rounded-lg border",
              getTrendColor(data.insights.overallTrend)
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Overall Trend</p>
                  <p className="text-lg font-bold capitalize">{data.insights.overallTrend}</p>
                </div>
                {getChangeIndicator(data.insights.trendPercentage)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
              <div>
                <p className="text-sm font-medium">Average Change</p>
                <p className="text-lg font-bold">
                  {data.insights.avgScoreChange > 0 ? '+' : ''}{data.insights.avgScoreChange.toFixed(1)} points
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-purple-50 border-purple-200 text-purple-700">
              <div>
                <p className="text-sm font-medium">Prediction Confidence</p>
                <p className="text-lg font-bold">{data.predictions.confidence}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns & Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Identified Patterns
          </CardTitle>
          <CardDescription>
            Automated analysis of accessibility trends and recurring patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.patterns.map((pattern, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  pattern.impact === 'positive' ? 'bg-green-50 border-green-200' :
                  pattern.impact === 'negative' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                )}
              >
                {getPatternIcon(pattern.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{pattern.type} Pattern</p>
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {pattern.impact}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Predictive Analysis
          </CardTitle>
          <CardDescription>
            AI-powered predictions based on historical patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Next Week Prediction</h4>
                <Badge variant="outline">
                  {data.predictions.confidence}% confidence
                </Badge>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {data.predictions.nextWeekScore.toFixed(1)} average score
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-sm">Key Factors:</h5>
              <ul className="space-y-1">
                {data.predictions.factors.map((factor, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Actionable Recommendations
          </CardTitle>
          <CardDescription>
            Data-driven suggestions to improve accessibility trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-orange-50 border-orange-200"
              >
                <Target className="w-4 h-4 text-orange-600 mt-0.5" />
                <p className="text-sm text-orange-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Trend Visualization
          </CardTitle>
          <CardDescription>
            Score trends over time with key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Chart Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Data Points</p>
                <p className="text-xl font-bold text-blue-700">{data.trends.length}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-green-600 mb-1">Highest Score</p>
                <p className="text-xl font-bold text-green-700">
                  {Math.max(...data.trends.map(t => t.score)).toFixed(0)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-xs text-orange-600 mb-1">Lowest Score</p>
                <p className="text-xl font-bold text-orange-700">
                  {Math.min(...data.trends.map(t => t.score)).toFixed(0)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                <p className="text-xs text-purple-600 mb-1">Avg Score</p>
                <p className="text-xl font-bold text-purple-700">
                  {(data.trends.reduce((sum, t) => sum + t.score, 0) / data.trends.length).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Simple Bar Chart Visualization */}
            <div className="relative h-64 border rounded-lg bg-gradient-to-b from-gray-50 to-white p-4">
              <div className="absolute inset-4 flex items-end justify-between gap-1">
                {data.trends.map((point, index) => {
                  const height = (point.score / 100) * 100;
                  const color = point.score >= 80 ? 'bg-green-500' :
                               point.score >= 60 ? 'bg-yellow-500' :
                               'bg-red-500';

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      <div
                        className={cn(
                          "w-full rounded-t transition-all hover:opacity-80",
                          color
                        )}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg whitespace-nowrap">
                          <p className="font-bold">{point.date}</p>
                          <p>Score: {point.score.toFixed(1)}</p>
                          <p>Issues: {point.issues}</p>
                          {point.wcagAACompliance && (
                            <p>WCAG AA: {point.wcagAACompliance.toFixed(1)}%</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-muted-foreground">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
            </div>

            {/* X-axis Date Labels */}
            <div className="flex justify-between text-xs text-muted-foreground px-4">
              <span>{data.trends[0]?.date}</span>
              <span className="text-center">
                {data.trends[Math.floor(data.trends.length / 2)]?.date}
              </span>
              <span>{data.trends[data.trends.length - 1]?.date}</span>
            </div>

            {/* Detailed Trend Data Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Score</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Issues</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">WCAG AA</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trends.slice().reverse().map((point, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-3">{point.date}</td>
                        <td className="p-3 text-right">
                          <span className={cn(
                            "font-medium",
                            point.score >= 80 ? "text-green-600" :
                            point.score >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          )}>
                            {point.score.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-3 text-right">{point.issues}</td>
                        <td className="p-3 text-right">
                          {point.wcagAACompliance ? `${point.wcagAACompliance.toFixed(1)}%` : '-'}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground truncate max-w-xs">
                          {point.siteUrl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-muted-foreground">Excellent (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span className="text-muted-foreground">Good (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-muted-foreground">Needs Work (&lt;60)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}