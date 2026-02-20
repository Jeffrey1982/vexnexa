"use client";

import { ScanComparison } from "@/lib/analytics";
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle } from "lucide-react";

interface ComparisonCardProps {
  comparison: ScanComparison;
  className?: string;
}

export function ComparisonCard({ comparison, className = "" }: ComparisonCardProps) {
  if (!comparison.previous || !comparison.changes) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-semibold">First Scan</div>
          <div className="text-sm">No previous scan data for comparison</div>
        </div>
      </div>
    );
  }

  const { current, previous, changes } = comparison;

  const getChangeIcon = (change: number) => {
    if (change === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
    // For score, positive change is good (green)
    // For issues, negative change is good (green)
    return change > 0 ?
      <TrendingUp className="w-4 h-4 text-green-600" /> :
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getIssueChangeIcon = (change: number) => {
    if (change === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
    // For issues, negative change is good (green), positive is bad (red)
    return change < 0 ?
      <TrendingDown className="w-4 h-4 text-green-600" /> :
      <TrendingUp className="w-4 h-4 text-red-600" />;
  };

  const getChangeColor = (change: number, isScore: boolean = false) => {
    if (change === 0) return "text-muted-foreground";
    // For scores, positive is good. For issues, negative is good.
    const isPositive = isScore ? change > 0 : change < 0;
    return isPositive ? "text-green-600" : "text-red-600";
  };

  const formatChange = (change: number, showPlus: boolean = false) => {
    if (change === 0) return "0";
    const sign = change > 0 ? "+" : "";
    return showPlus && change > 0 ? `${sign}${change}` : `${change}`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Scan Comparison</h3>
        <div className="text-sm text-muted-foreground">vs Previous Scan</div>
      </div>

      <div className="space-y-4">
        {/* Score Comparison */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-700">Accessibility Score</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">{current.score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              {changes.score !== 0 && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(changes.score)}
                  <span className={`text-sm font-medium ${getChangeColor(changes.score, true)}`}>
                    {formatChange(changes.score, true)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Previous</div>
            <div className="text-xl font-semibold text-muted-foreground">{previous.score}</div>
          </div>
        </div>

        {/* Issues Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Critical", current: current.critical, previous: previous.critical, change: changes.critical, color: "red" },
            { label: "Serious", current: current.serious, previous: previous.serious, change: changes.serious, color: "orange" },
            { label: "Moderate", current: current.moderate, previous: previous.moderate, change: changes.moderate, color: "yellow" },
            { label: "Minor", current: current.minor, previous: previous.minor, change: changes.minor, color: "gray" }
          ].map(({ label, current: curr, previous: prev, change, color }) => (
            <div key={label} className="text-center p-3 border border-gray-200 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`text-lg font-bold ${
                  color === "red" ? "text-red-600" :
                  color === "orange" ? "text-orange-600" :
                  color === "yellow" ? "text-yellow-600" :
                  "text-muted-foreground"
                }`}>
                  {curr}
                </span>
                {change !== 0 && (
                  <div className="flex items-center">
                    {getIssueChangeIcon(change)}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">was {prev}</div>
              {change !== 0 && (
                <div className={`text-xs font-medium ${getChangeColor(change)}`}>
                  {formatChange(change, true)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fixed vs New Issues */}
        {(changes.issuesFixed > 0 || changes.newIssues > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-700">Issues Fixed</div>
                <div className="text-2xl font-bold text-green-600">{changes.issuesFixed}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-sm font-medium text-gray-700">New Issues</div>
                <div className="text-2xl font-bold text-red-600">{changes.newIssues}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}