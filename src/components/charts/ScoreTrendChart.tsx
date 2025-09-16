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

interface ScoreTrendChartProps {
  data: TrendData[];
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function ScoreTrendChart({
  data,
  height = 300,
  showLegend = true,
  className = ""
}: ScoreTrendChartProps) {
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
              {entry.dataKey === 'score' && '/100'}
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
            domain={[0, 100]}
            className="text-xs"
            tick={{ fill: '#000000', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            name="Accessibility Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}