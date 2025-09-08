"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, Minus } from "lucide-react";

export type SeverityLevel = "critical" | "serious" | "moderate" | "minor";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  count?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const severityConfig = {
  critical: {
    label: "Critical",
    icon: AlertTriangle,
    className: "bg-critical text-critical-foreground border-critical",
  },
  serious: {
    label: "Serious", 
    icon: AlertCircle,
    className: "bg-serious text-serious-foreground border-serious",
  },
  moderate: {
    label: "Moderate",
    icon: Info,
    className: "bg-moderate text-moderate-foreground border-moderate",
  },
  minor: {
    label: "Minor",
    icon: Minus,
    className: "bg-minor text-minor-foreground border-minor",
  },
};

const sizeConfig = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export function SeverityBadge({ 
  severity, 
  count, 
  showIcon = true, 
  size = "md",
  className 
}: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const IconComponent = config.icon;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-md border font-medium",
      config.className,
      sizeConfig[size],
      className
    )}>
      {showIcon && (
        <IconComponent 
          className={cn(
            "flex-shrink-0",
            size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
          )} 
        />
      )}
      <span>{config.label}</span>
      {count !== undefined && (
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-xs font-bold",
          "bg-white/20 text-current"
        )}>
          {count}
        </span>
      )}
    </div>
  );
}