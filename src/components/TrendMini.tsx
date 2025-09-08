"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface TrendMiniProps {
  data: Array<{
    date: string;
    score: number;
  }>;
  className?: string;
}

export function TrendMini({ data, className }: TrendMiniProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`h-8 w-16 bg-muted rounded ${className}`} />
    );
  }

  return (
    <div className={`h-8 w-16 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}