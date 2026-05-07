"use client";

import { useState } from "react";
import { ChevronDown, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

export function FAQ({ items, title, description }: FAQProps) {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="bg-background py-20 sm:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-14">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t("eyebrow")}
              </p>
              <h2
                id="faq-heading"
                className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              >
                {title ?? t("title")}
              </h2>
              {description && (
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
              <div className="mt-6 rounded-2xl border border-border bg-muted/60 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
                  {t("contactCard.title")}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("contactCard.body")}
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  {t("contactCard.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/30"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="text-base font-semibold text-foreground sm:text-lg">
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
                    <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
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
