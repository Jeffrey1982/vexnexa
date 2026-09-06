"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown, MessageSquare, ArrowRight } from "lucide-react";
import Link from "@/components/marketing/MarketingLink";
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
  className?: string;
}

function isSafeAnswerHref(href: string): boolean {
  if (/[\s\\\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;

  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

/** Support the simple links used in FAQ translations without interpreting HTML. */
function renderAnswer(answer: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]\n]+)\]\(([^)\n]+)\)/g;
  let lastIndex = 0;

  for (const match of answer.matchAll(linkPattern)) {
    const index = match.index ?? 0;
    parts.push(answer.slice(lastIndex, index));
    const [, label, href] = match;
    parts.push(
      isSafeAnswerHref(href) ? (
        <Link
          key={index}
          href={href}
          className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {label}
        </Link>
      ) : (
        match[0]
      ),
    );
    lastIndex = index + match[0].length;
  }

  parts.push(answer.slice(lastIndex));
  return parts;
}

export function FAQ({ items, title, description, className }: FAQProps) {
  const t = useTranslations("faq");
  const headingId = useId();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <section
        className={cn("bg-background py-20 sm:py-24", className)}
        aria-labelledby={headingId}
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-14">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t("eyebrow")}
                </p>
                <h2
                  id={headingId}
                  className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                >
                  {title ?? t("title")}
                </h2>
                {description && (
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
                <div className="mt-8 border-t border-border pt-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
                    {t("contactCard.title")}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("contactCard.body")}
                  </p>
                  <Link
                    href="/contact"
                    className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-primary/60 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                  >
                    {t("contactCard.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="border-t border-border">
                {items.map((item, index) => (
                  <details
                    key={index}
                    className="group border-b border-border"
                  >
                    <summary
                      className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 [&::-webkit-details-marker]:hidden"
                    >
                      <span className="text-base font-semibold leading-relaxed sm:text-lg">
                        {item.question}
                      </span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="max-w-prose pb-7 pr-8 text-base leading-7 text-muted-foreground">
                      {renderAnswer(item.answer)}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
