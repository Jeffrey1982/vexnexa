"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Shield, Clock, Zap } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "critical";
  className?: string;
}

const variantStyles = {
  default: {
    card: "",
    icon: "text-primary",
    value: "text-foreground",
    trend: {
      positive: "text-success",
      negative: "text-critical",
      neutral: "text-muted-foreground",
    },
  },
  success: {
    card: "border-success/20 bg-success/5",
    icon: "text-success",
    value: "text-success dark:text-success-foreground",
    trend: {
      positive: "text-success",
      negative: "text-critical",
      neutral: "text-muted-foreground",
    },
  },
  warning: {
    card: "border-warning/20 bg-warning/5",
    icon: "text-warning",
    value: "text-warning dark:text-warning-foreground",
    trend: {
      positive: "text-success",
      negative: "text-critical",
      neutral: "text-muted-foreground",
    },
  },
  critical: {
    card: "border-critical/20 bg-critical/5",
    icon: "text-critical",
    value: "text-critical dark:text-critical-foreground",
    trend: {
      positive: "text-success",
      negative: "text-critical",
      neutral: "text-muted-foreground",
    },
  },
};

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Shield,
  Clock,
  Zap,
};

export function StatCard({
  title,
  value,
  subtitle,
  iconName,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const Icon = iconName ? iconMap[iconName] : undefined;
  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return trend.isPositive !== false ? TrendingUp : TrendingDown;
    if (trend.value < 0) return trend.isPositive === false ? TrendingUp : TrendingDown;
    return Minus;
  };
  
  const getTrendColor = () => {
    if (!trend) return styles.trend.neutral;
    if (trend.value > 0) return trend.isPositive !== false ? styles.trend.positive : styles.trend.negative;
    if (trend.value < 0) return trend.isPositive === false ? styles.trend.positive : styles.trend.negative;
    return styles.trend.neutral;
  };
  
  const TrendIcon = getTrendIcon();
  
  return (
    <Card className={cn(styles.card, className)}>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between space-y-0 pb-1 sm:pb-2">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground font-display">
            {title}
          </p>
          {Icon && (
            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", styles.icon)} />
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className={cn("text-xl sm:text-2xl lg:text-3xl font-bold font-display", styles.value)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>

          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}

            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                {TrendIcon && <TrendIcon className="w-3 h-3" />}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                  {trend.label && <span className="ml-1 text-muted-foreground">{trend.label}</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}