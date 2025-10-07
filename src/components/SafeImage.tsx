"use client";

import { useState, ImgHTMLAttributes } from "react";

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

// Default placeholder SVG - a nice image icon
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGM0Y0RjYiLz4KICA8cGF0aCBkPSJNMTYwIDEyMEMxNjAgMTA4Ljk1NCAxNjguOTU0IDEwMCAxODAgMTAwQzE5MS4wNDYgMTAwIDIwMCAxMDguOTU0IDIwMCAxMjBDMjAwIDEzMS4wNDYgMTkxLjA0NiAxNDAgMTgwIDE0MEMxNjguOTU0IDE0MCAxNjAgMTMxLjA0NiAxNjAgMTIwWiIgZmlsbD0iIzlDQTNCNCIvPgogIDxwYXRoIGQ9Ik0xMDAgMjAwTDEzMCAxNjBMMTgwIDE5MEwyMzAgMTQwTDMwMCAyMDBIMTAwWiIgZmlsbD0iIzlDQTNCNCIvPgo8L3N2Zz4=';

export function SafeImage({ src, alt, fallbackSrc, className, ...props }: SafeImageProps) {
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
