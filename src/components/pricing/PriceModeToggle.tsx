"use client";

/**
 * PriceModeToggle — segmented control to switch between
 * "Incl. VAT" and "Excl. VAT" price display.
 *
 * Renders a small, accessible toggle with a tooltip explaining
 * that final tax depends on billing country.
 */

import { cn } from "@/lib/utils";
import { usePriceDisplayMode } from "@/lib/pricing/use-price-display-mode";
import type { PriceDisplayMode } from "@/lib/pricing/display-mode";

interface PriceModeToggleProps {
  /** Additional CSS classes for the outer wrapper */
  className?: string;
}

export function PriceModeToggle({ className }: PriceModeToggleProps): JSX.Element {
  const [mode, setMode] = usePriceDisplayMode();

  const options: { value: PriceDisplayMode; label: string }[] = [
    { value: "incl", label: "Incl. VAT" },
    { value: "excl", label: "Excl. VAT" },
  ];

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <div
        className="inline-flex items-center rounded-md bg-muted p-0.5 text-xs"
        role="radiogroup"
        aria-label="Price display mode"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={mode === opt.value}
            onClick={() => setMode(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-[5px] font-medium transition-all duration-150 select-none",
              mode === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground leading-tight">
        Final tax depends on billing country
      </span>
    </div>
  );
}
