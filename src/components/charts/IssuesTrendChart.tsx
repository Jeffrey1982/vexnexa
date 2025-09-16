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
import { TrendData } from "@/lib/analytics";

interface IssuesTrendChartProps {
  data: TrendData[];
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function IssuesTrendChart({
  data,
  height = 300,
  showLegend = true,
  className = ""
}: IssuesTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-gray-500 ${className}`}>
        No data available for trend analysis
      </div>
    );
  }

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
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="critical"
            stroke="#DC2626"
            strokeWidth={2}
            dot={{ fill: "#DC2626", strokeWidth: 2, r: 3 }}
            name="Critical Issues"
          />
          <Line
            type="monotone"
            dataKey="serious"
            stroke="#EA580C"
            strokeWidth={2}
            dot={{ fill: "#EA580C", strokeWidth: 2, r: 3 }}
            name="Serious Issues"
          />
          <Line
            type="monotone"
            dataKey="moderate"
            stroke="#D97706"
            strokeWidth={2}
            dot={{ fill: "#D97706", strokeWidth: 2, r: 3 }}
            name="Moderate Issues"
          />
          <Line
            type="monotone"
            dataKey="minor"
            stroke="#64748B"
            strokeWidth={2}
            dot={{ fill: "#64748B", strokeWidth: 2, r: 3 }}
            name="Minor Issues"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}