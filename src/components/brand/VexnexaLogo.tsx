"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND, BRAND_MARK_ASPECT } from "@/config/brand";

interface VexnexaLogoProps {
  /** Height of the V mark in px — word scales to match visually */
  size?: number;
  className?: string;
}

export default function VexnexaLogo({ size = 32, className }: VexnexaLogoProps) {
  const markWidth = Math.round(size * BRAND_MARK_ASPECT);
  const gap = Math.round(markWidth * 0.22);
  /** Body of the wordmark after the V mark (reads as VexNexa) */
  const wordSize = Math.round(size * 0.62);

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
        style={{ fontSize: wordSize, lineHeight: 1, letterSpacing: "-0.02em" }}
      >
        exNexa
      </span>
    </span>
  );
}
