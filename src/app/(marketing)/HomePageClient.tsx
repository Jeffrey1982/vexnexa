"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { FAQ } from "@/components/marketing/FAQ";
import { trackEvent } from "@/lib/analytics-events";
import { useTranslations } from "next-intl";
import { Hero } from "@/components/marketing/home/Hero";
import { VisibilityHook } from "@/components/marketing/home/VisibilityHook";
import { EnterpriseTrustBar } from "@/components/marketing/home/EnterpriseTrustBar";
import { EnterpriseFeatures } from "@/components/marketing/home/EnterpriseFeatures";
import { EnterpriseConversionPanel } from "@/components/marketing/home/EnterpriseConversionPanel";
import { LatestBlogSection } from "@/components/marketing/home/LatestBlogSection";

// JSON-LD structured data
function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://vexnexa.com/#organization",
        name: "VexNexa",
        description: "White-label WCAG monitoring for agencies and EU-facing teams. Scan websites, catch regressions, deliver branded reports.",
        url: "https://vexnexa.com",
        logo: "https://vexnexa.com/brand/vexnexa-v-mark.png",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          url: "https://vexnexa.com/contact",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://vexnexa.com/#website",
        name: "VexNexa",
        url: "https://vexnexa.com",
        publisher: {
          "@id": "https://vexnexa.com/#organization",
        },
        inLanguage: ["en", "nl", "de", "fr", "es", "pt"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://vexnexa.com/#software",
        name: "VexNexa",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://vexnexa.com",
        description: "Continuous WCAG monitoring, accessibility reports, and regression alerts for agencies and compliance teams.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          description: "Free accessibility scan available",
        },
      },
    ],
  };

  return (
    <script
      id="home-organization-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Final CTA — closing conversion band after the FAQ
function FinalCTASection() {
  const t = useTranslations('home.finalCta');
  return (
    <section className="py-20 gradient-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-10 left-10 w-32 h-32 border border-primary-foreground/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-primary-foreground/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-primary-foreground/15 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            {t('title')}
          </h2>
          <p className="text-xl leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-xl bg-background text-primary shadow-soft hover:bg-muted py-4 px-8 text-base transition-all hover:-translate-y-0.5"
              asChild
            >
              <Link
                href="/auth/register"
                onClick={() => trackEvent("homepage_cta_primary_click", { location: "final" })}
              >
                {t('ctaPrimary')}
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-xl bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground py-4 px-8 text-base transition-all hover:-translate-y-0.5"
              asChild
            >
              <Link href="/pricing">
                {t('ctaSecondary')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main Page Component
export default function HomePageClient() {
  useEffect((): void => {
    if (typeof window === 'undefined') return;

    const hash: string = window.location.hash;
    if (!hash) return;

    const hashParams: URLSearchParams = new URLSearchParams(hash.substring(1));
    const type: string | null = hashParams.get('type');
    const accessToken: string | null = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      window.location.replace(`/auth/reset-password${hash}`);
    }
  }, []);

  const t = useTranslations('home.faqSection');
  const faqItems = [
    { question: t('q1.question'), answer: t('q1.answer') },
    { question: t('q2.question'), answer: t('q2.answer') },
    { question: t('q3.question'), answer: t('q3.answer') },
    { question: t('q4.question'), answer: t('q4.answer') },
    { question: t('q5.question'), answer: t('q5.answer') },
    { question: t('q6.question'), answer: t('q6.answer') },
  ];

  return (
    <>
      <JsonLd />
      <div className="vn-enterprise-theme bg-background text-foreground antialiased">
        <Hero />
        <EnterpriseTrustBar />
        <VisibilityHook />
        <EnterpriseFeatures />
        <EnterpriseConversionPanel />
        <LatestBlogSection />

        {/* FAQ kept for SEO + CRO */}
        <FAQ items={faqItems} />

        <FinalCTASection />
      </div>
    </>
  );
}
