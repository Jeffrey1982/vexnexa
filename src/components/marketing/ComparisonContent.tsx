"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Check } from "lucide-react";

interface ComparisonContentProps {
  competitor: "accessibe" | "siteimprove";
  otherHref: string;
  otherLabel: string;
}

export function ComparisonContent({ competitor, otherHref, otherLabel }: ComparisonContentProps) {
  const t = useTranslations("comparison");
  const c = (key: string) => t(`${competitor}.${key}`);

  const reasons = [
    { title: c("r1Title"), body: c("r1Body") },
    { title: c("r2Title"), body: c("r2Body") },
    { title: c("r3Title"), body: c("r3Body") },
  ];

  const strengths = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`shared.s${n}Title`),
    body: t(`shared.s${n}Body`),
  }));

  const faqs = [
    { q: c("faq.q1"), a: c("faq.a1") },
    { q: c("faq.q2"), a: c("faq.a2") },
    { q: c("faq.q3"), a: c("faq.a3") },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-5">
              {c("hero.badge")}
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight lg:text-5xl">
              {c("hero.title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground lg:text-xl">{c("hero.subtitle")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  {t("shared.ctaButton")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sample-report">{t("shared.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + reasons */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <p className="text-muted-foreground leading-relaxed">{c("intro")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {reasons.map((r) => (
              <Card key={r.title} className="h-full">
                <CardContent className="pt-6">
                  <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* VexNexa strengths */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t("shared.strengthsTitle")}
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-x-8 gap-y-6 sm:grid-cols-2">
            {strengths.map((s) => (
              <div key={s.title} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">
              {t("shared.reasonsTitle")}
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link href={otherHref} className="font-medium text-primary hover:underline">
                {otherLabel} →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="font-display text-3xl font-bold tracking-tight">{t("shared.ctaTitle")}</h2>
            <p className="text-lg opacity-90">{t("shared.ctaSubtitle")}</p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                {t("shared.ctaButton")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
