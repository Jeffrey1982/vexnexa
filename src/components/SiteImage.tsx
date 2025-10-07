"use client";

import Image from "next/image";
import { useState } from "react";

interface SiteImageProps {
  src: string;
  alt?: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
}

// Default placeholder SVG - a nice globe icon
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjRjNGNEY2Ii8+CiAgPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMTAiIHN0cm9rZT0iIzlDQTNCNCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTI0IDE0VjM0IiBzdHJva2U9IiM5Q0EzQjQiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxwYXRoIGQ9Ik0xNCAyNEgzNCIgc3Ryb2tlPSIjOUNBM0I0IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8ZWxsaXBzZSBjeD0iMjQiIGN5PSIyNCIgcng9IjYiIHJ5PSIxMCIgc3Ryb2tlPSIjOUNBM0I0IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';

export function SiteImage({ src, alt = "", width, height, className, fallbackSrc }: SiteImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Try the custom fallback first if provided
      if (fallbackSrc && imgSrc !== fallbackSrc) {
        setImgSrc(fallbackSrc);
      }
      // Otherwise use the default placeholder
      else if (imgSrc !== DEFAULT_PLACEHOLDER) {
        setImgSrc(DEFAULT_PLACEHOLDER);
      }
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={imgSrc === DEFAULT_PLACEHOLDER || imgSrc.startsWith('data:')}
    />
  );
}