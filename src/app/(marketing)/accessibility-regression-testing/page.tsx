import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BellRing, GitBranch, LineChart, ListChecks, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl, resolveMarketingLocale, type MarketingLocale } from "@/lib/marketing-seo";

const path = "/accessibility-regression-testing";
const namespace = "seoPages.regressionTesting";

type TextPair = { title: string; description: string };

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
          "@type": "SoftwareApplication",
          name: title,
          applicationCategory: "QualityAssuranceApplication",
          operatingSystem: "Web",
          url: localizedUrl(locale, path),
          description: intro,
        }),
      }}
    />
  );
}

export default async function AccessibilityRegressionTestingPage() {
  const h = await headers();
  const locale = resolveMarketingLocale(h.get("x-vn-locale"));
  const t = await getTranslations(namespace);
  const cards = t.raw("cards") as TextPair[];
  const workflow = t.raw("workflow") as string[];

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
                <Link href="/contact?intent=regression-testing">
                  {t("primary")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/accessibility-monitoring-agencies">{t("secondary")}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {cards.map(({ title, description }, index) => {
              const Icon = [GitBranch, BellRing, LineChart][index];
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
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{t("workflowTitle")}</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {workflow.map((item, index) => (
              <div key={item} className="rounded-lg bg-background p-5">
                <ListChecks className="mb-3 h-6 w-6 text-primary" />
                <div className="text-sm font-semibold">0{index + 1}</div>
                <div className="mt-1">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
