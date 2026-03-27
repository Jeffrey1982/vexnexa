"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Small badge + Radix tooltip. Client-only; parent section stays a server component.
 */
export function EAAAutomatedScanHint({ className }: { className?: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary/30 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[var(--surface-2)] dark:text-muted-foreground dark:hover:text-foreground",
              className
            )}
            aria-label="More about automated scanning: opens tooltip"
          >
            <Info className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>Automated scan only</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left leading-snug">
          Automated checks find many common barriers but cannot verify every EAA-relevant requirement.
          Use results as indicators, not as proof of conformity.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
