import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about.metadata')

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      'VexNexa',
      'WCAG',
      'accessibility',
      'website scan',
      'EU hosting',
    ],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      url: 'https://vexnexa.com/about',
      siteName: 'VexNexa',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
    alternates: {
      canonical: 'https://vexnexa.com/about',
    },
  }
}

function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://vexnexa.com/#organization',
        name: 'VexNexa',
        url: 'https://vexnexa.com',
        logo: 'https://vexnexa.com/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@vexnexa.com',
          contactType: 'customer service',
          areaServed: 'WORLDWIDE',
          availableLanguage: ['nl', 'en', 'fr'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'VexNexa',
        applicationCategory: 'WebApplication',
        description: 'WCAG accessibility scanning and reporting tool',
        url: 'https://vexnexa.com',
        creator: { '@id': 'https://vexnexa.com/#organization' },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          description: 'Free weekly scan available',
        },
      },
      {
        '@type': 'WebSite',
        name: 'VexNexa',
        url: 'https://vexnexa.com',
        publisher: { '@id': 'https://vexnexa.com/#organization' },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function AboutPage() {
  const t = await getTranslations('about')

  return (
    <>
      <JsonLd />

      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        {t('skipLink')}
      </a>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 sm:py-20">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                {t('hero.title')}
              </h1>
              <p className="mt-4 text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Trust chips */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  [t('hero.badges.euHosting'), 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
                  [t('hero.badges.axeCore'), 'M13 10V3L4 14h7v7l9-11h-7z'],
                  [t('hero.badges.pdfWordExport'), 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
                ].map(([label, d], i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-elegant ring-1 ring-border/50"
                  >
                    <svg
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d as string} />
                    </svg>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-primary-foreground gradient-primary shadow-elegant hover:shadow-soft transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={t('hero.cta.startFreeScanAriaLabel')}
                >
                  {t('hero.cta.startFreeScan')}
                  <svg className="ml-2 h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-foreground bg-card hover:bg-secondary shadow-elegant hover:shadow-soft ring-1 ring-border/50 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={t('hero.cta.viewPricingAriaLabel')}
                >
                  {t('hero.cta.viewPricing')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Why we exist */}
        <div>
          <section className="py-12 sm:py-16 bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground pb-2 border-b border-muted">
                  {t('whyWeExist.title')}
                </h2>
                <div className="prose prose-lg max-w-none [&_p]:leading-relaxed [&_p]:my-5">
                  <p className="text-muted-foreground">
                    {t('whyWeExist.paragraph1')}
                  </p>
                  <p className="text-muted-foreground">
                    {t('whyWeExist.paragraph2')}
                  </p>
                  <p className="text-muted-foreground">
                    {t('whyWeExist.paragraph3')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* What makes us different */}
          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">{t('whatMakesUsDifferent.title')}</h2>
                <p className="mt-3 text-xl text-muted-foreground">{t('whatMakesUsDifferent.subtitle')}</p>
              </div>

              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    key: 'vexnexaQuality',
                    iconBg: 'bg-primary/10',
                    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                  },
                  {
                    key: 'actionableReports',
                    iconBg: 'bg-success/10',
                    iconPath: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4',
                  },
                  {
                    key: 'smartPrioritization',
                    iconBg: 'bg-warning/10',
                    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
                  },
                  {
                    key: 'transparentSecure',
                    iconBg: 'bg-primary/10',
                    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                  },
                  {
                    key: 'teamworkFeatures',
                    iconBg: 'bg-success/10',
                    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                  },
                ].map((f, i) => (
                  <div key={i} className="bg-card rounded-2xl p-8 shadow-elegant ring-1 ring-border/50 interactive-hover">
                    <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-lg ${f.iconBg}`}>
                      <svg className="h-6 w-6 text-foreground" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.iconPath} />
                      </svg>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">{t(`whatMakesUsDifferent.features.${f.key}.title`)}</h3>
                    <p className="text-muted-foreground">{t(`whatMakesUsDifferent.features.${f.key}.description`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* How it works */}
          <section className="py-12 sm:py-16 bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">{t('howItWorks.title')}</h2>
                <p className="mt-2 text-xl text-muted-foreground">{t('howItWorks.subtitle')}</p>
              </div>

              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                  { key: 'scan', n: '1', bg: 'gradient-primary', fg: 'text-primary-foreground' },
                  { key: 'understand', n: '2', bg: 'bg-success', fg: 'text-success-foreground' },
                  { key: 'improve', n: '3', bg: 'bg-warning', fg: 'text-warning-foreground' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${s.bg}`}>
                      <span className={`text-2xl font-bold ${s.fg}`}>{s.n}</span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-foreground mb-3">{t(`howItWorks.steps.${s.key}.title`)}</h3>
                    <p className="text-lg text-muted-foreground">{t(`howItWorks.steps.${s.key}.description`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Results */}
          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">{t('results.title')}</h2>
                <p className="mt-2 text-xl text-muted-foreground">{t('results.subtitle')}</p>
              </div>

              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {['lessTime', 'lessFalsePositives', 'conversionPotential'].map((kpi, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl font-bold text-primary">{t(`results.kpis.${kpi}.value`)}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">{t(`results.kpis.${kpi}.label`)}</div>
                    <div className="text-muted-foreground">{t(`results.kpis.${kpi}.description`)}</div>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground italic">
                {t('results.disclaimer')}
              </p>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Security & trust */}
          <section className="py-12 sm:py-16 bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground text-center">
                  {t('securityTrust.title')}
                </h2>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{t('securityTrust.euDataPrivacy.title')}</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      {['hosting', 'tls', 'dataMinimization'].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t(`securityTrust.euDataPrivacy.items.${item}`)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{t('securityTrust.transparencyControl.title')}</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      {['ownership', 'exports', 'updates'].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t(`securityTrust.transparencyControl.items.${item}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Values & team */}
          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">{t('valuesTeam.title')}</h2>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                  {['quality', 'clarity', 'respect', 'responsibility'].map((value, i) => (
                    <div key={i}>
                      <div className="text-2xl font-bold text-primary">{t(`valuesTeam.values.${value}.title`)}</div>
                      <div className="text-muted-foreground">{t(`valuesTeam.values.${value}.description`)}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="mt-10 max-w-3xl mx-auto text-left border-l-4 border-primary pl-6">
                  <p className="text-2xl font-medium text-foreground italic">
                    "{t('valuesTeam.quote')}"
                  </p>
                </blockquote>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* FAQ */}
          <section className="py-12 sm:py-16 bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground text-center">
                  {t('faq.title')}
                </h2>

                <div className="mt-8 space-y-6">
                  {['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((q, i) => (
                    <div key={i} className="rounded-2xl bg-muted/30 p-6">
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">{t(`faq.questions.${q}.question`)}</h3>
                      <p className="text-muted-foreground">{t(`faq.questions.${q}.answer`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Final CTA */}
          <section className="py-12 sm:py-16 gradient-primary">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-foreground">
                  {t('finalCta.title')}
                </h2>
                <p className="mt-3 text-xl text-primary-foreground/90 max-w-3xl mx-auto">
                  {t('finalCta.subtitle')}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-primary bg-card hover:bg-secondary shadow-elegant hover:shadow-soft transition-all ring-1 ring-border/50 focus:outline-none focus:ring-2 focus:ring-card focus:ring-offset-2 focus:ring-offset-primary"
                    aria-label={t('finalCta.cta.startFreeScanAriaLabel')}
                  >
                    {t('finalCta.cta.startFreeScan')}
                    <svg className="ml-2 h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-primary-foreground bg-transparent hover:bg-white/10 transition-all ring-2 ring-primary-foreground/30 hover:ring-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-card focus:ring-offset-2 focus:ring-offset-primary"
                    aria-label={t('finalCta.cta.viewPricingAriaLabel')}
                  >
                    {t('finalCta.cta.viewPricing')}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Footer disclaimer */}
          <section className="py-8 bg-muted/30">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('footerDisclaimer.billing')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('footerDisclaimer.questions')}{' '}
                <a href={`mailto:${t('footerDisclaimer.email')}`} className="text-primary hover:underline">
                  {t('footerDisclaimer.email')}
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
