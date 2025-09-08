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

export function SiteImage({ src, alt = "", width, height, className, fallbackSrc = '/favicon.ico' }: SiteImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
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
    />
  );
}