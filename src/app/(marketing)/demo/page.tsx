import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demo')

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  }
}

export default async function DemoPage() {
  const t = await getTranslations('demo')
  const whatYouGetItems = t.raw('whatYouGet.items') as string[]
  const whoIsThisForItems = t.raw('whoIsThisFor.items') as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/about" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backLink')}
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-6">
              {t('title')} <span className="text-primary">{t('titleHighlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card rounded-xl p-8 shadow-elegant border border-border/50">
              <h2 className="text-2xl font-semibold mb-6">{t('whatYouGet.title')}</h2>
              <ul className="space-y-4">
                {whatYouGetItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-elegant border border-border/50">
              <h2 className="text-2xl font-semibold mb-6">{t('whoIsThisFor.title')}</h2>
              <ul className="space-y-4">
                {whoIsThisForItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center bg-primary/5 rounded-xl p-8 border border-primary/20">
            <h2 className="text-2xl font-semibold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/contact">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('cta.scheduleDemo')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  {t('cta.startFreeScan')}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              {t('additionalInfo')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
