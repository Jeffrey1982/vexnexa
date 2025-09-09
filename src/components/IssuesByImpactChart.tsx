"use client";

import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { IssueStats } from "@/lib/axe-types";
import { formatImpact } from "@/lib/format";

interface IssuesByImpactChartProps {
  stats: IssueStats;
  className?: string;
}

const IMPACT_COLORS = {
  critical: "#dc2626", // red-600
  serious: "#ea580c",  // orange-600
  moderate: "#d97706", // amber-600
  minor: "#64748b",    // slate-500
};

export function IssuesByImpactChart({ stats, className }: IssuesByImpactChartProps) {
  const data = [
    {
      name: "Critical",
      value: stats.critical,
      color: IMPACT_COLORS.critical,
    },
    {
      name: "Serious", 
      value: stats.serious,
      color: IMPACT_COLORS.serious,
    },
    {
      name: "Moderate",
      value: stats.moderate,
      color: IMPACT_COLORS.moderate,
    },
    {
      name: "Minor",
      value: stats.minor,
      color: IMPACT_COLORS.minor,
    },
  ].filter(item => item.value > 0); // Only show non-zero values

  if (stats.total === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-muted-foreground ${className}`}>
        No issues found
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} issue{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value} ({entry.payload?.value || 0})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}