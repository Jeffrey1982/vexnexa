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
import { ArrowRight, Globe, FileCheck2, ShieldCheck } from "lucide-react";

export function GovernmentContent() {
  const t = useTranslations("governmentPage");

  const capabilities = [
    { icon: Globe, title: t("capabilities.c1Title"), body: t("capabilities.c1Body") },
    { icon: FileCheck2, title: t("capabilities.c2Title"), body: t("capabilities.c2Body") },
    { icon: ShieldCheck, title: t("capabilities.c3Title"), body: t("capabilities.c3Body") },
  ];

  const steps = [
    { title: t("how.s1Title"), body: t("how.s1Body") },
    { title: t("how.s2Title"), body: t("how.s2Body") },
    { title: t("how.s3Title"), body: t("how.s3Body") },
  ];

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-5">
              {t("hero.badge")}
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/free-scan">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sample-report">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Obligation */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t("obligation.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
              {t("obligation.title")}
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">{t("obligation.p1")}</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">{t("obligation.p2")}</p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t("capabilities.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("capabilities.subtitle")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {capabilities.map((c) => (
              <Card key={c.title} className="h-full">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">{t("how.title")}</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">
              {t("faq.title")}
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="font-display text-3xl font-bold tracking-tight">{t("cta.title")}</h2>
            <p className="text-lg opacity-90">{t("cta.subtitle")}</p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/free-scan">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
