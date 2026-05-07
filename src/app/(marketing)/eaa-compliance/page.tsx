import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EaaFaq, type EaaFaqItem } from "@/components/marketing/eaa/EaaFaq";

const PAGE_URL = "https://vexnexa.com/eaa-compliance";

// ---------------------------------------------------------------------------
// Metadata + JSON-LD
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("eaaCompliance.meta");

  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "European Accessibility Act",
      "EAA compliance",
      "EAA handhaving Nederland",
      "WCAG 2.2 audit EU",
      "EAA deadline webshop",
      "EAA boete niet-naleving",
      "EN 301 549",
      "WCAG 2.1 AA",
    ],
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "article",
      url: PAGE_URL,
      siteName: "VexNexa",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    alternates: {
      canonical: PAGE_URL,
      languages: {
        en: PAGE_URL,
        nl: PAGE_URL,
        de: PAGE_URL,
        fr: PAGE_URL,
        es: PAGE_URL,
        pt: PAGE_URL,
        "x-default": PAGE_URL,
      },
    },
  };
}

interface FaqStructured {
  q: string;
  a: string;
}
interface BreadcrumbCrumbs {
  home: string;
  compliance: string;
  current: string;
}

function JsonLd({
  title,
  description,
  faqItems,
  breadcrumb,
}: {
  title: string;
  description: string;
  faqItems: FaqStructured[];
  breadcrumb: BreadcrumbCrumbs;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        author: { "@type": "Organization", name: "VexNexa" },
        publisher: {
          "@type": "Organization",
          name: "VexNexa",
          logo: {
            "@type": "ImageObject",
            url: "https://vexnexa.com/brand/vexnexa-v-mark.png",
          },
        },
        datePublished: "2026-05-06",
        dateModified: today,
        mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
        url: PAGE_URL,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: breadcrumb.home,
            item: "https://vexnexa.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: breadcrumb.compliance,
            item: "https://vexnexa.com/compliance",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: breadcrumb.current,
            item: PAGE_URL,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ---------------------------------------------------------------------------
// Section helpers (kept inline to avoid creating shared components that would
// conflict with Codex's parallel rebrand work — per the brief).
// ---------------------------------------------------------------------------

const SECTION_PADDING = "py-10 sm:py-16";
const CONTAINER = "mx-auto w-full max-w-[var(--container-max)] px-6";
const PROSE_MAX = "max-w-[65ch]";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function EaaCompliancePage() {
  const t = await getTranslations("eaaCompliance");

  // Pull arrays/lists eagerly so we can pass them to client components and to
  // the JSON-LD builder without re-translating.
  const inScope = t.raw("whoMustComply.inScope") as string[];
  const exempt = t.raw("whoMustComply.exempt") as string[];
  const failures = t.raw("wcagBaseline.failures") as string[];
  const steps = t.raw("roadmap.steps") as { title: string; body: string }[];
  const blocks = t.raw("solution.blocks") as {
    title: string;
    body: string;
    linkLabel: string;
    linkHref: string;
  }[];
  const countries = t.raw("penalties.countries") as { country: string; body: string }[];
  const faqItems = t.raw("faq.items") as EaaFaqItem[];

  return (
    <article style={{ background: "var(--color-surface-base)" }}>
      <JsonLd
        title={t("meta.title")}
        description={t("meta.description")}
        faqItems={faqItems}
        breadcrumb={{
          home: t("breadcrumb.home"),
          compliance: t("breadcrumb.compliance"),
          current: t("breadcrumb.current"),
        }}
      />

      {/* ============================================================
           Section 1 — Hero
         ============================================================ */}
      <section
        aria-labelledby="eaa-hero-heading"
        className="px-6 pb-10 pt-12 sm:pt-16"
        style={{
          background:
            "linear-gradient(180deg, var(--color-surface-warm) 0%, var(--color-surface-base) 100%)",
        }}
      >
        <div className={`${CONTAINER} flex flex-col items-center text-center`}>
          <Badge
            variant="trust"
            className="mb-5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("hero.badge")}
          </Badge>

          <h1
            id="eaa-hero-heading"
            className="mb-4 max-w-[820px] font-medium"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-hero)",
              letterSpacing: "var(--tracking-hero)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("hero.headline")}
          </h1>

          <p
            className="mb-7 max-w-[640px] text-base font-normal"
            style={{
              color: "var(--color-ink-500)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            {t("hero.subhead")}
          </p>

          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              asChild
              variant="rebrandPrimary"
              size="lg"
              className="min-h-11 rounded-md px-5"
            >
              <Link href="/auth/register">
                {t("hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="rebrandSecondary"
              size="lg"
              className="min-h-11 rounded-md px-5"
            >
              <a href="#what-is">{t("hero.ctaSecondary")}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
           Section 2 — What is the EAA
         ============================================================ */}
      <section
        id="what-is"
        aria-labelledby="eaa-whatis-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-base)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-whatis-heading"
            className="mb-6"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("whatIs.heading")}
          </h2>

          <div
            className={`${PROSE_MAX} space-y-5`}
            style={{ color: "var(--color-ink-700)", lineHeight: "var(--leading-relaxed)" }}
          >
            <p>{t("whatIs.p1")}</p>
            <p>{t("whatIs.p2")}</p>
            <p>{t("whatIs.p3")}</p>
          </div>

          <blockquote
            className="my-8 rounded-lg p-6"
            style={{
              background: "var(--color-brand-primary-light)",
              borderLeft: "4px solid var(--color-brand-primary)",
              color: "var(--color-brand-primary-dark)",
              maxWidth: "720px",
            }}
          >
            <p className="text-lg font-medium">{t("whatIs.pullQuote")}</p>
            <cite
              className="mt-2 block text-sm not-italic"
              style={{ color: "var(--color-ink-700)" }}
            >
              — {t("whatIs.pullQuoteSource")}
            </cite>
          </blockquote>

          <p
            className={`${PROSE_MAX} text-sm italic`}
            style={{ color: "var(--color-ink-500)" }}
          >
            {t("whatIs.citation")}
          </p>
        </div>
      </section>

      {/* ============================================================
           Section 3 — Who must comply (two-column)
         ============================================================ */}
      <section
        aria-labelledby="eaa-whocomply-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-warm)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-whocomply-heading"
            className="mb-4"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("whoMustComply.heading")}
          </h2>
          <p
            className={`${PROSE_MAX} mb-8`}
            style={{
              color: "var(--color-ink-700)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {t("whoMustComply.intro")}
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              style={{
                background: "var(--color-surface-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <CardContent className="p-6 sm:p-7">
                <h3
                  className="mb-4 flex items-center gap-2 text-base font-semibold"
                  style={{ color: "var(--color-ink-900)" }}
                >
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: "var(--color-brand-primary)" }}
                    aria-hidden="true"
                  />
                  {t("whoMustComply.inScopeTitle")}
                </h3>
                <ul
                  className="space-y-3 pl-0"
                  style={{
                    color: "var(--color-ink-700)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  {inScope.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--color-brand-primary)" }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card
              style={{
                background: "var(--color-surface-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <CardContent className="p-6 sm:p-7">
                <h3
                  className="mb-4 flex items-center gap-2 text-base font-semibold"
                  style={{ color: "var(--color-ink-900)" }}
                >
                  <AlertTriangle
                    className="h-4 w-4"
                    style={{ color: "var(--color-serious-fg)" }}
                    aria-hidden="true"
                  />
                  {t("whoMustComply.exemptTitle")}
                </h3>
                <ul
                  className="space-y-3 pl-0"
                  style={{
                    color: "var(--color-ink-700)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  {exempt.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--color-ink-300)" }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <p
            className="mt-6 max-w-[820px] text-sm"
            style={{ color: "var(--color-ink-500)" }}
          >
            {t("whoMustComply.footnote")}
          </p>
        </div>
      </section>

      {/* ============================================================
           Section 4 — Penalties
         ============================================================ */}
      <section
        aria-labelledby="eaa-penalties-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-base)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-penalties-heading"
            className="mb-6"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("penalties.heading")}
          </h2>

          <div
            className={`${PROSE_MAX} space-y-5`}
            style={{ color: "var(--color-ink-700)", lineHeight: "var(--leading-relaxed)" }}
          >
            <p>{t("penalties.p1")}</p>
            <p>{t("penalties.p2")}</p>
          </div>

          <h3
            className="mb-4 mt-10 text-lg font-semibold"
            style={{ color: "var(--color-ink-900)" }}
          >
            {t("penalties.subhead")}
          </h3>

          <dl className="grid gap-5 lg:grid-cols-3">
            {countries.map((country, i) => (
              <div
                key={i}
                className="rounded-lg p-5"
                style={{
                  background: "var(--color-surface-warm)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <dt
                  className="mb-2 text-base font-semibold"
                  style={{ color: "var(--color-ink-900)" }}
                >
                  {country.country}
                </dt>
                <dd
                  className="text-sm"
                  style={{
                    color: "var(--color-ink-700)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  {country.body}
                </dd>
              </div>
            ))}
          </dl>

          <p
            className={`${PROSE_MAX} mt-8 text-sm italic`}
            style={{ color: "var(--color-ink-500)" }}
          >
            {t("penalties.disclaimer")}
          </p>
        </div>
      </section>

      {/* ============================================================
           Section 5 — WCAG 2.1 AA baseline
         ============================================================ */}
      <section
        aria-labelledby="eaa-wcag-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-warm)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-wcag-heading"
            className="mb-6"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("wcagBaseline.heading")}
          </h2>

          <div
            className={`${PROSE_MAX} space-y-5`}
            style={{ color: "var(--color-ink-700)", lineHeight: "var(--leading-relaxed)" }}
          >
            <p>{t("wcagBaseline.p1")}</p>
            <p>{t("wcagBaseline.p2")}</p>
          </div>

          <h3
            className="mb-4 mt-10 text-lg font-semibold"
            style={{ color: "var(--color-ink-900)" }}
          >
            {t("wcagBaseline.failuresTitle")}
          </h3>
          <ul
            className="grid gap-3 sm:grid-cols-2"
            style={{
              color: "var(--color-ink-700)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {failures.map((failure, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md p-3"
                style={{
                  background: "var(--color-surface-base)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--color-brand-primary)" }}
                />
                <span className="text-sm">{failure}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================
           Section 6 — Compliance roadmap
         ============================================================ */}
      <section
        aria-labelledby="eaa-roadmap-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-base)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-roadmap-heading"
            className="mb-8"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("roadmap.heading")}
          </h2>

          <ol className="space-y-8 pl-0" style={{ counterReset: "step-counter" }}>
            {steps.map((step, i) => (
              <li
                key={i}
                className="relative flex gap-5 pl-0"
                style={{ counterIncrement: "step-counter" }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-medium"
                  style={{
                    background: "var(--color-brand-primary)",
                    color: "#ffffff",
                  }}
                >
                  {i + 1}
                </span>
                <div className={PROSE_MAX}>
                  <h3
                    className="mb-2 text-lg font-semibold"
                    style={{ color: "var(--color-ink-900)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--color-ink-700)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Inline CTA card */}
          <div
            className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg p-6 sm:flex-row sm:items-center"
            style={{
              background: "var(--color-brand-primary-light)",
              border: "1px solid var(--color-brand-primary)",
            }}
          >
            <div className="max-w-[640px]">
              <p
                className="mb-1 text-base font-semibold"
                style={{ color: "var(--color-brand-primary-dark)" }}
              >
                {t("roadmap.ctaCardTitle")}
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-ink-700)" }}
              >
                {t("roadmap.ctaCardBody")}
              </p>
            </div>
            <Button
              asChild
              variant="rebrandPrimary"
              size="lg"
              className="min-h-11 shrink-0 rounded-md px-5"
            >
              <Link href="/auth/register">
                {t("roadmap.ctaCardLink")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
           Section 7 — VexNexa as the solution
         ============================================================ */}
      <section
        aria-labelledby="eaa-solution-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-warm)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-solution-heading"
            className="mb-8"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("solution.heading")}
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {blocks.map((block, i) => (
              <div
                key={i}
                className="flex h-full flex-col rounded-lg p-6"
                style={{
                  background: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <h3
                  className="mb-2 text-base font-semibold"
                  style={{ color: "var(--color-ink-900)" }}
                >
                  {block.title}
                </h3>
                <p
                  className="mb-4 flex-1 text-sm"
                  style={{
                    color: "var(--color-ink-700)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  {block.body}
                </p>
                <Link
                  href={block.linkHref}
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: "var(--color-brand-primary-dark)",
                    // @ts-expect-error -- inline CSS custom property for ring colour
                    "--tw-ring-color": "var(--focus-ring-color)",
                  }}
                >
                  {block.linkLabel}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
           Section 8 — FAQ (Radix Accordion, client island)
         ============================================================ */}
      <section
        aria-labelledby="eaa-faq-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-surface-base)" }}
      >
        <div className={CONTAINER}>
          <h2
            id="eaa-faq-heading"
            className="mb-6"
            style={{
              color: "var(--color-ink-900)",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("faq.heading")}
          </h2>
          <EaaFaq items={faqItems} />
        </div>
      </section>

      {/* ============================================================
           Section 9 — Final CTA (dark proof block)
         ============================================================ */}
      <section
        aria-labelledby="eaa-finalcta-heading"
        className={SECTION_PADDING}
        style={{ background: "var(--color-ink-900)" }}
      >
        <div className={`${CONTAINER} flex flex-col items-center text-center`}>
          <h2
            id="eaa-finalcta-heading"
            className="mb-4 max-w-[820px]"
            style={{
              color: "#ffffff",
              fontSize: "var(--font-size-h1)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {t("finalCta.heading")}
          </h2>
          <p
            className="mb-7 max-w-[560px] text-base"
            style={{
              color: "#d5d5ce",
              lineHeight: "var(--leading-normal)",
            }}
          >
            {t("finalCta.subhead")}
          </p>
          <Button
            asChild
            variant="rebrandPrimary"
            size="lg"
            className="min-h-12 rounded-md px-6"
          >
            <Link href="/auth/register">
              {t("finalCta.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </article>
  );
}
