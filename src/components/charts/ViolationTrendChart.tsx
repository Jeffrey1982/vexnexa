"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ViolationTrend } from "@/lib/analytics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ViolationTrendChartProps {
  violations: ViolationTrend[];
  maxRules?: number;
  height?: number;
  className?: string;
}

const COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#059669", "#0891B2", "#7C3AED",
  "#BE185D", "#B91C1C", "#92400E", "#065F46", "#0E7490", "#5B21B6"
];

export function ViolationTrendChart({
  violations,
  maxRules = 6,
  height = 300,
  className = ""
}: ViolationTrendChartProps) {
  if (!violations || violations.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-gray-500 ${className}`}>
        No violation trend data available
      </div>
    );
  }

  // Take the top violations and prepare chart data
  const topViolations = violations.slice(0, maxRules);

  // Transform data for the chart
  const chartData: any[] = [];
  const allDates = new Set<string>();

  // Collect all unique dates
  topViolations.forEach(violation => {
    violation.trend.forEach(point => {
      allDates.add(point.date);
    });
  });

  // Create data points for each date
  Array.from(allDates).sort().forEach(date => {
    const dataPoint: any = { date };
    topViolations.forEach(violation => {
      const point = violation.trend.find(p => p.date === date);
      dataPoint[violation.ruleId] = point ? point.count : 0;
    });
    chartData.push(dataPoint);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => {
            const violation = topViolations.find(v => v.ruleId === entry.dataKey);
            return (
              <div key={index} className="text-sm">
                <p style={{ color: entry.color }} className="font-medium">
                  {violation?.ruleName || entry.dataKey}
                </p>
                <p className="text-gray-600">{entry.value} issues</p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = (isImproving: boolean, currentCount: number) => {
    if (currentCount === 0) {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    return isImproving ?
      <TrendingDown className="w-4 h-4 text-green-600" /> :
      <TrendingUp className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className={className}>
      {/* Trend Summary */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {topViolations.slice(0, 4).map((violation, index) => (
          <div key={violation.ruleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium truncate" title={violation.ruleName}>
                {violation.ruleName.length > 20
                  ? violation.ruleName.substring(0, 20) + "..."
                  : violation.ruleName
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(violation.isImproving, violation.currentCount)}
              <span className="text-sm font-semibold">
                {violation.currentCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="text-xs"
            tick={{ fill: '#000000', fontSize: 12 }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: '#000000', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => {
              const violation = topViolations.find(v => v.ruleId === value);
              return violation ? violation.ruleName.substring(0, 25) : value;
            }}
          />
          {topViolations.map((violation, index) => (
            <Line
              key={violation.ruleId}
              type="monotone"
              dataKey={violation.ruleId}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}