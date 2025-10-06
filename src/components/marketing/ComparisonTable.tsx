"use client";

import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonRow {
  feature: string;
  tutusporta: boolean | string;
  overlay: boolean | string;
  generic: boolean | string;
}

interface ComparisonTableProps {
  title?: string;
  description?: string;
  rows: ComparisonRow[];
  disclaimer?: string;
}

export function ComparisonTable({
  title = "How TutusPorta Compares",
  description,
  rows,
  disclaimer,
}: ComparisonTableProps) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-success mx-auto" aria-label="Yes" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground mx-auto" aria-label="No" />
      );
    }
    return <span className="text-sm text-center block">{value}</span>;
  };

  return (
    <section className="py-20 bg-muted/30" aria-labelledby="comparison-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="comparison-heading" className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {title}
            </h2>
            {description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </div>

          <Card className="overflow-hidden shadow-lg">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-muted/50 font-semibold text-sm">
              <div className="col-span-1"></div>
              <div className="text-center text-primary font-bold">TutusPorta</div>
              <div className="text-center text-muted-foreground">Overlay Widget</div>
              <div className="text-center text-muted-foreground">Generic Scanner</div>
            </div>

            {/* Data Rows */}
            {rows.map((row, index) => (
              <div
                key={index}
                className={cn(
                  "grid grid-cols-4 gap-4 p-4 border-t items-center",
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                <div className="col-span-1 font-medium text-sm">{row.feature}</div>
                <div className="text-center">{renderValue(row.tutusporta)}</div>
                <div className="text-center">{renderValue(row.overlay)}</div>
                <div className="text-center">{renderValue(row.generic)}</div>
              </div>
            ))}
          </Card>

          {disclaimer && (
            <div className="mt-8 p-6 border rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Note:</strong> {disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
