"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ViolationDistributionChartProps {
  data: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  height?: number;
  showLegend?: boolean;
  className?: string;
}

const COLORS = {
  critical: "#DC2626",
  serious: "#EA580C",
  moderate: "#D97706",
  minor: "#64748B"
};

export function ViolationDistributionChart({
  data,
  height = 300,
  showLegend = true,
  className = ""
}: ViolationDistributionChartProps) {
  const chartData = [
    { name: "Critical", value: data.critical, color: COLORS.critical },
    { name: "Serious", value: data.serious, color: COLORS.serious },
    { name: "Moderate", value: data.moderate, color: COLORS.moderate },
    { name: "Minor", value: data.minor, color: COLORS.minor },
  ].filter(item => item.value > 0); // Only show categories with violations

  const total = data.critical + data.serious + data.moderate + data.minor;

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-gray-500 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-2">🎉</div>
          <div className="text-lg font-semibold text-green-600">No Issues Found!</div>
          <div className="text-sm text-gray-600">This page has excellent accessibility</div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold" style={{ color: data.payload.color }}>
            {data.name} Issues
          </p>
          <p>Count: {data.value}</p>
          <p>Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#000000"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
        stroke="#ffffff"
        strokeWidth="0.5"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={Math.min(height * 0.35, 120)}
            fill="#8884d8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}