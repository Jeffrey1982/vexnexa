"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ImpactBadge } from "@/components/ImpactBadge";
import { CopyButton } from "@/components/CopyButton";
import { Violation, ImpactLevel, normalizeImpact } from "@/lib/axe-types";
import { truncateText, sanitizeHtml } from "@/lib/format";
import { Filter, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface ViolationsTableProps {
  violations: Violation[];
  className?: string;
}

export function ViolationsTable({ violations, className }: ViolationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImpacts, setSelectedImpacts] = useState<Set<ImpactLevel>>(
    new Set(["critical", "serious", "moderate", "minor"] as ImpactLevel[])
  );
  const [minNodes, setMinNodes] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const filteredViolations = useMemo(() => {
    return violations.filter((violation) => {
      const impact = normalizeImpact(violation.impact);
      const matchesSearch = !searchTerm || 
        violation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.help.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesImpact = selectedImpacts.has(impact);
      const matchesNodes = violation.nodes.length >= minNodes;

      return matchesSearch && matchesImpact && matchesNodes;
    });
  }, [violations, searchTerm, selectedImpacts, minNodes]);

  const toggleImpact = (impact: ImpactLevel) => {
    const newSelected = new Set(selectedImpacts);
    if (newSelected.has(impact)) {
      newSelected.delete(impact);
    } else {
      newSelected.add(impact);
    }
    setSelectedImpacts(newSelected);
  };

  const toggleRowExpansion = (violationId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(violationId)) {
      newExpanded.delete(violationId);
    } else {
      newExpanded.add(violationId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(filteredViolations.map(v => v.id)));
    }
    setExpandAll(!expandAll);
  };

  const allImpacts: ImpactLevel[] = ["critical", "serious", "moderate", "minor"];

  if (violations.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        No violations found in this scan.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search rules, help text, or descriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Impact ({selectedImpacts.size})
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {allImpacts.map((impact) => (
              <DropdownMenuCheckboxItem
                key={impact}
                checked={selectedImpacts.has(impact)}
                onCheckedChange={() => toggleImpact(impact)}
              >
                <ImpactBadge impact={impact} className="mr-2" />
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          type="number"
          placeholder="Min nodes"
          value={minNodes || ""}
          onChange={(e) => setMinNodes(Number(e.target.value) || 0)}
          className="w-24"
          min="0"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={toggleExpandAll}
          className="ml-auto"
        >
          {expandAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredViolations.length} of {violations.length} violations
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Nodes</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredViolations.map((violation) => (
              <TableRow key={violation.id}>
                <TableCell>
                  <div className="space-y-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {violation.id}
                    </code>
                    <div className="text-sm font-medium">
                      {violation.help}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <ImpactBadge impact={normalizeImpact(violation.impact)} showIcon />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {violation.nodes.length} node{violation.nodes.length !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <p className="text-sm">{truncateText(violation.description, 120)}</p>
                    {violation.helpUrl && (
                      <a
                        href={violation.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                      >
                        Learn more <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(violation.id)}
                    aria-label={expandedRows.has(violation.id) ? "Collapse details" : "Expand details"}
                  >
                    {expandedRows.has(violation.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Expanded details */}
      {filteredViolations.map((violation) => 
        expandedRows.has(violation.id) && (
          <div key={`${violation.id}-details`} className="ml-4 border-l-2 border-muted pl-4">
            <h4 className="font-medium mb-2">Sample Elements ({violation.nodes.length})</h4>
            <Accordion type="single" collapsible className="w-full">
              {violation.nodes.slice(0, 10).map((node, index) => (
                <AccordionItem key={index} value={`${violation.id}-node-${index}`}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {truncateText(node.target.join(", "), 60)}
                      </code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <div className="grid gap-2">
                      <div>
                        <span className="font-medium text-xs text-muted-foreground">Selector:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                            {node.target.join(", ")}
                          </code>
                          <CopyButton text={node.target.join(", ")} size="sm" />
                        </div>
                      </div>
                      
                      {node.html && (
                        <div>
                          <span className="font-medium text-xs text-muted-foreground">HTML:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            <code>{truncateText(sanitizeHtml(node.html), 200)}</code>
                          </pre>
                        </div>
                      )}

                      {node.failureSummary && (
                        <div>
                          <span className="font-medium text-xs text-muted-foreground">Issue:</span>
                          <p className="text-xs mt-1">{node.failureSummary}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
              {violation.nodes.length > 10 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  ... and {violation.nodes.length - 10} more nodes
                </div>
              )}
            </Accordion>
          </div>
        )
      )}
    </div>
  );
}