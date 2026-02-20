"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BenchmarkComparison } from "@/lib/analytics";

interface BenchmarkChartProps {
  comparison: BenchmarkComparison;
  height?: number;
  className?: string;
}

export function BenchmarkChart({
  comparison,
  height = 200,
  className = ""
}: BenchmarkChartProps) {
  const data = [
    {
      name: "Your Score",
      score: comparison.userScore,
      fill: comparison.category === "above_average" ? "#10B981" :
            comparison.category === "below_average" ? "#EF4444" : "#6B7280"
    },
    {
      name: "Industry Average",
      score: comparison.industryAvg,
      fill: "#3B82F6"
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p style={{ color: payload[0].color }}>
            Score: {value}/100
          </p>
        </div>
      );
    }
    return null;
  };

  const getCategoryColor = () => {
    switch (comparison.category) {
      case "above_average":
        return "text-green-600";
      case "below_average":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getCategoryText = () => {
    switch (comparison.category) {
      case "above_average":
        return "Above Average";
      case "below_average":
        return "Below Average";
      default:
        return "Average";
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Performance vs Industry</span>
          <span className={`text-sm font-semibold ${getCategoryColor()}`}>
            {getCategoryText()}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {comparison.difference >= 0 ? "+" : ""}{comparison.difference.toFixed(1)} points from average
          <span className="ml-2">({comparison.percentile}th percentile)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="name"
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fill: '#000000', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            className="text-xs"
            tick={{ fill: '#000000', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={comparison.industryAvg}
            stroke="#6B7280"
            strokeDasharray="5 5"
            label={{ value: "Industry Avg", position: "left" }}
          />
          <Bar
            dataKey="score"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}