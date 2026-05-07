"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface EaaFaqItem {
  q: string;
  a: string;
}

interface EaaFaqProps {
  items: EaaFaqItem[];
}

/**
 * Client island for the EAA pillar page FAQ.
 *
 * Uses the existing Radix-based Accordion primitive from the shared UI library
 * — keyboard nav (Up/Down/Home/End/Space/Enter) is handled by Radix.
 *
 * The page also renders FAQPage JSON-LD using the same items array, so the
 * markup that screen readers see and the structured data that search engines
 * see are guaranteed to stay in sync.
 */
export function EaaFaq({ items }: EaaFaqProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      style={{ borderTop: "1px solid var(--color-border-subtle)" }}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`faq-${index}`}
          className="!border-b"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <AccordionTrigger
            className="!py-5 text-left text-base font-medium hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: "var(--color-ink-900)",
              // @ts-expect-error -- inline CSS custom property for ring colour
              "--tw-ring-color": "var(--focus-ring-color)",
            }}
          >
            {item.q}
          </AccordionTrigger>
          <AccordionContent
            className="!pb-5 pr-6 text-base"
            style={{
              color: "var(--color-ink-700)",
              lineHeight: "var(--leading-relaxed)",
              maxWidth: "65ch",
            }}
          >
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
