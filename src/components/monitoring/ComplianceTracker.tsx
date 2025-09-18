"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Scale,
  Target,
  Eye,
  Calendar,
  BarChart3,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceData {
  siteId: string;
  siteUrl: string;
  wcagAA: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
    criticalIssues: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  wcagAAA: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
  };
  legalRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
    recommendation: string;
  };
  timeline: Array<{
    date: Date;
    wcagAA: number;
    wcagAAA: number;
    event?: string;
  }>;
}

interface ComplianceOverview {
  totalSites: number;
  compliantSites: number;
  atRiskSites: number;
  avgWcagAA: number;
  avgWcagAAA: number;
  legalRiskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  upcomingDeadlines: Array<{
    site: string;
    deadline: Date;
    requirement: string;
  }>;
}

interface ComplianceTrackerProps {
  className?: string;
}

export function ComplianceTracker({ className }: ComplianceTrackerProps) {
  const [overview, setOverview] = useState<ComplianceOverview | null>(null);
  const [siteCompliance, setSiteCompliance] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<ComplianceData | null>(null);

  useEffect(() => {
    fetchComplianceData();
    // Set up real-time polling every 10 minutes
    const interval = setInterval(fetchComplianceData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplianceData = async () => {
    try {
      const response = await fetch('/api/monitoring/compliance');
      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setSiteCompliance(data.sites);
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100 border-green-300';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    if (score >= 50) return 'text-orange-700 bg-orange-100 border-orange-300';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getComplianceStatus = (score: number) => {
    if (score >= 90) return { status: 'Excellent', icon: CheckCircle, color: 'text-green-600' };
    if (score >= 70) return { status: 'Compliant', icon: Shield, color: 'text-blue-600' };
    if (score >= 50) return { status: 'At Risk', icon: AlertTriangle, color: 'text-orange-600' };
    return { status: 'Non-Compliant', icon: AlertTriangle, color: 'text-red-600' };
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

  if (!overview) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Compliance Data Unavailable</h3>
        <p className="text-muted-foreground">
          Unable to load compliance tracking data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant Sites</p>
                <p className="text-2xl font-bold text-green-600">
                  {overview.compliantSites}/{overview.totalSites}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">At Risk Sites</p>
                <p className="text-2xl font-bold text-red-600">{overview.atRiskSites}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg WCAG AA</p>
                <p className="text-2xl font-bold text-blue-600">{overview.avgWcagAA.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Risk</p>
                <p className="text-2xl font-bold text-purple-600">
                  {overview.legalRiskDistribution.critical}
                </p>
              </div>
              <Scale className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {overview.legalRiskDistribution.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{overview.legalRiskDistribution.critical} site{overview.legalRiskDistribution.critical > 1 ? 's' : ''}</strong> at critical legal risk requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Upcoming Deadlines */}
      {overview.upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Upcoming Compliance Deadlines
            </CardTitle>
            <CardDescription>
              Important compliance milestones and regulatory deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.upcomingDeadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-orange-50 border-orange-200"
                >
                  <div>
                    <p className="font-medium text-sm">{deadline.site}</p>
                    <p className="text-sm text-muted-foreground">{deadline.requirement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-700">
                      {formatDate(deadline.deadline)}
                    </p>
                    <p className="text-xs text-orange-600">
                      {Math.ceil((new Date(deadline.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Site Compliance Status
          </CardTitle>
          <CardDescription>
            Detailed WCAG compliance tracking for all monitored sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {siteCompliance.map((site) => {
              const aaStatus = getComplianceStatus(site.wcagAA.score);
              const aaaStatus = getComplianceStatus(site.wcagAAA.score);

              return (
                <div
                  key={site.siteId}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSite(site)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{site.siteUrl}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Last updated: {formatDate(site.wcagAA.lastUpdated)}</span>
                        <span>•</span>
                        <span>{site.wcagAA.criticalIssues} critical issues</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", getRiskColor(site.legalRisk.level))}>
                        {site.legalRisk.level.toUpperCase()} RISK
                      </Badge>
                      {getTrendIcon(site.wcagAA.trend)}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {/* WCAG AA Compliance */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <aaStatus.icon className={cn("w-4 h-4", aaStatus.color)} />
                          <span className="text-sm font-medium">WCAG AA</span>
                        </div>
                        <span className="text-sm font-bold">{site.wcagAA.score.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={site.wcagAA.score}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">{aaStatus.status}</p>
                    </div>

                    {/* WCAG AAA Compliance */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <aaaStatus.icon className={cn("w-4 h-4", aaaStatus.color)} />
                          <span className="text-sm font-medium">WCAG AAA</span>
                        </div>
                        <span className="text-sm font-bold">{site.wcagAAA.score.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={site.wcagAAA.score}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">{aaaStatus.status}</p>
                    </div>
                  </div>

                  {/* Legal Risk Assessment */}
                  <div className="mt-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Legal Risk Assessment</span>
                      <Badge variant="outline" className="text-xs">
                        Score: {site.legalRisk.score}/100
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {site.legalRisk.recommendation}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {site.legalRisk.factors.slice(0, 3).map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                      {site.legalRisk.factors.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{site.legalRisk.factors.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legal Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600" />
            Legal Risk Distribution
          </CardTitle>
          <CardDescription>
            Overview of legal compliance risk across all monitored sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-green-50 border-green-200">
              <div className="text-2xl font-bold text-green-700 mb-1">
                {overview.legalRiskDistribution.low}
              </div>
              <div className="text-sm text-green-600">Low Risk</div>
              <div className="text-xs text-green-500 mt-1">Minimal legal exposure</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-yellow-50 border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700 mb-1">
                {overview.legalRiskDistribution.medium}
              </div>
              <div className="text-sm text-yellow-600">Medium Risk</div>
              <div className="text-xs text-yellow-500 mt-1">Monitor closely</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-orange-50 border-orange-200">
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {overview.legalRiskDistribution.high}
              </div>
              <div className="text-sm text-orange-600">High Risk</div>
              <div className="text-xs text-orange-500 mt-1">Action required</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-red-50 border-red-200">
              <div className="text-2xl font-bold text-red-700 mb-1">
                {overview.legalRiskDistribution.critical}
              </div>
              <div className="text-sm text-red-600">Critical Risk</div>
              <div className="text-xs text-red-500 mt-1">Immediate attention</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Timeline Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Compliance Timeline
          </CardTitle>
          <CardDescription>
            Historical compliance trends and milestone tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Interactive compliance timeline will be implemented with charting library</p>
              <p className="text-xs mt-2">Shows: WCAG AA/AAA trends, compliance milestones, legal events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}