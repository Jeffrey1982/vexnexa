"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Violation } from '@/lib/axe-types';
import { normalizeImpact } from '@/lib/axe-types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface IframeHeatmapProps {
  violations: Violation[];
  websiteUrl: string;
  className?: string;
}

interface HeatmapPoint {
  x: number;
  y: number;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  selector: string;
  description: string;
  rule: string;
}

export function IframeHeatmap({ violations, websiteUrl, className }: IframeHeatmapProps) {
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateHeatmapPoints = useCallback(() => {
    const points: HeatmapPoint[] = [];

    violations.forEach((violation) => {
      violation.nodes.forEach((node) => {
        // Generate realistic positions based on violation types
        let x = 50, y = 50; // Default center

        // Form-related issues typically appear in middle/lower sections
        if (violation.id.includes('label') || violation.id.includes('form') || violation.id.includes('input')) {
          x = 20 + Math.random() * 60; // 20-80%
          y = 60 + Math.random() * 30; // 60-90%
        }
        // Navigation issues in top section
        else if (violation.id.includes('link') || violation.id.includes('menu') || violation.id.includes('nav')) {
          x = 20 + Math.random() * 60; // 20-80%
          y = 5 + Math.random() * 20;  // 5-25%
        }
        // Image issues throughout the page
        else if (violation.id.includes('image') || violation.id.includes('alt')) {
          x = 10 + Math.random() * 80; // 10-90%
          y = 20 + Math.random() * 60; // 20-80%
        }
        // Color contrast issues can be anywhere
        else if (violation.id.includes('color')) {
          x = 15 + Math.random() * 70; // 15-85%
          y = 15 + Math.random() * 70; // 15-85%
        }
        // Heading issues in content areas
        else if (violation.id.includes('heading')) {
          x = 20 + Math.random() * 60; // 20-80%
          y = 30 + Math.random() * 50; // 30-80%
        }

        points.push({
          x: Math.max(2, Math.min(98, x)),
          y: Math.max(2, Math.min(98, y)),
          impact: normalizeImpact(violation.impact),
          selector: node.target.join(', '),
          description: violation.description,
          rule: violation.id
        });
      });
    });

    setHeatmapPoints(points);
  }, [violations]);

  const loadWebsite = useCallback(async () => {
    setIsLoading(true);

    // Generate heatmap points
    generateHeatmapPoints();

    // Wait a moment for the iframe to be ready
    setTimeout(() => {
      setShowIframe(true);
      setIsLoading(false);
    }, 1000);
  }, [generateHeatmapPoints]);

  useEffect(() => {
    if (violations.length > 0) {
      generateHeatmapPoints();
    }
  }, [violations, generateHeatmapPoints]);

  const getImpactColor = useCallback((impact: string) => {
    switch (impact) {
      case 'critical':
        return 'rgb(220, 38, 38)'; // red-600
      case 'serious':
        return 'rgb(239, 68, 68)'; // red-500
      case 'moderate':
        return 'rgb(245, 158, 11)'; // amber-500
      case 'minor':
        return 'rgb(156, 163, 175)'; // gray-400
      default:
        return 'rgb(156, 163, 175)';
    }
  }, []);

  const getImpactSize = useCallback((impact: string) => {
    switch (impact) {
      case 'critical':
        return 18;
      case 'serious':
        return 16;
      case 'moderate':
        return 14;
      case 'minor':
        return 12;
      default:
        return 12;
    }
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span>🌐 Live Website Heatmap</span>
          <div className="flex gap-2">
            <Button
              onClick={loadWebsite}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Website
                </>
              )}
            </Button>
            <Button
              onClick={() => window.open(websiteUrl, '_blank')}
              variant="ghost"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Live iframe preview of your website with accessibility violations mapped to their likely locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[500px] border rounded-lg overflow-hidden bg-gray-50">
          {showIframe ? (
            <>
              {/* Live iframe of the website */}
              <iframe
                ref={iframeRef}
                src={websiteUrl}
                className="w-full h-full border-0"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  console.warn('Iframe failed to load:', websiteUrl);
                }}
              />

              {/* Heatmap overlay */}
              <TooltipProvider>
                <div className="absolute inset-0 pointer-events-none">
                  {heatmapPoints.map((point, index) => {
                    const pointColor = getImpactColor(point.impact);
                    const pointSize = getImpactSize(point.impact);

                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <motion.button
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                            style={{
                              left: `${point.x}%`,
                              top: `${point.y}%`,
                              width: pointSize,
                              height: pointSize,
                              backgroundColor: pointColor,
                              boxShadow: point.impact === 'critical'
                                ? '0 0 20px rgba(220, 38, 38, 0.5)'
                                : '0 4px 6px rgba(0, 0, 0, 0.1)',
                              zIndex: 10
                            }}
                            onClick={() => setSelectedPoint(point)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.8, 1, 0.8]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: index * 0.1
                            }}
                            whileHover={{
                              scale: 1.3,
                              opacity: 1
                            }}
                            whileTap={{ scale: 0.9 }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-semibold">
                              ⚠️ {point.rule}
                            </div>
                            <Badge variant={
                              point.impact === 'critical' ? 'destructive' : 'secondary'
                            }>
                              {point.impact}
                            </Badge>
                            <div className="text-xs">{point.selector}</div>
                            <div className="text-xs text-muted-foreground max-w-xs">
                              {point.description}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🌐</div>
                <h3 className="text-lg font-semibold mb-2">Live Website Heatmap</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click &quot;Load Website&quot; to display your actual website in an iframe with accessibility violations overlaid on approximate locations.
                </p>

                <div className="text-sm space-y-2 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span>Critical Issues</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Serious Issues</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Moderate Issues</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Minor Issues</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
                  <strong>Live Preview:</strong> Shows your actual website with estimated violation locations based on accessibility scan results
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-lg">{selectedPoint.rule}</h4>
                <Badge variant={selectedPoint.impact === 'critical' ? 'destructive' : 'secondary'}>
                  {selectedPoint.impact}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPoint(null)}
              >
                ×
              </Button>
            </div>
            <p className="text-gray-700 mb-3">{selectedPoint.description}</p>
            <div className="text-sm text-muted-foreground">
              <strong>Element:</strong> <code className="bg-gray-100 px-1 rounded">{selectedPoint.selector}</code>
            </div>
          </motion.div>
        )}

        {heatmapPoints.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="text-sm font-medium text-gray-700">Legend:</div>
            {['critical', 'serious', 'moderate', 'minor'].map((impact) => (
              <div key={impact} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: getImpactColor(impact) }}
                />
                <span className="text-xs text-muted-foreground capitalize">{impact}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}