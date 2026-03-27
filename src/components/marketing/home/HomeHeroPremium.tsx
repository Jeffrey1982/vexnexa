"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";
import VexnexaLogo from "@/components/brand/VexnexaLogo";
import { cn } from "@/lib/utils";

export function HomeHeroPremium() {
  const t = useTranslations("home.hero");
  const reduceMotion = useReducedMotion();
  const trust = [t("trust1"), t("trust2"), t("trust3")] as string[];
  const fade = (delay = 0) =>
    reduceMotion
      ? ({ initial: false } as const)
      : ({
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
        } as const);

  return (
    <section
      className="relative overflow-hidden border-b border-border/40 bg-[#F8FAFC] dark:bg-background"
      aria-labelledby="home-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-[#00C4A0]/12 blur-3xl dark:bg-primary/15" />
        <div className="absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-[#0A2540]/8 blur-3xl dark:bg-[#0A2540]/25" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,hsl(var(--background))_88%)] dark:opacity-40" />
      </div>

      <div className="container relative mx-auto px-4 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <motion.div className="mb-8 flex justify-center lg:justify-start" {...fade(0)}>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <VexnexaLogo size={40} className="shrink-0" />
              </div>
            </motion.div>

            <motion.p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#0A2540]/80 dark:text-primary/90"
              {...fade(0.04)}
            >
              {t("eyebrow")}
            </motion.p>

            <motion.h1
              id="home-hero-heading"
              className="text-balance font-display text-4xl font-bold tracking-tight text-[#0A2540] dark:text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
              {...fade(0.08)}
            >
              {t("title")}{" "}
              <span className="bg-gradient-to-r from-[#00C4A0] to-[#0A2540] bg-clip-text text-transparent dark:from-[#2DD4BF] dark:to-white">
                {t("titleHighlight")}
              </span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:text-xl"
              {...fade(0.12)}
            >
              {t("subtitle")}
            </motion.p>

            <motion.p
              className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground lg:mx-0"
              {...fade(0.14)}
            >
              {t("freeTier")}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
              {...fade(0.18)}
            >
              <Button
                size="lg"
                className="h-12 rounded-xl bg-[#0f766e] px-8 text-base font-semibold text-white shadow-lg shadow-[#0A2540]/15 transition hover:bg-[#115e59] focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 dark:bg-primary dark:hover:bg-primary/90"
                asChild
              >
                <Link
                  href="/auth/register"
                  onClick={() =>
                    trackEvent("homepage_cta_primary_click", { location: "hero" })
                  }
                >
                  {t("ctaPrimary")}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-2 border-[#0A2540]/15 bg-white/90 px-8 text-base font-medium text-[#0A2540] backdrop-blur-sm hover:border-[#00C4A0]/50 hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 dark:border-white/15 dark:bg-transparent dark:text-foreground dark:hover:bg-white/5"
                asChild
              >
                <Link
                  href="/sample-report"
                  onClick={() => trackEvent("homepage_cta_sample_report_click")}
                >
                  {t("ctaSecondary")}
                </Link>
              </Button>
            </motion.div>

            <motion.ul
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 lg:justify-start"
              {...fade(0.22)}
            >
              {trust.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-[#0f766e] dark:text-primary"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
            {...(reduceMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.98, y: 12 },
                  animate: { opacity: 1, scale: 1, y: 0 },
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
                })}
          >
            <div
              className={cn(
                "relative rounded-[1.75rem] border border-border/50 bg-white/70 p-3 shadow-[0_32px_64px_-24px_rgba(10,37,64,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]"
              )}
              role="img"
              aria-label={t("mockupAria")}
            >
              <div className="overflow-hidden rounded-2xl border border-border/30 bg-muted/30 dark:border-white/10">
                <Image
                  src="/Screenshot1.png"
                  alt=""
                  width={1200}
                  height={800}
                  className="aspect-[4/3] w-full object-cover object-top"
                  sizes="(min-width: 1024px) 560px, 100vw"
                  priority
                />
              </div>
              <div
                className="pointer-events-none absolute -bottom-6 -right-4 hidden w-[52%] rounded-xl border border-border/60 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:block dark:border-white/10 dark:bg-[hsl(var(--card))]/95"
                aria-hidden="true"
              >
                <div className="mb-2 flex items-center gap-2 border-b border-border/40 pb-2">
                  <span className="h-2 w-2 rounded-full bg-[#00C4A0]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    White-label
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-[75%] rounded bg-[#0A2540]/10 dark:bg-white/10" />
                  <div className="h-2 w-1/2 rounded bg-[#0A2540]/8 dark:bg-white/10" />
                  <div className="h-2 w-[66%] rounded bg-[#00C4A0]/20" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
