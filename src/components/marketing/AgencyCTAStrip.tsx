"use client";

import { Building2, Check } from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";

const trustItems: string[] = [
  "White-label report workflows",
  "Ongoing monitoring support",
  "Clear issue prioritisation",
  "Built for agencies and EU-facing teams",
];

interface AgencyCTAStripProps {
  /** Analytics location identifier, e.g. "homepage", "pricing" */
  location: string;
}

export function AgencyCTAStrip({ location }: AgencyCTAStripProps) {
  return (
    <section className="py-14 bg-muted/40 border-y">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              For agencies
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold font-display">
            Managing multiple client sites?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use VexNexa for repeatable scans, branded reports, and ongoing
            accessibility monitoring.
          </p>

          {/* Trust proof */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <TrackedCTA
              href="/auth/register"
              event="agency_offer_cta_click"
              eventProps={{ location }}
              size="lg"
              className="gradient-primary text-white"
            >
              Start your free scan
            </TrackedCTA>
            <TrackedCTA
              href={`/contact?from=${location}`}
              event="agency_contact_cta_click"
              eventProps={{ location }}
              size="lg"
              variant="outline"
            >
              Contact us about agency use
            </TrackedCTA>
          </div>
        </div>
      </div>
    </section>
  );
}
