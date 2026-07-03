import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, ScanSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl, resolveMarketingLocale, type MarketingLocale } from "@/lib/marketing-seo";

const path = "/digitale-toegankelijkheid-audit";
const namespace = "seoPages.accessibilityAudit";

type TextPair = { title: string; description: string };
type FaqItem = { question: string; answer: string };

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = resolveMarketingLocale(h.get("x-vn-locale"));
  const t = await getTranslations(namespace);
  const title = t("meta.title");
  const description = t("meta.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description: t("meta.ogDescription"),
      url: localizedUrl(locale, path),
      type: "website",
    },
  };
}

function JsonLd({ locale, title, intro }: { locale: MarketingLocale; title: string; intro: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: title,
          serviceType: "Digital accessibility audit",
          provider: { "@type": "Organization", name: "VexNexa", url: "https://vexnexa.com" },
          areaServed: "EU",
          url: localizedUrl(locale, path),
          description: intro,
        }),
      }}
    />
  );
}

export default async function AccessibilityAuditPage() {
  const h = await headers();
  const locale = resolveMarketingLocale(h.get("x-vn-locale"));
  const t = await getTranslations(namespace);
  const sections = t.raw("sections") as TextPair[];
  const useCases = t.raw("useCases") as string[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <>
      <JsonLd locale={locale} title={t("title")} intro={t("intro")} />
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline">{t("badge")}</Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight lg:text-6xl">{t("title")}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact?intent=accessibility-audit">
                  {t("primary")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sample-report">{t("secondary")}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {sections.map(({ title, description }, index) => {
              const Icon = [ScanSearch, ClipboardCheck, FileText][index];
              return (
                <Card key={title}>
                  <CardContent className="space-y-4 pt-6">
                    <Icon className="h-8 w-8 text-primary" />
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-y bg-muted py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <ShieldCheck className="mb-4 h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{t("useCasesTitle")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold">{t("faqTitle")}</h2>
          <div className="mt-8 space-y-6">
            {faq.map(({ question, answer }) => (
              <div key={question}>
                <h3 className="font-semibold">{question}</h3>
                <p className="mt-2 text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
