import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2, FileSearch, Gauge, ListChecks, MonitorCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl, resolveMarketingLocale, type MarketingLocale } from "@/lib/marketing-seo";

const path = "/website-toegankelijkheid-testen";
const namespace = "seoPages.websiteTesting";

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
          "@type": "WebApplication",
          name: title,
          applicationCategory: "Accessibility Testing",
          operatingSystem: "Web",
          url: localizedUrl(locale, path),
          description: intro,
        }),
      }}
    />
  );
}

export default async function WebsiteAccessibilityTestPage() {
  const h = await headers();
  const locale = resolveMarketingLocale(h.get("x-vn-locale"));
  const t = await getTranslations(namespace);
  const cards = t.raw("cards") as TextPair[];
  const tests = t.raw("tests") as string[];

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
                <Link href="/free-scan">
                  {t("primary")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/digitale-toegankelijkheid-audit">{t("secondary")}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {cards.map(({ title, description }, index) => {
              const Icon = [FileSearch, Gauge, MonitorCheck][index];
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
            <ListChecks className="h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{t("testsTitle")}</h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
