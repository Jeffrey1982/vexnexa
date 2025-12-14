"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Shield,
  Award
} from 'lucide-react';

interface ExecutiveSummaryProps {
  data: {
    overallScore: number;
    previousScore?: number;
    issues: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
      total: number;
    };
    wcagCompliance: {
      aa: number;
      aaa: number;
    };
    trends: {
      scoreChange: number;
      issuesChange: number;
      timeframe: string;
    };
    recommendations: {
      priority: 'high' | 'medium' | 'low';
      action: string;
      impact: string;
      effort: string;
    }[];
    businessImpact: {
      potentialUsers: number;
      riskReduction: number;
      estimatedROI: number;
    };
    nextSteps: string[];
  };
  className?: string;
}

export function ExecutiveSummary({ data, className }: ExecutiveSummaryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Executive Summary
        </CardTitle>
        <CardDescription>
          Key insights and strategic recommendations for accessibility improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg border ${getScoreBg(data.overallScore)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Overall Accessibility Score</h3>
              <p className="text-gray-600">Current accessibility rating and performance</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>
                {data.overallScore}
                <span className="text-lg text-gray-700 dark:text-gray-600 dark:text-gray-400">/100</span>
              </div>
              <Badge
                variant={data.overallScore >= 80 ? 'default' : data.overallScore >= 60 ? 'secondary' : 'destructive'}
                className="mt-2"
              >
                {getScoreLabel(data.overallScore)}
              </Badge>
            </div>
          </div>

          {data.previousScore && (
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon(data.trends.scoreChange)}
              <span>
                {data.trends.scoreChange > 0 ? '+' : ''}{data.trends.scoreChange} points
                from previous scan ({data.trends.timeframe})
              </span>
            </div>
          )}
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-red-50 rounded-lg border border-red-200"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{data.issues.critical}</span>
            </div>
            <div className="text-sm font-medium text-red-800">Critical Issues</div>
            <div className="text-xs text-red-600">Require immediate attention</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{data.wcagCompliance.aa}%</span>
            </div>
            <div className="text-sm font-medium text-blue-800">WCAG AA</div>
            <div className="text-xs text-blue-600">Compliance level</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{formatNumber(data.businessImpact.potentialUsers)}</span>
            </div>
            <div className="text-sm font-medium text-green-800">Users Impacted</div>
            <div className="text-xs text-green-600">Potential reach improvement</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-purple-50 rounded-lg border border-purple-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {formatCurrency(data.businessImpact.estimatedROI)}
              </span>
            </div>
            <div className="text-sm font-medium text-purple-800">Est. Annual ROI</div>
            <div className="text-xs text-purple-600">Financial impact</div>
          </motion.div>
        </div>

        {/* WCAG Compliance Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h4 className="font-semibold text-lg">WCAG Compliance Progress</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">WCAG AA Compliance</span>
                <span className="text-sm text-gray-600">{data.wcagCompliance.aa}%</span>
              </div>
              <Progress value={data.wcagCompliance.aa} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">WCAG AAA Compliance</span>
                <span className="text-sm text-gray-600">{data.wcagCompliance.aaa}%</span>
              </div>
              <Progress value={data.wcagCompliance.aaa} className="h-2" />
            </div>
          </div>
        </motion.div>

        {/* Issues Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h4 className="font-semibold text-lg">Issues Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Critical', count: data.issues.critical, color: 'bg-red-500' },
              { label: 'Serious', count: data.issues.serious, color: 'bg-orange-500' },
              { label: 'Moderate', count: data.issues.moderate, color: 'bg-yellow-500' },
              { label: 'Minor', count: data.issues.minor, color: 'bg-gray-500' },
            ].map((issue, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`w-4 h-4 rounded-full ${issue.color} mx-auto mb-2`} />
                <div className="text-lg font-bold">{issue.count}</div>
                <div className="text-sm text-gray-600">{issue.label}</div>
              </div>
            ))}
          </div>
          <div className="text-center pt-2">
            <div className="text-2xl font-bold">{data.issues.total}</div>
            <div className="text-sm text-gray-600">Total Issues Found</div>
          </div>
        </motion.div>

        {/* Priority Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Priority Recommendations
          </h4>
          <div className="space-y-3">
            {data.recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'border-red-500 bg-red-50'
                    : rec.priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-semibold">{rec.action}</h5>
                  <div className="flex gap-2">
                    <Badge
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {rec.priority} priority
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.impact}</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Effort: {rec.effort}</span>
                  <span>Impact: {rec.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Immediate Next Steps
          </h4>
          <div className="space-y-2">
            {data.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Assessment */}
        {data.issues.critical > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Action Required:</strong> {data.issues.critical} critical accessibility
                issues found that may expose your organization to legal risk and prevent users with
                disabilities from accessing your content. Immediate remediation is recommended.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Success Message */}
        {data.overallScore >= 90 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Excellent Accessibility:</strong> Your website demonstrates strong
                accessibility practices. Continue monitoring and maintaining these high standards
                to ensure ongoing compliance and inclusive user experience.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}