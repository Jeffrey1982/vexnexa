"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND, BRAND_MARK_ASPECT } from "@/config/brand";

interface VexnexaLogoProps {
  /** Target height of the V mark in px (glyph is tight-cropped; matches cap band of the word) */
  size?: number;
  className?: string;
}

export default function VexnexaLogo({ size = 32, className }: VexnexaLogoProps) {
  const markWidth = Math.round(size * BRAND_MARK_ASPECT);
  /** Letter-spacing inside a single word (~1/4 of a typical stem gap) */
  const gap = Math.max(2, Math.round(size * 0.07));
  /** exNexa — cap height ≈ 0.72×em; tuned with tight V crop so V reads as the leading letter */
  const wordSize = Math.round(size * 0.78);

  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={cn("inline-flex shrink-0 items-center", className)}
      style={{ gap }}
    >
      <Image
        src={BRAND.logoMark}
        alt=""
        width={markWidth}
        height={size}
        className="object-contain object-left"
        priority
      />
      <span
        aria-hidden
        className="font-display font-semibold tracking-tight text-[#0A2540] dark:text-white"
        style={{
          fontSize: wordSize,
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        exNexa
      </span>
    </span>
  );
}
