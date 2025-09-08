import { Badge } from "@/components/ui/badge";
import { ImpactLevel } from "@/lib/axe-types";
import { getImpactColor, formatImpact } from "@/lib/format";
import { AlertTriangle, AlertCircle, AlertOctagon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImpactBadgeProps {
  impact: ImpactLevel;
  showIcon?: boolean;
  className?: string;
}

export function ImpactBadge({ impact, showIcon = false, className }: ImpactBadgeProps) {
  const colors = getImpactColor(impact);
  
  const icons = {
    critical: AlertOctagon,
    serious: AlertTriangle,
    moderate: AlertCircle,
    minor: Info,
  };
  
  const Icon = icons[impact];

  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        "flex items-center gap-1",
        className
      )}
      aria-label={`${formatImpact(impact)} impact`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {formatImpact(impact)}
    </Badge>
  );
}