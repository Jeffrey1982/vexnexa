"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  TrendingDown,
  Shield,
  Zap,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Eye,
  PlayCircle,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegressionEvent {
  id: string;
  siteId: string;
  siteUrl: string;
  type: 'score_drop' | 'new_violations' | 'compliance_breach' | 'performance_impact';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  detectedAt: Date;
  confirmedAt?: Date;
  resolvedAt?: Date;
  status: 'detected' | 'confirmed' | 'investigating' | 'resolved' | 'false_positive';

  // Regression details
  scoreChange?: number;
  previousScore?: number;
  currentScore?: number;
  newViolations?: number;
  affectedElements?: number;

  // Context
  scanId: string;
  previousScanId?: string;
  possibleCauses?: string[];
  automatedAnalysis?: string;

  // Actions
  investigationNotes?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface RegressionDetectorProps {
  className?: string;
}

export function RegressionDetector({ className }: RegressionDetectorProps) {
  const [regressions, setRegressions] = useState<RegressionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegression, setSelectedRegression] = useState<RegressionEvent | null>(null);
  const [detectionSettings, setDetectionSettings] = useState({
    scoreThreshold: 10,
    violationThreshold: 5,
    autoConfirm: false,
    realTimeMonitoring: true
  });

  useEffect(() => {
    fetchRegressions();
    // Set up real-time polling for new regressions
    const interval = setInterval(fetchRegressions, 2 * 60 * 1000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchRegressions = async () => {
    try {
      const response = await fetch('/api/monitoring/regressions');
      if (response.ok) {
        const data = await response.json();
        setRegressions(data.regressions);
      }
    } catch (error) {
      console.error('Failed to fetch regressions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegressionStatus = async (id: string, status: string, notes?: string) => {
    try {
      await fetch(`/api/monitoring/regressions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      await fetchRegressions(); // Refresh data
    } catch (error) {
      console.error('Failed to update regression status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'major': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'moderate': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'minor': return 'text-blue-700 bg-blue-100 border-blue-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'score_drop': return <TrendingDown className="w-4 h-4" />;
      case 'new_violations': return <AlertTriangle className="w-4 h-4" />;
      case 'compliance_breach': return <Shield className="w-4 h-4" />;
      case 'performance_impact': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'false_positive': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'investigating': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'confirmed': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Group regressions by status
  const groupedRegressions = regressions.reduce((groups, regression) => {
    const status = regression.status;
    if (!groups[status]) groups[status] = [];
    groups[status].push(regression);
    return groups;
  }, {} as Record<string, RegressionEvent[]>);

  const unresolved = regressions.filter(r =>
    ['detected', 'confirmed', 'investigating'].includes(r.status)
  );

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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Detection Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Regressions</p>
                <p className="text-2xl font-bold text-red-600">{unresolved.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {regressions.filter(r =>
                    r.status === 'resolved' &&
                    r.resolvedAt &&
                    new Date(r.resolvedAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-purple-600">
                  {regressions.filter(r => r.severity === 'critical' && r.status !== 'resolved').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Detection Status</p>
                <p className="text-sm font-bold text-green-600">
                  {detectionSettings.realTimeMonitoring ? 'Active' : 'Paused'}
                </p>
              </div>
              <PlayCircle className={cn(
                "w-8 h-8",
                detectionSettings.realTimeMonitoring ? "text-green-600" : "text-gray-400"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Alerts */}
      {unresolved.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{unresolved.length} active regression{unresolved.length > 1 ? 's' : ''}</strong> detected requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Regressions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Detected Regressions
          </CardTitle>
          <CardDescription>
            Automated detection of accessibility regressions and quality drops
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regressions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-green-700">No Regressions Detected</h3>
              <p className="text-muted-foreground">
                All monitored sites are maintaining their accessibility scores.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {regressions.slice(0, 10).map((regression) => (
                <div
                  key={regression.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                    getSeverityColor(regression.severity)
                  )}
                  onClick={() => setSelectedRegression(regression)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {getTypeIcon(regression.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{regression.siteUrl}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {regression.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {regression.severity}
                          </Badge>
                        </div>

                        <div className="text-xs mb-2">
                          {regression.scoreChange && (
                            <span className="text-red-700">
                              Score dropped by {Math.abs(regression.scoreChange)} points
                              ({regression.previousScore} → {regression.currentScore})
                            </span>
                          )}
                          {regression.newViolations && (
                            <span className="text-orange-700">
                              {regression.newViolations} new violations detected
                            </span>
                          )}
                        </div>

                        <div className="text-xs opacity-75">
                          Detected: {formatTimestamp(regression.detectedAt)}
                          {regression.automatedAnalysis && (
                            <span className="ml-2">• {regression.automatedAnalysis}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(regression.status)}
                      <div className="flex gap-1">
                        {regression.status === 'detected' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRegressionStatus(regression.id, 'confirmed');
                              }}
                              className="text-xs h-7"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRegressionStatus(regression.id, 'false_positive');
                              }}
                              className="text-xs h-7"
                            >
                              False Positive
                            </Button>
                          </>
                        )}
                        {regression.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRegressionStatus(regression.id, 'investigating');
                            }}
                            className="text-xs h-7"
                          >
                            Investigate
                          </Button>
                        )}
                        {regression.status === 'investigating' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRegressionStatus(regression.id, 'resolved');
                            }}
                            className="text-xs h-7"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Detection Settings
          </CardTitle>
          <CardDescription>
            Configure automated regression detection thresholds and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Score Drop Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={detectionSettings.scoreThreshold}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    scoreThreshold: parseInt(e.target.value)
                  }))}
                  className="w-20 px-2 py-1 text-sm border rounded"
                  min="1"
                  max="50"
                />
                <span className="text-sm text-muted-foreground">points</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Violations Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={detectionSettings.violationThreshold}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    violationThreshold: parseInt(e.target.value)
                  }))}
                  className="w-20 px-2 py-1 text-sm border rounded"
                  min="1"
                  max="20"
                />
                <span className="text-sm text-muted-foreground">violations</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={detectionSettings.realTimeMonitoring}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    realTimeMonitoring: e.target.checked
                  }))}
                />
                Real-time Monitoring
              </label>
              <p className="text-xs text-muted-foreground">
                Continuously monitor for regressions as new scans complete
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={detectionSettings.autoConfirm}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    autoConfirm: e.target.checked
                  }))}
                />
                Auto-confirm Obvious Regressions
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically confirm regressions above certain thresholds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}