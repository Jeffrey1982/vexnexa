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
  /** Space between V mark and wordmark */
  const gap = Math.max(2, Math.round(size * 0.07));
  /** Full “VexNexa” — scale so cap height aligns with V glyph (tight-cropped mark) */
  const wordSize = Math.round(size * 0.58);

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
        style={{ width: markWidth, height: size }}
        priority
      />
      <span
        aria-hidden
        className="font-display font-semibold tracking-tight text-foreground"
        style={{
          fontSize: wordSize,
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        VexNexa
      </span>
    </span>
  );
}
