"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import {
  Shield,
  AlertTriangle,
  Scale,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  ExternalLink
} from "lucide-react";

interface ComplianceData {
  accessibilityScore: number;
  wcag21Compliance: number;
  wcag22Compliance: number;
  adaRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  legalRiskScore: number;
  complianceGaps: {
    category: string;
    issues: string[];
    severity: string;
  }[];
  date: string;
  url?: string;
}

interface ComplianceLegalAssessmentProps {
  data: ComplianceData[];
  className?: string;
}

export function ComplianceLegalAssessment({ data, className = "" }: ComplianceLegalAssessmentProps) {
  // Calculate compliance analytics
  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    const latest = data[data.length - 1];

    // Calculate trends
    const oldestData = data[0];
    const wcag21Trend = latest.wcag21Compliance - oldestData.wcag21Compliance;
    const wcag22Trend = latest.wcag22Compliance - oldestData.wcag22Compliance;
    const riskTrend = latest.legalRiskScore - oldestData.legalRiskScore;

    // Risk level distribution
    const riskDistribution = {
      LOW: data.filter(d => d.adaRiskLevel === 'LOW').length,
      MEDIUM: data.filter(d => d.adaRiskLevel === 'MEDIUM').length,
      HIGH: data.filter(d => d.adaRiskLevel === 'HIGH').length,
      CRITICAL: data.filter(d => d.adaRiskLevel === 'CRITICAL').length
    };

    // Calculate compliance gaps summary
    const allGaps = latest.complianceGaps.flatMap(gap => gap.issues);
    const gapsByCategory = latest.complianceGaps.reduce((acc, gap) => {
      acc[gap.category] = gap.issues.length;
      return acc;
    }, {} as Record<string, number>);

    // ADA compliance estimate
    const adaComplianceEstimate = Math.max(0, 100 - latest.legalRiskScore);

    // Time to compliance estimate (in weeks)
    const timeToCompliance = calculateTimeToCompliance(latest);

    return {
      current: {
        wcag21: latest.wcag21Compliance,
        wcag22: latest.wcag22Compliance,
        adaRisk: latest.adaRiskLevel,
        legalRisk: latest.legalRiskScore,
        adaCompliance: adaComplianceEstimate
      },
      trends: {
        wcag21: wcag21Trend,
        wcag22: wcag22Trend,
        risk: riskTrend
      },
      riskDistribution,
      gapsByCategory,
      totalGaps: allGaps.length,
      timeToCompliance
    };
  }, [data]);

  function calculateTimeToCompliance(complianceData: ComplianceData): number {
    // Estimate time based on current compliance level and risk
    const complianceGap = 100 - complianceData.wcag21Compliance;
    const riskMultiplier = {
      'LOW': 0.5,
      'MEDIUM': 1,
      'HIGH': 1.5,
      'CRITICAL': 2
    };

    // Base: 1 week per 10 points of compliance gap
    return Math.ceil((complianceGap / 10) * riskMultiplier[complianceData.adaRiskLevel]);
  }

  // Prepare radar chart data for WCAG compliance
  const wcagRadarData = useMemo(() => {
    if (!analytics) return [];

    const latest = data[data.length - 1];
    return [
      {
        category: 'Perceivable',
        score: Math.max(0, 100 - (latest.complianceGaps.find(g => g.category === 'Perceivable')?.issues.length || 0) * 10),
        fullMark: 100
      },
      {
        category: 'Operable',
        score: Math.max(0, 100 - (latest.complianceGaps.find(g => g.category === 'Operable')?.issues.length || 0) * 10),
        fullMark: 100
      },
      {
        category: 'Understandable',
        score: Math.max(0, 100 - (latest.complianceGaps.find(g => g.category === 'Understandable')?.issues.length || 0) * 10),
        fullMark: 100
      },
      {
        category: 'Robust',
        score: Math.max(0, 100 - (latest.complianceGaps.find(g => g.category === 'Robust')?.issues.length || 0) * 10),
        fullMark: 100
      }
    ];
  }, [data, analytics]);

  // Prepare compliance trend data
  const trendData = useMemo(() => {
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'WCAG 2.1': item.wcag21Compliance,
      'WCAG 2.2': item.wcag22Compliance,
      'Legal Risk': 100 - item.legalRiskScore, // Invert for better visualization
      fullDate: item.date
    }));
  }, [data]);

  function getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  function getComplianceLevel(score: number): { level: string; color: string } {
    if (score >= 95) return { level: 'Full Compliance', color: 'text-green-600' };
    if (score >= 80) return { level: 'High Compliance', color: 'text-blue-600' };
    if (score >= 60) return { level: 'Moderate Compliance', color: 'text-yellow-600' };
    if (score >= 40) return { level: 'Low Compliance', color: 'text-orange-600' };
    return { level: 'Non-Compliant', color: 'text-red-600' };
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <Scale className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="text-lg font-semibold">No compliance data available</div>
          <div className="text-sm">Run scans to see legal compliance assessment</div>
        </div>
      </div>
    );
  }

  const latest = data[data.length - 1];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Compliance Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">WCAG 2.1</div>
                <div className={`text-2xl font-bold ${getComplianceLevel(analytics.current.wcag21).color}`}>
                  {Math.round(analytics.current.wcag21)}%
                </div>
                <div className="text-xs text-gray-500">{getComplianceLevel(analytics.current.wcag21).level}</div>
              </div>
              {analytics.trends.wcag21 > 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <Shield className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">WCAG 2.2</div>
            <div className={`text-2xl font-bold ${getComplianceLevel(analytics.current.wcag22).color}`}>
              {Math.round(analytics.current.wcag22)}%
            </div>
            <div className="text-xs text-gray-500">{getComplianceLevel(analytics.current.wcag22).level}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Legal Risk</div>
                <div className={`text-2xl font-bold ${
                  analytics.current.legalRisk < 25 ? 'text-green-600' :
                  analytics.current.legalRisk < 50 ? 'text-yellow-600' :
                  analytics.current.legalRisk < 75 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {Math.round(analytics.current.legalRisk)}
                </div>
                <div className="text-xs text-gray-500">risk score</div>
              </div>
              <AlertTriangle className={`w-8 h-8 ${
                analytics.current.legalRisk < 25 ? 'text-green-600' :
                analytics.current.legalRisk < 50 ? 'text-yellow-600' :
                analytics.current.legalRisk < 75 ? 'text-orange-600' : 'text-red-600'
              }`} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Time to Compliance</div>
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.timeToCompliance}
                </div>
                <div className="text-xs text-gray-500">weeks (estimated)</div>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* WCAG Compliance Radar and Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WCAG Principles Radar */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">WCAG 2.1 Principles</h3>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={wcagRadarData}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#000000', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#000000', fontSize: 10 }}
              />
              <Radar
                name="Compliance Score"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value: number) => [`${Math.round(value)}%`, 'Compliance']}
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {wcagRadarData.map(item => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-gray-600">{item.category}:</span>
                <span className={`font-semibold ${
                  item.score >= 80 ? 'text-green-600' :
                  item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(item.score)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Trends */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trends</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#000000', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#000000', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${Math.round(value)}%`,
                  name
                ]}
              />

              <Line
                type="monotone"
                dataKey="WCAG 2.1"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="WCAG 2.2"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Legal Risk"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
              />

              <ReferenceLine y={80} stroke="#10B981" strokeDasharray="2 2" />
              <ReferenceLine y={95} stroke="#059669" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Assessment and Compliance Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Risk Assessment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Current ADA Risk Level:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(latest.adaRiskLevel)}`}>
                {latest.adaRiskLevel}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Legal Risk Score:</span>
                <span className="font-semibold">{Math.round(latest.legalRiskScore)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    latest.legalRiskScore < 25 ? 'bg-green-500' :
                    latest.legalRiskScore < 50 ? 'bg-yellow-500' :
                    latest.legalRiskScore < 75 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${latest.legalRiskScore}%` }}
                />
              </div>
            </div>

            {analytics && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Risk Factors:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Compliance gaps: {analytics.totalGaps} issues identified</li>
                  <li>• WCAG 2.1 compliance: {Math.round(analytics.current.wcag21)}%</li>
                  <li>• Estimated time to compliance: {analytics.timeToCompliance} weeks</li>
                  <li>• ADA compliance estimate: {Math.round(analytics.current.adaCompliance)}%</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Compliance Gaps by Category */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Gaps</h3>

          {latest.complianceGaps.length > 0 ? (
            <div className="space-y-4">
              {latest.complianceGaps.map((gap, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{gap.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gap.severity === 'high' ? 'bg-red-100 text-red-800' :
                      gap.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {gap.severity} severity
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="font-medium mb-1">{gap.issues.length} issues:</div>
                    <ul className="space-y-1">
                      {gap.issues.slice(0, 3).map((issue, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                      {gap.issues.length > 3 && (
                        <li className="text-xs text-gray-500 pl-5">
                          +{gap.issues.length - 3} more issues...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <div className="text-lg font-semibold text-green-600">No Compliance Gaps!</div>
              <div className="text-sm text-gray-600">All WCAG categories are compliant</div>
            </div>
          )}
        </div>
      </div>

      {/* Legal Compliance Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Scale className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Legal Compliance Recommendations</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Priority Actions:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {latest.adaRiskLevel === 'CRITICAL' && (
                    <li>• <strong>URGENT:</strong> Address critical accessibility violations immediately</li>
                  )}
                  {latest.wcag21Compliance < 80 && (
                    <li>• Focus on WCAG 2.1 AA compliance to reach 80%+ threshold</li>
                  )}
                  <li>• Implement accessibility testing in development workflow</li>
                  <li>• Consider accessibility audit by certified professionals</li>
                  {analytics && analytics.totalGaps > 10 && (
                    <li>• Prioritize fixes based on legal risk and user impact</li>
                  )}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Legal Protection:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Document remediation efforts and timelines</li>
                  <li>• Establish accessibility policy and procedures</li>
                  <li>• Train staff on accessibility requirements</li>
                  <li>• Consider accessibility statement on website</li>
                  <li>• Plan regular compliance monitoring and testing</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href="https://www.ada.gov/resources/web-guidance/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                ADA Web Guidance
              </a>
              <a
                href="https://www.w3.org/WAI/WCAG21/quickref/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                WCAG 2.1 Quick Reference
              </a>
              <a
                href="https://www.w3.org/WAI/WCAG22/quickref/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                WCAG 2.2 Quick Reference
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}