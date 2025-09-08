"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ImpactBadge } from "@/components/ImpactBadge";
import { CopyButton } from "@/components/CopyButton";
import { Violation, normalizeImpact } from "@/lib/axe-types";
import { truncateText, sanitizeHtml } from "@/lib/format";
import { ExternalLink } from "lucide-react";

interface DrawerDetailsProps {
  violation: Violation;
  trigger: React.ReactNode;
}

export function DrawerDetails({ violation, trigger }: DrawerDetailsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {violation.id}
            </code>
            <ImpactBadge impact={normalizeImpact(violation.impact)} showIcon />
          </div>
          
          <SheetTitle className="text-left">{violation.help}</SheetTitle>
          
          <SheetDescription className="text-left">
            {violation.description}
          </SheetDescription>

          {violation.helpUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={violation.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-fit"
              >
                Learn More <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Affected Elements ({violation.nodes.length})
            </h3>
            <Badge variant="secondary">
              {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {violation.tags && violation.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">WCAG Guidelines</h4>
              <div className="flex flex-wrap gap-1">
                {violation.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3">Sample Elements</h4>
            <Accordion type="single" collapsible className="w-full">
              {violation.nodes.map((node, index) => (
                <AccordionItem key={index} value={`node-${index}`}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2 text-left">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {truncateText(node.target.join(", "), 50)}
                      </code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">CSS Selector</span>
                        <CopyButton text={node.target.join(", ")} size="sm" />
                      </div>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {node.target.join(", ")}
                      </code>
                    </div>

                    {node.html && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">HTML Source</span>
                          <CopyButton text={node.html} size="sm" />
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          <code>{sanitizeHtml(truncateText(node.html, 300))}</code>
                        </pre>
                      </div>
                    )}

                    {node.failureSummary && (
                      <div>
                        <span className="font-medium text-sm">Issue Summary</span>
                        <p className="text-sm mt-1 text-muted-foreground">
                          {node.failureSummary}
                        </p>
                      </div>
                    )}

                    {node.impact && (
                      <div>
                        <span className="font-medium text-sm">Element Impact</span>
                        <div className="mt-1">
                          <ImpactBadge impact={normalizeImpact(node.impact)} showIcon />
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {violation.nodes.length > 10 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing first 10 elements. Use the violations tab to see all affected elements.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}