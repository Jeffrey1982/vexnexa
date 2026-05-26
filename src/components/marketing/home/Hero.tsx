"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const severities = [
  { key: "Critical", count: 3, token: "critical", label: "severityCritical" },
  { key: "Serious", count: 8, token: "serious", label: "severitySerious" },
  { key: "Moderate", count: 14, token: "moderate", label: "severityModerate" },
  { key: "Minor", count: 6, token: "minor", label: "severityMinor" },
] as const;

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden px-5 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      style={{
        background:
          "linear-gradient(135deg, #F7F6F1 0%, #ECEEE6 44%, #D9E6DE 100%)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#A3B7A9] to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-28 top-20 h-80 w-80 rounded-full bg-[#C9A450]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-8 h-72 w-72 rounded-full bg-[#1F4A2D]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
        <div className="max-w-2xl">
          <Badge
            variant="trust"
            className="mb-6 inline-flex rounded-full border border-[#B8D0BF] bg-[#E6F0E9] px-3 py-1.5 text-xs font-medium text-[#143521]"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("badge")}
          </Badge>

          <h1
            id="hero-heading"
            className="font-sans text-[clamp(2.75rem,5.4vw,5.6rem)] font-semibold leading-[0.92] tracking-normal text-[#0D1210]"
          >
            {t("headline")}
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#4F5953] sm:text-xl">
            {t("subhead")}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="min-h-12 rounded-lg bg-[#0D1210] px-7 text-base text-[#F8F7F2] shadow-[0_18px_40px_-22px_rgba(13,18,16,0.85)] hover:bg-[#1F4A2D]"
            >
              <Link href="/auth/register">
                {t("ctaPrimary")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 rounded-lg border-[#AAB2A9] bg-[#FBFAF6]/75 px-7 text-base text-[#0D1210] hover:border-[#1F4A2D] hover:bg-[#FBFAF6]"
            >
              <Link href="/sample-report">{t("ctaSecondary")}</Link>
            </Button>
          </div>

          <div className="mt-10 hidden max-w-xl gap-3 sm:grid sm:grid-cols-3">
            <ProofPill icon={FileCheck2} label="WCAG 2.2 AA" value="Audit evidence" />
            <ProofPill icon={Sparkles} label="AI vision" value="Context checks" />
            <ProofPill icon={CheckCircle2} label="+8" value="This month" />
          </div>
        </div>

        <div className="relative">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

function ProofPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCheck2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#C9CEC6] bg-[#FBFAF6]/70 px-3.5 py-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#143521]">
        <Icon className="h-4 w-4 text-[#C08E2D]" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#657068]">{value}</p>
    </div>
  );
}

function ProductPreview() {
  const t = useTranslations("hero");

  return (
    <figure className="relative mx-auto w-full max-w-3xl lg:mx-0">
      <figcaption className="sr-only">
        VexNexa report and scan result preview
      </figcaption>

      <div className="absolute -left-4 top-8 z-10 hidden rounded-lg border border-[#D5C28A] bg-[#FFF7D7] px-3 py-2 text-xs font-semibold text-[#6A4A08] shadow-lg sm:block">
        Audit-ready PDF
      </div>

      <div className="overflow-hidden rounded-xl border border-[#BFC8BF] bg-[#FDFCF8] shadow-[0_34px_90px_-42px_rgba(15,20,18,0.65)]">
        <div className="flex items-center gap-3 border-b border-[#DCDDD6] bg-[#F2F1EA] px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D9D6C9]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D9D6C9]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D9D6C9]" />
          </div>
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-[#657068]">
            vexnexa.com/report/example-agency
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#143521]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Live
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-[#E2E2DB] p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-[#0D1210]">example-agency.nl</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-[#657068]">
                  WCAG 2.2 AA
                </p>
              </div>
              <span className="rounded-full bg-[#DDEADF] px-2.5 py-1 text-xs font-semibold text-[#143521]">
                {t("scanCardDelta")}
              </span>
            </div>

            <div className="mb-4 flex items-end gap-2">
              <span className="font-sans text-6xl font-semibold leading-none text-[#0D1210]">
                72
              </span>
              <span className="pb-1 text-sm text-[#657068]">
                {t("scanCardScore")}
              </span>
            </div>

            <div
              className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#E6E4DC]"
              aria-hidden="true"
            >
              <div className="h-full w-[72%] rounded-full bg-[#1F4A2D]" />
            </div>

            <div className="grid grid-cols-2 gap-2" aria-label={t("scanCardLabel")}>
              {severities.map((severity) => (
                <div
                  key={severity.key}
                  className="rounded-md px-3 py-2.5 text-center"
                  style={{
                    background: `var(--color-${severity.token}-bg)`,
                    color: `var(--color-${severity.token}-fg)`,
                  }}
                >
                  <p className="text-xl font-semibold leading-tight">{severity.count}</p>
                  <p className="mt-1 text-xs font-medium leading-tight">
                    {t(severity.label)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] bg-[#ECEBE3] p-3 sm:min-h-[440px]">
            <Image
              src="/Screenshot1.png"
              alt="VexNexa accessibility report preview with compliance score, WCAG standard, and issue summary"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 92vw"
              className="object-cover object-top"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FDFCF8] to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <p className="mt-5 text-center font-mono text-xs uppercase tracking-[0.18em] text-[#657068]">
        {t("trustLabel")}
      </p>
    </figure>
  );
}
