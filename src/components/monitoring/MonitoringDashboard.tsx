"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreTrendAnalysis } from './ScoreTrendAnalysis';
import { RegressionDetector } from './RegressionDetector';
import { AlertsSystem } from './AlertsSystem';
import { ComplianceTracker } from './ComplianceTracker';

interface RegressionAlert {
  id: string;
  type: 'score_drop' | 'new_issues' | 'compliance_risk' | 'performance_impact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  scanId: string;
  siteUrl: string;
  timestamp: Date;
  scoreChange?: number;
  issueCount?: number;
  resolved: boolean;
}

interface MonitoringStats {
  totalSites: number;
  sitesAtRisk: number;
  avgScoreChange: number;
  alertsToday: number;
  regressionsTrend: Array<{
    date: string;
    regressions: number;
    improvements: number;
  }>;
  recentAlerts: RegressionAlert[];
}

interface MonitoringDashboardProps {
  className?: string;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<RegressionAlert | null>(null);

  useEffect(() => {
    fetchMonitoringData();
    // Set up real-time polling every 5 minutes
    const interval = setInterval(fetchMonitoringData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    const iconClass = cn(
      "w-4 h-4",
      severity === 'critical' ? 'text-red-600' :
      severity === 'high' ? 'text-orange-600' :
      severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
    );

    switch (type) {
      case 'score_drop': return <TrendingDown className={iconClass} />;
      case 'new_issues': return <AlertTriangle className={iconClass} />;
      case 'compliance_risk': return <Shield className={iconClass} />;
      case 'performance_impact': return <Zap className={iconClass} />;
      default: return <Activity className={iconClass} />;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      await fetchMonitoringData(); // Refresh data
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Monitoring Unavailable</h3>
        <p className="text-muted-foreground">
          Unable to load monitoring data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sites Monitored</p>
                <p className="text-2xl font-bold">{stats.totalSites}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sites at Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.sitesAtRisk}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score Change</p>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.avgScoreChange >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {stats.avgScoreChange > 0 ? '+' : ''}{stats.avgScoreChange}
                </p>
              </div>
              {stats.avgScoreChange >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerts Today</p>
                <p className="text-2xl font-bold">{stats.alertsToday}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Recent Alerts
          </CardTitle>
          <CardDescription>
            Real-time accessibility regression alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-green-700">All Clear!</h3>
              <p className="text-muted-foreground">
                No accessibility regressions detected in the last 24 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    getSeverityColor(alert.severity),
                    alert.resolved && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-xs">Resolved</Badge>
                        )}
                      </div>
                      <div className="text-xs opacity-75">
                        {alert.siteUrl} • {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {alert.severity}
                    </Badge>
                    {!alert.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                        className="text-xs"
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regression Detection System */}
      <RegressionDetector />

      {/* Automated Alerts System */}
      <AlertsSystem />

      {/* Continuous Compliance Tracking */}
      <ComplianceTracker />

      {/* Advanced Trend Analysis */}
      <ScoreTrendAnalysis />
    </div>
  );
}