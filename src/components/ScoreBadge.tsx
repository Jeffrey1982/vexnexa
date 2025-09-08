import { Badge } from "@/components/ui/badge";
import { getScoreColor } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = "md", showLabel = true, className }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  
  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-1.5",
    lg: "text-xl px-4 py-2 font-bold",
  };

  const colorClasses = {
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200", 
    red: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClasses[color],
        sizeClasses[size],
        "flex items-center gap-1",
        className
      )}
      aria-label={`Accessibility score: ${score} out of 100`}
    >
      <span className="font-bold">{score}</span>
      {showLabel && <span className="font-normal">/100</span>}
    </Badge>
  );
}