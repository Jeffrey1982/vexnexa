"use client";

import { cn } from "@/lib/utils";
import { BRAND } from "@/config/brand";

interface VexnexaLogoProps {
  /** Target height of the wordmark in px */
  size?: number;
  className?: string;
}

export default function VexnexaLogo({ size = 32, className }: VexnexaLogoProps) {
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <span
        aria-hidden
        className="font-display font-semibold tracking-tight"
        style={{
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "var(--vn-primary)",
        }}
      >
        VexNexa
      </span>
    </span>
  );
}
