"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImpactBadge } from "@/components/ImpactBadge";
import { Violation, normalizeImpact, getTopViolations } from "@/lib/axe-types";
import { ExternalLink } from "lucide-react";

interface TopIssuesProps {
  violations: Violation[];
  limit?: number;
  className?: string;
}

export function TopIssues({ violations, limit = 10, className }: TopIssuesProps) {
  const topViolations = getTopViolations(violations, limit);

  if (topViolations.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        No issues to display
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {topViolations.map((violation) => (
        <Card key={violation.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                    {violation.id}
                  </code>
                  <ImpactBadge impact={normalizeImpact(violation.impact)} />
                  <Badge variant="secondary" className="text-xs">
                    {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-sm mb-1 break-words">
                  {violation.help}
                </h4>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {violation.description}
                </p>
                
                {violation.helpUrl && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a
                        href={violation.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Learn More <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}