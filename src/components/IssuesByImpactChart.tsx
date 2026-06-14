"use client";

import { useEffect, useRef, useState } from "react";
import { Cell, PieChart, Pie, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import { IssueStats } from "@/lib/axe-types";
import { cn } from "@/lib/utils";

interface IssuesByImpactChartProps {
  stats: IssueStats;
  className?: string;
}

type ImpactKey = "critical" | "serious" | "moderate" | "minor";

const IMPACT_COLORS: Record<ImpactKey, string> = {
  critical: "#dc2626", // red-600
  serious: "#ea580c", // orange-600
  moderate: "#d97706", // amber-600
  minor: "#64748b", // slate-500
};

const IMPACT_ORDER: ImpactKey[] = ["critical", "serious", "moderate", "minor"];

export function IssuesByImpactChart({ stats, className }: IssuesByImpactChartProps) {
  const t = useTranslations("dashboard.overview.charts.severity");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setChartWidth(Math.floor(container.getBoundingClientRect().width));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const data = IMPACT_ORDER.map((key) => ({
    key,
    name: t(key),
    value: stats[key],
    color: IMPACT_COLORS[key],
  })).filter((item) => item.value > 0);

  if (stats.total === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground text-sm",
          className,
        )}
      >
        No issues found
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg px-2.5 py-1.5 shadow-sm">
          <p className="font-medium text-sm">{d.name}</p>
          <p className="text-xs text-muted-foreground">
            {d.value} issue{d.value !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("flex flex-col justify-center", className)}>
      {/* Keep the plot and legend in separate layout rows so they cannot overlap. */}
      <div ref={chartContainerRef} className="h-40 w-full">
        {chartWidth > 0 && (
          <PieChart width={chartWidth} height={160}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )}
      </div>

      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((entry) => (
          <li key={entry.key} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="truncate text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
