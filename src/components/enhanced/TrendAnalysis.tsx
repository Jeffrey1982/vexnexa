"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  score: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  totalIssues: number;
  pagesScanned: number;
}

interface TrendAnalysisProps {
  data: TrendDataPoint[];
  className?: string;
}

export function TrendAnalysis({ data, className }: TrendAnalysisProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [metric, setMetric] = useState<'score' | 'issues' | 'coverage'>('score');

  const filteredData = useMemo(() => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.filter(point => new Date(point.date) >= cutoff);
  }, [data, timeRange]);

  const statistics = useMemo(() => {
    if (filteredData.length === 0) return null;

    const latest = filteredData[filteredData.length - 1];
    const earliest = filteredData[0];

    const scoreChange = latest.score - earliest.score;
    const issuesChange = latest.totalIssues - earliest.totalIssues;
    const criticalChange = latest.critical - earliest.critical;

    const avgScore = filteredData.reduce((sum, point) => sum + point.score, 0) / filteredData.length;
    const avgIssues = filteredData.reduce((sum, point) => sum + point.totalIssues, 0) / filteredData.length;

    const bestScore = Math.max(...filteredData.map(p => p.score));
    const worstScore = Math.min(...filteredData.map(p => p.score));

    return {
      scoreChange,
      issuesChange,
      criticalChange,
      avgScore,
      avgIssues,
      bestScore,
      worstScore,
      improvement: scoreChange > 0,
      trend: scoreChange === 0 ? 'stable' : scoreChange > 0 ? 'improving' : 'declining'
    };
  }, [filteredData]);

  const getChangeIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span>+{value.toFixed(1)}</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span>{value.toFixed(1)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <span>0</span>
        </div>
      );
    }
  };

  const getPrediction = () => {
    if (filteredData.length < 3) return null;

    // Simple linear regression for prediction
    const recent = filteredData.slice(-5);
    const x = recent.map((_, i) => i);
    const y = recent.map(p => p.score);

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextScore = slope * n + intercept;
    const trend = slope > 1 ? 'strong-improvement' : slope > 0 ? 'improvement' : slope > -1 ? 'decline' : 'strong-decline';

    return { nextScore, slope, trend };
  };

  const prediction = getPrediction();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Accessibility Trends
            </CardTitle>
            <CardDescription>
              Track your accessibility improvements over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{statistics.avgScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600 mb-1">Avg Score</div>
              {getChangeIndicator(statistics.scoreChange)}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(statistics.avgIssues)}</div>
              <div className="text-sm text-gray-600 mb-1">Avg Issues</div>
              {getChangeIndicator(statistics.issuesChange)}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{statistics.bestScore}</div>
              <div className="text-sm text-gray-600 mb-1">Best Score</div>
              <Badge variant="default" className="text-xs">Peak</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{statistics.criticalChange >= 0 ? '+' : ''}{statistics.criticalChange}</div>
              <div className="text-sm text-gray-600 mb-1">Critical Δ</div>
              <Badge variant={statistics.criticalChange <= 0 ? 'default' : 'destructive'} className="text-xs">
                {statistics.criticalChange <= 0 ? 'Better' : 'Worse'}
              </Badge>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border">
                            <p className="font-semibold">{label}</p>
                            <p className="text-blue-600">
                              Score: {payload[0].value}
                            </p>
                            <p className="text-orange-600">
                              Issues: {payload[1]?.value || 0}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalIssues"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="critical" stackId="issues" fill="#ef4444" name="Critical" />
                  <Bar dataKey="serious" stackId="issues" fill="#f97316" name="Serious" />
                  <Bar dataKey="moderate" stackId="issues" fill="#eab308" name="Moderate" />
                  <Bar dataKey="minor" stackId="issues" fill="#6b7280" name="Minor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Progress Milestones
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Fix Critical Issues', current: 8, target: 0, progress: 73 },
                    { label: 'Improve Score to 80+', current: 75, target: 80, progress: 94 },
                    { label: 'WCAG AA Compliance', current: 78, target: 95, progress: 82 },
                  ].map((milestone, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{milestone.label}</span>
                        <span>{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Achievements
                </h4>
                <div className="space-y-3">
                  {[
                    { date: '3 days ago', achievement: 'Fixed 5 critical issues', icon: <AlertTriangle className="h-4 w-4 text-green-600" /> },
                    { date: '1 week ago', achievement: 'Score improved by 12 points', icon: <TrendingUp className="h-4 w-4 text-blue-600" /> },
                    { date: '2 weeks ago', achievement: 'Added alt text to 25 images', icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      {item.icon}
                      <div>
                        <div className="font-medium text-sm">{item.achievement}</div>
                        <div className="text-xs text-gray-600">{item.date}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            {prediction ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">AI-Powered Forecast</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {prediction.nextScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Predicted Next Score</div>
                      <Badge
                        variant={prediction.trend.includes('improvement') ? 'default' : 'destructive'}
                        className="mt-1"
                      >
                        {prediction.trend.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(prediction.slope * 30)}
                      </div>
                      <div className="text-sm text-gray-600">Points/Month Trend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.max(1, Math.round((85 - (statistics?.avgScore || 0)) / Math.abs(prediction.slope) / 7))}
                      </div>
                      <div className="text-sm text-gray-600">Weeks to 85+ Score</div>
                    </div>
                  </div>
                </Card>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-2">Recommendations</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {prediction.trend.includes('decline') && (
                      <>
                        <li>• Prioritize fixing critical accessibility issues</li>
                        <li>• Review recent changes that may have introduced problems</li>
                        <li>• Consider implementing automated accessibility testing</li>
                      </>
                    )}
                    {prediction.trend.includes('improvement') && (
                      <>
                        <li>• Continue current accessibility practices</li>
                        <li>• Focus on remaining moderate and minor issues</li>
                        <li>• Set up regular monitoring to maintain progress</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-700 dark:text-gray-600 dark:text-gray-400">
                Need more data points for accurate forecasting
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}