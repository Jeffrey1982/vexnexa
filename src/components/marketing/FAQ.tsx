"use client";

import { useState } from "react";
import { ChevronDown, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
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

export function FAQ({
  items,
  title = "Frequently Asked Questions",
  description,
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="bg-white py-20 dark:bg-[#0A0F1E] sm:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-14">
            {/* Heading + supporting CTA — fills the left column so the
                section no longer renders as a narrow centered list. */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                FAQ
              </p>
              <h2
                id="faq-heading"
                className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-white/70">
                  {description}
                </p>
              )}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
                  Niet gevonden wat je zoekt?
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/65">
                  Onze enterprise-experts beantwoorden compliance- en
                  integratievragen direct.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  Neem contact op <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:hover:bg-white/[0.05]"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-primary transition-transform",
                        openIndex === index && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      openIndex === index ? "max-h-96" : "max-h-0",
                    )}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <div className="border-t border-slate-200 px-5 py-4 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:text-white/70">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
