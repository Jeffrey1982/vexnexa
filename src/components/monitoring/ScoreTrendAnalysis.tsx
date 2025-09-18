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
        <div className="flex items-center gap-1 text-gray-600">
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

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Trend Visualization
          </CardTitle>
          <CardDescription>
            Interactive chart showing score trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Interactive trend chart will be implemented with charting library</p>
              <p className="text-xs mt-2">Shows: Score trends, WCAG compliance, performance correlation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}