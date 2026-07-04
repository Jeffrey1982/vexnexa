"use client";

import { cn } from "@/lib/utils";
import { BRAND } from "@/config/brand";

/** Width ÷ height of the lockup SVG (viewBox 271.4 × 92). */
const LOCKUP_ASPECT = 271.4 / 92;

interface VexnexaLogoProps {
  /** Target height of the lockup in px */
  size?: number;
  className?: string;
  /**
   * Which lockup to render, based on the background it sits on.
   * - `auto` (default): light-background lockup in light mode, dark-background
   *   lockup in dark mode.
   * - `onLight`: always the light-background lockup.
   * - `onDark`: always the dark-background lockup.
   */
  variant?: "auto" | "onLight" | "onDark";
}

export default function VexnexaLogo({ size = 32, className, variant = "auto" }: VexnexaLogoProps) {
  const width = Math.round(size * LOCKUP_ASPECT);
  const dims = { width, height: size, style: { height: size } as const };

  if (variant === "onLight" || variant === "onDark") {
    return (
      <img
        {...dims}
        src={variant === "onLight" ? "/vexnexa-lockup.svg" : "/vexnexa-lockup-dark.svg"}
        alt={BRAND.name}
        className={cn("block w-auto shrink-0", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        {...dims}
        src="/vexnexa-lockup.svg"
        alt={BRAND.name}
        className="block w-auto dark:hidden"
      />
      <img
        {...dims}
        src="/vexnexa-lockup-dark.svg"
        alt=""
        aria-hidden
        className="hidden w-auto dark:block"
      />
    </span>
  );
}
