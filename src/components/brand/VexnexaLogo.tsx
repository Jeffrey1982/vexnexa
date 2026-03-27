"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND, BRAND_LOGO_LOCKUP_ASPECT } from "@/config/brand";

interface VexnexaLogoProps {
  /** Height in pixels — width auto-scales to aspect ratio */
  size?: number;
  className?: string;
}

export default function VexnexaLogo({ size = 32, className }: VexnexaLogoProps) {
  const width = Math.round(size * BRAND_LOGO_LOCKUP_ASPECT);

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width, height: size }}
    >
      <Image
        src={BRAND.logoLockupLight}
        alt={BRAND.name}
        width={width}
        height={size}
        className="absolute inset-0 h-full w-full object-contain object-left dark:hidden"
        priority
      />
      <Image
        src={BRAND.logoLockupDark}
        alt=""
        width={width}
        height={size}
        className="absolute inset-0 hidden h-full w-full object-contain object-left dark:block"
        priority
      />
    </span>
  );
}
