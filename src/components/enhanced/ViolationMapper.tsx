"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Violation } from '@/lib/axe-types';
import { normalizeImpact } from '@/lib/axe-types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, MapPin, Code, AlertTriangle } from 'lucide-react';

interface ViolationMapperProps {
  violations: Violation[];
  websiteUrl: string;
  className?: string;
}

interface MappedViolation {
  violation: Violation;
  elements: Array<{
    selector: string;
    context: string;
    location: {
      line?: number;
      column?: number;
    };
    snippet: string;
  }>;
}

export function ViolationMapper({ violations, websiteUrl, className }: ViolationMapperProps) {
  const [selectedViolation, setSelectedViolation] = useState<MappedViolation | null>(null);

  const mappedViolations: MappedViolation[] = violations.map(violation => ({
    violation,
    elements: violation.nodes.map(node => ({
      selector: node.target.join(' > '),
      context: node.html || '',
      location: {
        line: undefined, // Would be populated from scan data if available
        column: undefined
      },
      snippet: node.html?.substring(0, 200) + (node.html && node.html.length > 200 ? '...' : '') || 'No HTML available'
    }))
  }));

  const getImpactColor = useCallback((impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-600 border-red-700 text-white';
      case 'serious':
        return 'bg-red-500 border-red-600 text-white';
      case 'moderate':
        return 'bg-amber-500 border-amber-600 text-white';
      case 'minor':
        return 'bg-gray-400 border-gray-500 text-white';
      default:
        return 'bg-gray-400 border-gray-500 text-white';
    }
  }, []);

  const getViolationsByType = () => {
    const typeGroups: Record<string, MappedViolation[]> = {};

    mappedViolations.forEach(mapped => {
      const category = getCategoryFromRule(mapped.violation.id);
      if (!typeGroups[category]) {
        typeGroups[category] = [];
      }
      typeGroups[category].push(mapped);
    });

    return typeGroups;
  };

  const getCategoryFromRule = (ruleId: string): string => {
    if (ruleId.includes('color') || ruleId.includes('contrast')) return 'Visual & Color';
    if (ruleId.includes('image') || ruleId.includes('alt')) return 'Images & Media';
    if (ruleId.includes('form') || ruleId.includes('label') || ruleId.includes('input')) return 'Forms & Inputs';
    if (ruleId.includes('link') || ruleId.includes('anchor')) return 'Links & Navigation';
    if (ruleId.includes('heading') || ruleId.includes('structure')) return 'Document Structure';
    if (ruleId.includes('aria') || ruleId.includes('role')) return 'ARIA & Semantics';
    if (ruleId.includes('keyboard') || ruleId.includes('focus')) return 'Keyboard & Focus';
    return 'Other Issues';
  };

  const violationsByType = getViolationsByType();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Violation Location Mapper
          </span>
          <Button
            onClick={() => window.open(websiteUrl, '_blank')}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Website
          </Button>
        </CardTitle>
        <CardDescription>
          Privacy-respecting violation mapping using DOM selectors and HTML context from your accessibility scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {violations.filter(v => normalizeImpact(v.impact) === 'critical').length}
            </div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {violations.filter(v => normalizeImpact(v.impact) === 'serious').length}
            </div>
            <div className="text-sm text-muted-foreground">Serious</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {violations.filter(v => normalizeImpact(v.impact) === 'moderate').length}
            </div>
            <div className="text-sm text-muted-foreground">Moderate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {violations.filter(v => normalizeImpact(v.impact) === 'minor').length}
            </div>
            <div className="text-sm text-muted-foreground">Minor</div>
          </div>
        </div>

        {/* Violation Groups */}
        <div className="space-y-4">
          {Object.entries(violationsByType).map(([category, categoryViolations]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {category}
                <Badge variant="secondary">{categoryViolations.length}</Badge>
              </h3>

              <div className="space-y-2">
                {categoryViolations.map((mapped, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedViolation(mapped)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedViolation(mapped); } }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getImpactColor(normalizeImpact(mapped.violation.impact)).replace('border-', '').replace('text-white', '')}`} />
                        <h4 className="font-medium">{mapped.violation.help}</h4>
                      </div>
                      <Badge variant={normalizeImpact(mapped.violation.impact) === 'critical' ? 'destructive' : 'secondary'}>
                        {normalizeImpact(mapped.violation.impact)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {mapped.violation.description}
                    </p>

                    <div className="text-xs text-muted-foreground">
                      <strong>Affects {mapped.elements.length} element{mapped.elements.length !== 1 ? 's' : ''}:</strong>
                      <div className="mt-1 space-y-1">
                        {mapped.elements.slice(0, 2).map((element, i) => (
                          <div key={i} className="font-mono bg-muted px-2 py-1 rounded text-xs">
                            {element.selector}
                          </div>
                        ))}
                        {mapped.elements.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{mapped.elements.length - 2} more elements
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Violation Details */}
        {selectedViolation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4 bg-muted/30"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  {selectedViolation.violation.help}
                </h3>
                <Badge variant={normalizeImpact(selectedViolation.violation.impact) === 'critical' ? 'destructive' : 'secondary'}>
                  {normalizeImpact(selectedViolation.violation.impact)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedViolation(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedViolation.violation.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">How to Fix</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedViolation.violation.helpUrl ? (
                    <a
                      href={selectedViolation.violation.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View detailed remediation guide →
                    </a>
                  ) : (
                    'Refer to WCAG guidelines for remediation steps.'
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Affected Elements ({selectedViolation.elements.length})</h4>
                <div className="space-y-3">
                  {selectedViolation.elements.map((element, index) => (
                    <div key={index} className="border rounded p-3 bg-background">
                      <div className="font-mono text-sm mb-2 text-blue-600">
                        {element.selector}
                      </div>
                      {element.snippet && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">HTML Context:</div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {element.snippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Privacy Notice */}
        <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200 text-xs text-green-700">
          <strong>Privacy-Respecting Approach:</strong> This mapper uses only the DOM selector and HTML context data from your accessibility scan results. No external website content is captured or stored.
        </div>
      </CardContent>
    </Card>
  );
}