"use client";

/**
 * PriceModeToggle — segmented control to switch between
 * "Incl. BTW" and "Excl. BTW" price display, plus a country
 * dropdown for VAT rate selection.
 */

import { cn } from "@/lib/utils";
import { usePriceDisplayMode } from "@/lib/pricing/use-price-display-mode";
import { usePricingCountry } from "@/lib/pricing/use-price-display-mode";
import type { PriceDisplayMode } from "@/lib/pricing/display-mode";
import { PRICING_COUNTRY_OPTIONS } from "@/lib/pricing/vat-math";

interface PriceModeToggleProps {
  className?: string;
}

export function PriceModeToggle({ className }: PriceModeToggleProps): JSX.Element {
  const [mode, setMode] = usePriceDisplayMode();
  const [country, setCountry] = usePricingCountry();

  const options: { value: PriceDisplayMode; label: string }[] = [
    { value: "excl", label: "Excl. BTW" },
    { value: "incl", label: "Incl. BTW" },
  ];

  const currentOption = PRICING_COUNTRY_OPTIONS.find((o) => o.code === country);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        {/* VAT mode toggle */}
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

        {/* Country dropdown */}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="VAT country"
        >
          {PRICING_COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.flag} {opt.label} ({opt.vatPercent}%)
            </option>
          ))}
        </select>
      </div>
      <span className="text-[10px] text-muted-foreground leading-tight">
        {mode === "incl"
          ? `Prijzen incl. ${currentOption?.vatPercent ?? 21}% BTW (${currentOption?.label ?? "Nederland"})`
          : "Prijzen excl. BTW · BTW wordt berekend bij checkout"}
      </span>
    </div>
  );
}
