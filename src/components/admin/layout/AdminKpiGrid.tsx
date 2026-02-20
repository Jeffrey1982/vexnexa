import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface KpiCardData {
  /** KPI label */
  label: string;
  /** KPI value */
  value: string | number;
  /** Optional icon */
  icon?: LucideIcon;
  /** Value color (e.g., "text-blue-600") */
  valueColor?: string;
  /** Mark as primary KPI for emphasis */
  primary?: boolean;
  /** Optional subtitle for context */
  subtitle?: string;
  /** Optional trend indicator */
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

interface AdminKpiGridProps {
  /** Array of KPI data */
  kpis: KpiCardData[];
  /** Number of columns on desktop (default: 4) */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

/**
 * AdminKpiGrid - Display KPI cards in a responsive grid
 *
 * Supports emphasizing a primary KPI and responsive layouts.
 *
 * @example
 * ```tsx
 * <AdminKpiGrid
 *   columns={4}
 *   kpis={[
 *     { label: "Total", value: 1234, primary: true },
 *     { label: "Active", value: 456, valueColor: "text-green-600" },
 *   ]}
 * />
 * ```
 */
export function AdminKpiGrid({ kpis, columns = 4, className }: AdminKpiGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6",
      gridCols[columns],
      className
    )}>
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPrimary = kpi.primary;

        return (
          <Card
            key={index}
            className={cn(
              "transition-all hover:shadow-md",
              isPrimary && "ring-2 ring-orange-500/20 bg-gradient-to-br from-orange-50/50 to-white"
            )}
          >
            <CardHeader className={cn(
              "pb-2",
              isPrimary ? "pb-3" : "pb-2"
            )}>
              <CardTitle className={cn(
                "text-sm font-medium flex items-center gap-2",
                isPrimary ? "text-gray-900 dark:text-foreground" : "text-muted-foreground"
              )}>
                {Icon && <Icon className={cn("w-4 h-4", isPrimary && "text-orange-500")} />}
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "font-bold",
                isPrimary ? "text-3xl" : "text-2xl",
                kpi.valueColor || (isPrimary ? "text-orange-600" : "text-gray-900 dark:text-foreground")
              )}>
                {kpi.value}
              </div>
              {kpi.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
              )}
              {kpi.trend && (
                <div className={cn(
                  "text-xs mt-2 font-medium flex items-center gap-1",
                  kpi.trend.direction === 'up' && "text-green-600",
                  kpi.trend.direction === 'down' && "text-red-600",
                  kpi.trend.direction === 'neutral' && "text-muted-foreground"
                )}>
                  {kpi.trend.direction === 'up' && '↑'}
                  {kpi.trend.direction === 'down' && '↓'}
                  {kpi.trend.direction === 'neutral' && '→'}
                  <span>{kpi.trend.value}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
