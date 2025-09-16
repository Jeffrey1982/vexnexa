"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Award, Target, Users, Globe, Crown, Medal } from 'lucide-react';
import { getBenchmarkData, getCompetitorsByCategory, getIndustryCategory, calculatePerformanceRank } from '@/lib/competitor-data';

interface CompetitorData {
  name: string;
  domain: string;
  industry: string;
  score: number;
  issues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  metrics: {
    wcagAA: number;
    wcagAAA: number;
    mobileScore: number;
    performanceScore: number;
    userExperience: number;
  };
  rank: number;
  userBase: string;
}

interface BenchmarkData {
  yourSite: CompetitorData;
  competitors: CompetitorData[];
  industryAverage: {
    score: number;
    criticalIssues: number;
    wcagAA: number;
    wcagAAA: number;
  };
}

interface CompetitorBenchmarkProps {
  currentScore: number;
  websiteUrl?: string;
  className?: string;
}

export function CompetitorBenchmark({ currentScore, websiteUrl = '', className }: CompetitorBenchmarkProps) {
  const [selectedMetric, setSelectedMetric] = useState<'score' | 'issues' | 'wcag' | 'mobile'>('score');

  const category = getIndustryCategory(websiteUrl);
  const benchmarkData = getBenchmarkData(websiteUrl);
  const competitors = getCompetitorsByCategory(category, 5);
  const performance = calculatePerformanceRank(currentScore, category);

  // Create mock data structure for existing component logic
  const data = useMemo(() => ({
    yourSite: {
      name: 'Your Website',
      domain: websiteUrl.replace(/^https?:\/\//, ''),
      industry: benchmarkData.category,
      score: currentScore,
      issues: {
        critical: Math.max(0, Math.floor((100 - currentScore) / 10)),
        serious: Math.max(0, Math.floor((100 - currentScore) / 8)),
        moderate: Math.max(0, Math.floor((100 - currentScore) / 6)),
        minor: Math.max(0, Math.floor((100 - currentScore) / 4))
      },
      metrics: {
        wcagAA: Math.min(100, currentScore + 5),
        wcagAAA: Math.max(0, currentScore - 15),
        mobileScore: Math.min(100, currentScore + Math.random() * 10 - 5),
        performanceScore: Math.min(100, currentScore + Math.random() * 20 - 10),
        userExperience: Math.min(100, currentScore + Math.random() * 15 - 7)
      },
      rank: Math.max(1, competitors.filter(c => c.score > currentScore).length + 1),
      userBase: 'Unknown'
    },
    competitors: competitors.map(comp => ({
      name: comp.name,
      domain: comp.domain,
      industry: comp.category,
      score: comp.score,
      issues: {
        critical: comp.critical,
        serious: comp.serious,
        moderate: comp.moderate,
        minor: comp.minor
      },
      metrics: {
        wcagAA: comp.wcagAA,
        wcagAAA: comp.wcagAAA,
        mobileScore: Math.min(100, comp.score + Math.random() * 10 - 5),
        performanceScore: Math.min(100, comp.score + Math.random() * 20 - 10),
        userExperience: Math.min(100, comp.score + Math.random() * 15 - 7)
      },
      rank: 0,
      userBase: 'Unknown'
    })),
    industryAverage: {
      score: benchmarkData.averageScore,
      criticalIssues: benchmarkData.averageCritical,
      wcagAA: benchmarkData.averageWcagAA,
      wcagAAA: benchmarkData.averageWcagAA - 20
    }
  }), [websiteUrl, currentScore, competitors, benchmarkData]);

  const [industryFilter, setIndustryFilter] = useState<string>(category);

  const industries = useMemo(() => {
    const unique = Array.from(new Set(data.competitors.map(c => c.industry)));
    return ['all', ...unique];
  }, [data.competitors]);

  const filteredCompetitors = useMemo(() => {
    if (industryFilter === 'all') return data.competitors;
    return data.competitors.filter(c => c.industry === industryFilter);
  }, [data.competitors, industryFilter]);

  const radarData = useMemo(() => {
    return [
      {
        metric: 'Accessibility',
        yourSite: data.yourSite.score,
        average: data.industryAverage.score,
        topCompetitor: Math.max(...filteredCompetitors.map(c => c.score))
      },
      {
        metric: 'WCAG AA',
        yourSite: data.yourSite.metrics.wcagAA,
        average: data.industryAverage.wcagAA,
        topCompetitor: Math.max(...filteredCompetitors.map(c => c.metrics.wcagAA))
      },
      {
        metric: 'WCAG AAA',
        yourSite: data.yourSite.metrics.wcagAAA,
        average: data.industryAverage.wcagAAA,
        topCompetitor: Math.max(...filteredCompetitors.map(c => c.metrics.wcagAAA))
      },
      {
        metric: 'Mobile',
        yourSite: data.yourSite.metrics.mobileScore,
        average: filteredCompetitors.reduce((sum, c) => sum + c.metrics.mobileScore, 0) / filteredCompetitors.length,
        topCompetitor: Math.max(...filteredCompetitors.map(c => c.metrics.mobileScore))
      },
      {
        metric: 'Performance',
        yourSite: data.yourSite.metrics.performanceScore,
        average: filteredCompetitors.reduce((sum, c) => sum + c.metrics.performanceScore, 0) / filteredCompetitors.length,
        topCompetitor: Math.max(...filteredCompetitors.map(c => c.metrics.performanceScore))
      },
      {
        metric: 'UX',
        yourSite: data.yourSite.metrics.userExperience,
        average: filteredCompetitors.reduce((sum, c) => sum + c.metrics.userExperience, 0) / filteredCompetitors.length,
        topCompetitor: Math.max(...filteredCompetitors.map(c => c.metrics.userExperience))
      }
    ];
  }, [data, filteredCompetitors]);

  const rankings = useMemo(() => {
    const allSites = [data.yourSite, ...filteredCompetitors].sort((a, b) => b.score - a.score);
    return allSites.map((site, index) => ({
      ...site,
      position: index + 1,
      isYourSite: site.name === data.yourSite.name
    }));
  }, [data, filteredCompetitors]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const percentile = useMemo(() => {
    const allScores = [data.yourSite.score, ...filteredCompetitors.map(c => c.score)];
    const betterThanCount = allScores.filter(score => score < data.yourSite.score).length;
    return Math.round((betterThanCount / allScores.length) * 100);
  }, [data.yourSite.score, filteredCompetitors]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Competitor Benchmark Analysis
        </CardTitle>
        <CardDescription>
          Compare your accessibility performance against industry standards and competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              {percentile}th percentile
            </Badge>
            <Badge variant={data.yourSite.score >= data.industryAverage.score ? 'default' : 'secondary'}>
              {data.yourSite.score >= data.industryAverage.score ? 'Above Average' : 'Below Average'}
            </Badge>
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>
                  {industry === 'all' ? 'All Industries' : industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-lg ${getScoreBg(data.yourSite.score)}`}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.yourSite.score)}`}>
                {data.yourSite.score}
              </div>
              <div className="text-sm text-gray-600">Your Score</div>
              <div className="mt-1">
                <Crown className="h-4 w-4 mx-auto text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <div className="p-4 rounded-lg bg-blue-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.industryAverage.score.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Industry Avg</div>
              <div className="mt-1 text-xs text-blue-600">
                {data.yourSite.score > data.industryAverage.score ? '+' : ''}
                {(data.yourSite.score - data.industryAverage.score).toFixed(1)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                #{data.yourSite.rank}
              </div>
              <div className="text-sm text-gray-600">Your Rank</div>
              <div className="mt-1">
                <Medal className="h-4 w-4 mx-auto text-purple-600" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...filteredCompetitors.map(c => c.score))}
              </div>
              <div className="text-sm text-gray-600">Top Score</div>
              <div className="mt-1 text-xs text-green-600">
                Gap: {Math.max(...filteredCompetitors.map(c => c.score)) - data.yourSite.score}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickCount={5}
                  />
                  <Radar
                    name="Your Site"
                    dataKey="yourSite"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Industry Average"
                    dataKey="average"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Radar
                    name="Top Competitor"
                    dataKey="topCompetitor"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="rankings" className="space-y-4">
            <div className="space-y-2">
              {rankings.slice(0, 10).map((site, index) => (
                <motion.div
                  key={site.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    site.isYourSite ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-600 w-6">
                      #{site.position}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {site.name}
                        {site.isYourSite && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{site.domain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(site.score)}`}>
                      {site.score}
                    </div>
                    <div className="text-xs text-gray-600">{site.industry}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gaps" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Performance Gaps</h4>
                <div className="space-y-3">
                  {[
                    {
                      metric: 'Overall Score',
                      your: data.yourSite.score,
                      leader: Math.max(...filteredCompetitors.map(c => c.score)),
                      gap: Math.max(...filteredCompetitors.map(c => c.score)) - data.yourSite.score
                    },
                    {
                      metric: 'WCAG AA Compliance',
                      your: data.yourSite.metrics.wcagAA,
                      leader: Math.max(...filteredCompetitors.map(c => c.metrics.wcagAA)),
                      gap: Math.max(...filteredCompetitors.map(c => c.metrics.wcagAA)) - data.yourSite.metrics.wcagAA
                    },
                    {
                      metric: 'Mobile Accessibility',
                      your: data.yourSite.metrics.mobileScore,
                      leader: Math.max(...filteredCompetitors.map(c => c.metrics.mobileScore)),
                      gap: Math.max(...filteredCompetitors.map(c => c.metrics.mobileScore)) - data.yourSite.metrics.mobileScore
                    }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.metric}</span>
                        <span className={item.gap <= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.gap <= 0 ? 'Leading' : `${item.gap.toFixed(1)} behind`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="relative h-full">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(item.your / item.leader) * 100}%` }}
                          />
                          <div className="absolute right-0 top-0 w-1 h-2 bg-green-500 rounded-full" />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>You: {item.your}</span>
                        <span>Leader: {item.leader}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Competitive Advantages</h4>
                <div className="space-y-3">
                  {radarData
                    .filter(item => item.yourSite > item.average)
                    .sort((a, b) => (b.yourSite - b.average) - (a.yourSite - a.average))
                    .slice(0, 3)
                    .map((advantage, index) => (
                      <motion.div
                        key={advantage.metric}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-green-800">{advantage.metric}</div>
                          <div className="text-sm text-green-600">
                            +{(advantage.yourSite - advantage.average).toFixed(1)} above average
                          </div>
                        </div>
                        <Award className="h-5 w-5 text-green-600" />
                      </motion.div>
                    ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-600" />
                  Quick Wins
                </h4>
                <div className="space-y-3">
                  {[
                    { action: 'Fix color contrast issues', impact: 'High', effort: 'Low' },
                    { action: 'Add missing alt text', impact: 'High', effort: 'Medium' },
                    { action: 'Improve heading structure', impact: 'Medium', effort: 'Low' },
                  ].map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{item.action}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={item.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                          {item.impact} Impact
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.effort} Effort
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Strategic Improvements
                </h4>
                <div className="space-y-3">
                  {[
                    { goal: 'Reach top 3 in industry', timeline: '6 months', score: '+15 points' },
                    { goal: 'Achieve WCAG AAA compliance', timeline: '12 months', score: '+25 points' },
                    { goal: 'Best-in-class mobile accessibility', timeline: '9 months', score: '+18 points' },
                  ].map((item, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">{item.goal}</div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-blue-600">{item.timeline}</span>
                        <span className="text-blue-800 font-medium">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}