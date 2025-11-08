import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Over TutusPorta - WCAG Toegankelijkheidsscans door VexNexa',
  description:
    'TutusPorta: WCAG-scans zonder ruis — duidelijke prioriteiten, concrete fixes en meetbare kwaliteit. EU-hosting, axe-core ruleset.',
  keywords: [
    'TutusPorta',
    'VexNexa',
    'WCAG',
    'toegankelijkheid',
    'accessibility',
    'website scan',
    'EU hosting',
  ],
  openGraph: {
    title: 'Over TutusPorta - WCAG Toegankelijkheidsscans door VexNexa',
    description:
      'Toegankelijkheid zonder ruis — duidelijke prioriteiten, concrete fixes, meetbare kwaliteit. EU-hosting, axe-core ruleset.',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://tutusporta.com/about',
    siteName: 'TutusPorta',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Over TutusPorta - WCAG Toegankelijkheidsscans door VexNexa',
    description:
      'Toegankelijkheid zonder ruis — duidelijke prioriteiten, concrete fixes, meetbare kwaliteit.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/about',
  },
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
        logo: 'https://tutusporta.com/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'info@vexnexa.com',
          contactType: 'customer service',
          areaServed: 'NL',
          availableLanguage: ['nl', 'en'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'TutusPorta',
        applicationCategory: 'WebApplication',
        description: 'WCAG accessibility scanning and reporting tool',
        url: 'https://tutusporta.com',
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
        name: 'TutusPorta',
        url: 'https://tutusporta.com',
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

export default function AboutPage() {
  return (
    <>
      <JsonLd />

      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        Ga naar hoofdinhoud
      </a>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 sm:py-20">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Over TutusPorta — onderdeel van VexNexa
              </h1>
              <p className="mt-4 text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                We maken toegankelijkheid werkbaar voor drukke teams. Minder ruis, meer echte verbeteringen met duidelijke prioriteiten en concrete fixes.
              </p>

              {/* Trust chips */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  ['EU-hosting', 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
                  ['axe-core ruleset', 'M13 10V3L4 14h7v7l9-11h-7z'],
                  ['PDF/Word export', 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
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
                  aria-label="Start je eerste gratis WCAG-scan"
                >
                  Start gratis scan
                  <svg className="ml-2 h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-foreground bg-card hover:bg-secondary shadow-elegant hover:shadow-soft ring-1 ring-border/50 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Bekijk prijzen"
                >
                  Bekijk prijzen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Waarom we bestaan */}
        <div>
          <section className="py-12 sm:py-16 bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground pb-2 border-b border-muted">
                  Waarom we bestaan
                </h2>
                <div className="prose prose-lg max-w-none [&_p]:leading-relaxed [&_p]:my-5">
                  <p className="text-muted-foreground">
                    Teams verdrinken vaak in rapporten vol ruis: technische termen, vage verwijzingen en weinig houvast. Ondertussen groeit de druk: strengere wetgeving, gebruikers met uiteenlopende behoeften en het simpele feit dat toegankelijke sites beter presteren.
                  </p>
                  <p className="text-muted-foreground">
                    TutusPorta draait dat om. We laten precies zien wat er mis is, wat prioriteit heeft en hoe je het oplost — zodat het team vandaag kan beginnen.
                  </p>
                  <p className="text-muted-foreground">
                    Toegankelijkheid hoeft niet complex te voelen. Het moet vooral praktisch, begrijpelijk en actiegericht zijn.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Wat ons anders maakt */}
          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">Wat ons anders maakt</h2>
                <p className="mt-3 text-xl text-muted-foreground">Vijf redenen waarom teams voor TutusPorta kiezen</p>
              </div>

              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: 'VexNexa-kwaliteit',
                    body:
                      'Regelsets afgestemd op axe-core + onze filtering. Minder ruis, meer echte issues met gebruikersimpact.',
                    iconBg: 'bg-primary/10',
                    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                  },
                  {
                    title: 'Actiegerichte rapporten',
                    body:
                      'Geen jargon — wel concrete stappen, codevoorbeelden en context per issue.',
                    iconBg: 'bg-success/10',
                    iconPath:
                      'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4',
                  },
                  {
                    title: 'Slimme prioritering',
                    body:
                      'Critical, Serious, Moderate, Minor — begin waar de impact het grootst is.',
                    iconBg: 'bg-warning/10',
                    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
                  },
                  {
                    title: 'Transparant & veilig',
                    body:
                      'EU-hosting (bijv. eu-central), TLS overal, dataminimalisatie. Je data blijft van jou.',
                    iconBg: 'bg-primary/10',
                    iconPath:
                      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                  },
                  {
                    title: 'Teamwork features',
                    body:
                      'Deelbare links, exports naar PDF/Word, duidelijke progressie. Iedereen blijft aangehaakt.',
                    iconBg: 'bg-success/10',
                    iconPath:
                      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                  },
                ].map((f, i) => (
                  <div key={i} className="bg-card rounded-2xl p-8 shadow-elegant ring-1 ring-border/50 interactive-hover">
                    <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-lg ${f.iconBg}`}>
                      <svg className="h-6 w-6 text-foreground" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.iconPath} />
                      </svg>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">{f.title}</h3>
                    <p className="text-muted-foreground">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Hoe het werkt */}
          <section className="py-12 sm:py-16 bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">Hoe het werkt</h2>
                <p className="mt-2 text-xl text-muted-foreground">Van onduidelijkheid naar actieplan in drie stappen</p>
              </div>

              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                  {
                    n: '1',
                    title: 'Scan',
                    copy:
                      'Voer een URL in. De engine controleert tegen WCAG 2.2 AA en markeert direct de echte issues.',
                    bg: 'gradient-primary',
                    fg: 'text-primary-foreground',
                  },
                  {
                    n: '2',
                    title: 'Begrijp',
                    copy:
                      'Overzichtelijk rapport met prioriteiten, uitleg, impact en voorbeelden — klaar voor je backlog.',
                    bg: 'bg-success',
                    fg: 'text-success-foreground',
                  },
                  {
                    n: '3',
                    title: 'Verbeter',
                    copy:
                      'Exporteer, deel en los gestructureerd op. Volg voortgang en zie het effect op gebruikers.',
                    bg: 'bg-warning',
                    fg: 'text-warning-foreground',
                  },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${s.bg}`}>
                      <span className={`text-2xl font-bold ${s.fg}`}>{s.n}</span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-foreground mb-3">{s.title}</h3>
                    <p className="text-lg text-muted-foreground">{s.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Resultaten */}
          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">Resultaten die tellen</h2>
                <p className="mt-2 text-xl text-muted-foreground">Wat teams bereiken met TutusPorta</p>
              </div>

              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { value: '75%', label: 'Minder tijd aan scans', sub: 'Gefocuste rapportage en prioriteiten' },
                  { value: '60%', label: 'Minder false positives', sub: 'Slimmere filtering, minder ruis' },
                  { value: '25%', label: 'Conversie-potentieel', sub: 'Toegankelijke sites presteren beter' },
                ].map((kpi, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl font-bold text-primary">{kpi.value}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">{kpi.label}</div>
                    <div className="text-muted-foreground">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground italic">
                * Indicatief; resultaten variëren per site en implementatie.
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
                  Security & vertrouwen
                </h2>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">EU-data & privacy</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Hosting in EU-regio (bijv. eu-central)
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        TLS overal, sterke wachtwoordhashing
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Dataminimalisatie + automatische opschoning
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Transparantie & controle</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Jij blijft eigenaar van je data
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Volledige exports en audit-trails
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Regelmatige updates met nieuwe WCAG/axe-regels
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Waarden & team */}
          <section className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">Onze waarden & team</h2>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    ['Kwaliteit', 'Geen shortcuts — alleen werkende oplossingen'],
                    ['Duidelijkheid', 'Complexe zaken simpel uitgelegd'],
                    ['Respect', 'Voor alle gebruikers en hun behoeften'],
                    ['Verantwoordelijkheid', 'Toegankelijkheid is ieders taak'],
                  ].map(([title, sub], i) => (
                    <div key={i}>
                      <div className="text-2xl font-bold text-primary">{title}</div>
                      <div className="text-muted-foreground">{sub}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="mt-10 max-w-3xl mx-auto text-left border-l-4 border-primary pl-6">
                  <p className="text-2xl font-medium text-foreground italic">
                    “Toegankelijkheid is geen vinkje — het is productvakmanschap. Het gaat over respect voor alle mensen die je product willen gebruiken.”
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
                  Veelgestelde vragen
                </h2>

                <div className="mt-8 space-y-6">
                  {[
                    [
                      'Betekent een scan volledige WCAG-compliance?',
                      'Nee. Geautomatiseerde checks dekken de automatisch testbare criteria. Handmatige controles blijven nodig. TutusPorta vangt wel het merendeel van de veelvoorkomende issues.',
                    ],
                    [
                      'Kan ik meerdere pagina’s of sites scannen?',
                      'Ja. Afhankelijk van je plan kun je meerdere pagina’s per scan opnemen. Site-wide crawling (beta) vindt automatisch subpagina’s.',
                    ],
                    [
                      'Kan ik rapporten delen met team of klanten?',
                      'Zeker. Elk rapport heeft een deelbare link en export naar PDF/Word — handig voor presentaties en audits.',
                    ],
                    [
                      'Hoe zit het met privacy en databeveiliging?',
                      'We scannen alleen publiek toegankelijke content en slaan geen persoonsinhoud op. EU-hosting, TLS en dataminimalisatie.',
                    ],
                    [
                      'Waarom factureert VexNexa?',
                      'TutusPorta is een product van VexNexa. Contracten, facturatie en support lopen via VexNexa voor heldere verantwoordelijkheden.',
                    ],
                    [
                      'Kan ik TutusPorta gratis proberen?',
                      'Ja. Je krijgt wekelijks één gratis scan. Registratie vereist; geen creditcard nodig.',
                    ],
                  ].map(([q, a], i) => (
                    <div key={i} className="rounded-2xl bg-muted/30 p-6">
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">{q}</h3>
                      <p className="text-muted-foreground">{a}</p>
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
                  Maak je site vandaag toegankelijker
                </h2>
                <p className="mt-3 text-xl text-primary-foreground/90 max-w-3xl mx-auto">
                  Begin met een gratis scan en zie direct welke verbeteringen de meeste impact hebben.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-primary bg-card hover:bg-secondary shadow-elegant hover:shadow-soft transition-all ring-1 ring-border/50 focus:outline-none focus:ring-2 focus:ring-card focus:ring-offset-2 focus:ring-offset-primary"
                    aria-label="Start je eerste gratis WCAG-scan"
                  >
                    Start gratis scan
                    <svg className="ml-2 h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-primary-foreground bg-transparent hover:bg-white/10 transition-all ring-2 ring-primary-foreground/30 hover:ring-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-card focus:ring-offset-2 focus:ring-offset-primary"
                    aria-label="Bekijk prijsplannen"
                  >
                    Bekijk prijzen
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Footer disclaimer */}
          <section className="py-8 bg-muted/30">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
              <p className="text-sm text-muted-foreground">
                Facturatie verloopt via VexNexa. TutusPorta is een product van VexNexa.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Vragen? Mail{' '}
                <a href="mailto:info@vexnexa.com" className="text-primary hover:underline">
                  info@vexnexa.com
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
