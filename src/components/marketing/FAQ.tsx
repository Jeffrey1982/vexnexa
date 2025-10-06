"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  description?: string;
}

export function FAQ({ items, title = "Frequently Asked Questions", description }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-muted/30" aria-labelledby="faq-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="faq-heading" className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {title}
            </h2>
            {description && (
              <p className="text-xl text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden bg-background shadow-sm"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-semibold text-lg pr-8">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-primary transition-transform flex-shrink-0",
                      openIndex === index && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openIndex === index ? "max-h-96" : "max-h-0"
                  )}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                >
                  <div className="px-6 py-5 text-muted-foreground leading-relaxed border-t">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
