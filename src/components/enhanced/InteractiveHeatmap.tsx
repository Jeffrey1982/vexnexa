"use client";

import React from 'react';
import { Violation } from '@/lib/axe-types';
import { ViolationMapper } from './ViolationMapper';

interface InteractiveHeatmapProps {
  violations: Violation[];
  websiteUrl: string;
  className?: string;
}

export function InteractiveHeatmap({ violations, websiteUrl, className }: InteractiveHeatmapProps) {
  // Use privacy-respecting violation mapper that uses only scan data
  return (
    <ViolationMapper
      violations={violations}
      websiteUrl={websiteUrl}
      className={className}
    />
  );
}