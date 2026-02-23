"use client";

import Image from "next/image";
import { BRAND } from "@/config/brand";

interface VexnexaLogoProps {
  /** Height in pixels — width auto-scales to aspect ratio */
  size?: number;
  className?: string;
}

export default function VexnexaLogo({ size = 32, className }: VexnexaLogoProps) {
  // The logo SVG has a ~3.5:1 aspect ratio (2048×585)
  const width = Math.round(size * 3.5);

  return (
    <Image
      src={BRAND.logo}
      alt={BRAND.name}
      width={width}
      height={size}
      className={className}
      priority
    />
  );
}
