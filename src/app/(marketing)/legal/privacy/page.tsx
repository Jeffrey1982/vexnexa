import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Mail, Calendar, ListTree } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacybeleid - TutusPorta',
  description: 'Lees ons privacybeleid: hoe TutusPorta omgaat met je gegevens, cookies en privacy. GDPR compliant.',
  keywords: ['privacybeleid','privacy policy','GDPR','AVG','data protection','cookies','gegevensbescherming'],
  openGraph: {
    title: 'Privacybeleid - TutusPorta',
    description: 'Lees ons privacybeleid: hoe TutusPorta omgaat met je gegevens, cookies en privacy. GDPR compliant.',
    url: 'https://tutusporta.com/legal/privacy',
    siteName: 'TutusPorta',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'Privacybeleid - TutusPorta',
    description: 'Lees ons privacybeleid: hoe TutusPorta omgaat met je gegevens, cookies en privacy. GDPR compliant.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/legal/privacy',
    languages: { 'nl-NL': 'https://tutusporta.com/legal/privacy' },
  },
  robots: { index: true, follow: true },
}

const lastUpdated = '8 december 2024'
const policyVersion = 'v1.2'

const sections = [
  { id: 'wie-we-zijn', label: '1. Wie we zijn' },
  { id: 'welke-gegevens', label: '2. Welke gegevens we verzamelen' },
  { id: 'rechtsgronden', label: '3. Rechtsgronden (Art. 6 GDPR)' },
  { id: 'cookies', label: '4. Cookies en tracking' },
  { id: 'verwerking-doelen', label: '5. Hoe en waarom we gegevens gebruiken' },
  { id: 'ontvangers', label: '6. Ontvangers en verwerkers' },
  { id: 'doorgifte', label: '7. Doorgifte buiten EU/EER' },
  { id: 'beveiliging', label: '8. Dataopslag, beveiliging & retentie' },
  { id: 'rechten', label: '9. Je rechten (GDPR/AVG)' },
  { id: 'kinderen', label: '10. Kinderen' },
  { id: 'datalek', label: '11. Datalekken' },
  { id: 'automated', label: '12. Geautomatiseerde besluitvorming' },
  { id: 'wijzigingen', label: '13. Wijzigingen in dit beleid' },
  { id: 'contact-klachten', label: '14. Contact & klachten' },
]

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        Ga naar hoofdinhoud
      </a>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative p-6 sm:p-10">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Terug naar startpagina
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Privacybeleid</h1>
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              Laatst bijgewerkt: {lastUpdated}
            </Badge>
            <Badge variant="secondary" aria-label={`Beleidsversie ${policyVersion}`}>
              {policyVersion}
            </Badge>
          </div>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            Hoe TutusPorta omgaat met je persoonlijke gegevens en je privacy beschermt.
          </p>

          {/* Summary strip */}
          <div className="mt-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  Privacy in het kort
                </CardTitle>
                <CardDescription>De belangrijkste punten in één oogopslag.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">✅ Wat we WÉL doen</p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>Alleen publiek toegankelijke pagina&apos;s scannen</li>
                    <li>Data veilig opslaan in de EU</li>
                    <li>Dataminimalisatie & transparantie</li>
                    <li>Heldere rechten en instellingen</li>
                  </ul>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">❌ Wat we NIET doen</p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>Persoonsgegevens uit pagina-inhoud opslaan</li>
                    <li>Data verkopen aan derden</li>
                    <li>Niet-noodzakelijke cookies zonder toestemming</li>
                    <li>Onbeveiligde doorgifte buiten de EU</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content + Aside */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <main
          id="main"
          className={[
            // basis typografie
            'prose prose-slate max-w-none',
            // extra spacing tussen koppen & content
            '[&_h2]:mt-14 [&&_h2]:mb-5 [&&_h2]:scroll-mt-24',
            '[&_h3]:mt-9  [&&_h3]:mb-3',
            // lijsten luchtiger
            '[&_ul]:my-5 [&&_ul>li]:my-2 [&&_ol]:my-5 [&&_ol>li]:my-2 leading-relaxed',
            // subtiele onderstreping onder h2
            '[&_h2]:pb-2 [&&_h2]:border-b [&&_h2]:border-muted',
          ].join(' ')}
        >
          {/* helper: secties scheiden met dunne lijn */}
          const Divider = () =&gt; <div className="h-px bg-border my-10 not-prose" />

          {/* 1 */}
          <section id="wie-we-zijn">
            <h2>1. Wie we zijn</h2>
            <p>
              TutusPorta is een accessibility-scanning service ontwikkeld in Nederland. We helpen website-eigenaren hun sites
              toegankelijker te maken door WCAG-compliance te testen.
            </p>
            <div className="not-prose mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Contactgegevens (verwerkingsverantwoordelijke)</p>
              <p className="text-sm text-muted-foreground">
                <strong>Bedrijfsnaam:</strong> VexNexa B.V. (TutusPorta is onderdeel van VexNexa) <br />
                <strong>Adres:</strong> {/* TODO: bedrijfsadres */} <br />
                <strong>KvK:</strong> {/* TODO */} &nbsp;|&nbsp; <strong>BTW:</strong> {/* TODO */} <br />
                <strong>E-mail:</strong>{' '}
                <a href="mailto:privacy@tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                  privacy@tutusporta.com
                </a>
                {' '}| <strong>Website:</strong>{' '}
                <a href="https://tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                  tutusporta.com
                </a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="welke-gegevens">
            <h2>2. Welke gegevens we verzamelen</h2>

            <h3>Scangegevens</h3>
            <ul>
              <li>URL van de gescande pagina</li>
              <li>Technische metadata over accessibility-issues</li>
              <li>Timestamps van scans</li>
              <li>IP-adres voor rate-limiting en misbruikpreventie</li>
            </ul>
            <p>
              <strong>Belangrijk:</strong> we slaan <u>geen</u> persoonsgegevens uit pagina-inhoud op (zoals namen, e-mails,
              telefoonnummers); we analyseren alleen HTML-structuur en toegankelijkheid.
            </p>

            <h3>Accountgegevens (optioneel)</h3>
            <ul>
              <li>E-mailadres</li>
              <li>Naam (indien opgegeven)</li>
              <li>Gehasht wachtwoord</li>
              <li>Accountvoorkeuren</li>
            </ul>

            <h3>Contact</h3>
            <ul>
              <li>Naam en e-mailadres</li>
              <li>Berichtinhoud</li>
              <li>Timestamp van verzending</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="rechtsgronden">
            <h2>3. Rechtsgronden (Art. 6 GDPR)</h2>
            <ul>
              <li><strong>Uitvoering van overeenkomst</strong> – scans, resultaten, accountbeheer.</li>
              <li><strong>Gerechtvaardigd belang</strong> – beveiliging (rate-limiting, misbruikdetectie), basisverbeteringen.</li>
              <li><strong>Toestemming</strong> – analytics/marketing-cookies en eventuele opt-in communicatie.</li>
              <li><strong>Wettelijke plicht</strong> – bewaarplichten en verzoeken van autoriteiten.</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="cookies">
            <h2>4. Cookies en tracking</h2>

            <h3>Functionele cookies (noodzakelijk)</h3>
            <ul>
              <li>Sessie voor ingelogde gebruikers</li>
              <li>Voorkeuren (taal, thema)</li>
              <li>Cookie-toestemmingsstatus</li>
            </ul>

            <h3>Analytics cookies (optioneel)</h3>
            <p>
              Met toestemming kunnen we privacy-vriendelijke analytics gebruiken (bijv. Vercel Analytics of alternatief).
              We meten geaggregeerde statistieken, geen individuele profielen.
            </p>
            <ul>
              <li>Bezoekersstatistieken (geaggregeerd/anoniem)</li>
              <li>Populaire pagina&apos;s en features</li>
              <li>Technische prestaties</li>
            </ul>
            <p>
              Je kunt toestemming beheren via de{' '}
              <Link href="/legal/cookies#instellingen" className="text-primary underline-offset-4 hover:underline">
                cookie-instellingen
              </Link>.
            </p>

            <h3>UTM-parameters</h3>
            <p>We kunnen UTM-parameters tijdelijk bewaren om herkomst te begrijpen. Deze bevatten geen persoonsgegevens.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="verwerking-doelen">
            <h2>5. Hoe en waarom we gegevens gebruiken</h2>
            <ul>
              <li>Uitvoeren van scans en tonen van resultaten</li>
              <li>Accountbeheer en login</li>
              <li>Klantenservice en support</li>
              <li>Verbetering van de service (met toestemming voor analytics)</li>
              <li>Naleving van wet- en regelgeving</li>
            </ul>
            <p>We verkopen of verhuren je gegevens <strong>niet</strong> aan derden voor marketingdoeleinden.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ontvangers">
            <h2>6. Ontvangers en verwerkers</h2>
            <p>We delen gegevens alleen met dienstverleners die namens ons verwerken onder een verwerkersovereenkomst.</p>
            <ul>
              <li>Hosting & edge: {/* Vercel (EU-regio) */}</li>
              <li>Database & opslag: {/* Supabase (EU project/region) */}</li>
              <li>Betalingen: {/* Mollie B.V. */}</li>
              <li>E-mail/transactioneel: {/* Resend/Postmark/Sendgrid, etc. */}</li>
              <li>Monitoring/logging: {/* partij of “n.v.t.” */}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 7 */}
          <section id="doorgifte">
            <h2>7. Doorgifte buiten EU/EER</h2>
            <p>
              Indien doorgifte buiten de EU plaatsvindt (bijv. edge-routing of supportlogs), gebruiken we passende
              waarborgen zoals EU Standard Contractual Clauses en aanvullende maatregelen.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="beveiliging">
            <h2>8. Dataopslag, beveiliging & retentie</h2>

            <h3>Opslaglocaties</h3>
            <ul>
              <li>Database/compute in EU-datacenters</li>
              <li>Back-ups binnen Europa</li>
            </ul>

            <h3>Beveiligingsmaatregelen</h3>
            <ul>
              <li>TLS/HTTPS end-to-end</li>
              <li>Gehasht wachtwoorden</li>
              <li>Least-privilege toegangsbeheer & monitoring</li>
              <li>Regelmatige patches/updates</li>
              <li>Dataminimalisatie</li>
            </ul>

            <h3>Bewaartermijnen</h3>
            <ul>
              <li>Scan-data: 1 jaar (Free); langer voor betaalde accounts (instelbaar in je account)</li>
              <li>Accountgegevens: tot verwijdering van je account of zolang wettelijk vereist</li>
              <li>Contactberichten: tot 2 jaar</li>
              <li>Analytics: tot 24 maanden (geaggregeerd/anonimiseerd waar mogelijk)</li>
            </ul>
            <p>We verwijderen of anonimiseren eerder wanneer gegevens niet langer nodig zijn, tenzij bewaring wettelijk vereist is.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="rechten">
            <h2>9. Je rechten (GDPR/AVG)</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="font-medium">🔍 Recht op inzage</p>
                <p className="text-sm text-muted-foreground">Opvragen welke gegevens we van je hebben.</p>
                <p className="font-medium">✏️ Rectificatie</p>
                <p className="text-sm text-muted-foreground">Onjuiste gegevens laten corrigeren.</p>
                <p className="font-medium">🗑️ Vergetelheid</p>
                <p className="text-sm text-muted-foreground">Gegevens laten verwijderen.</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">⏸️ Beperking</p>
                <p className="text-sm text-muted-foreground">Verwerking (tijdelijk) beperken.</p>
                <p className="font-medium">📦 Dataportabiliteit</p>
                <p className="text-sm text-muted-foreground">Gegevens in een gangbaar formaat ontvangen.</p>
                <p className="font-medium">❌ Bezwaar</p>
                <p className="text-sm text-muted-foreground">Bezwaar tegen verwerking op basis van gerechtvaardigd belang.</p>
              </div>
            </div>
            <p className="mt-3">
              Je rechten uitoefenen? Mail{' '}
              <a href="mailto:privacy@tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                privacy@tutusporta.com
              </a>. We reageren binnen 30 dagen.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="kinderen">
            <h2>10. Kinderen</h2>
            <p>Niet gericht op kinderen onder 16 jaar. Neem contact op als er toch gegevens zijn verzameld; we verwijderen die.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="datalek">
            <h2>11. Datalekken</h2>
            <p>We onderzoeken direct de impact, beperken risico’s en melden indien vereist aan de Autoriteit Persoonsgegevens en betrokkenen.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="automated">
            <h2>12. Geautomatiseerde besluitvorming</h2>
            <p>We nemen geen besluiten die uitsluitend gebaseerd zijn op geautomatiseerde verwerking met rechtsgevolgen voor jou.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 13 */}
          <section id="wijzigingen">
            <h2>13. Wijzigingen in dit beleid</h2>
            <p>Belangrijke wijzigingen communiceren we via e-mail (indien van toepassing), een melding op de site en update van de datum.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 14 */}
          <section id="contact-klachten">
            <h2>14. Contact & klachten</h2>
            <div className="not-prose rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-medium">Neem contact op</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                E-mail:{' '}
                <a href="mailto:privacy@tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                  privacy@tutusporta.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Of gebruik het{' '}
                <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                  contactformulier
                </Link>.
              </p>
            </div>
            <p className="mt-3">
              Niet tevreden? Dien een klacht in bij de Autoriteit Persoonsgegevens via{' '}
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                className="text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoriteitpersoonsgegevens.nl
              </a>.
            </p>
          </section>

          {/* Footer strip */}
          <div className="not-prose mt-12 rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Laatst bijgewerkt: {lastUpdated}</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/legal/terms">Algemene voorwaarden</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Vragen? Neem contact op</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Aside */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="h-4 w-4" />
                Op deze pagina
              </CardTitle>
              <CardDescription>Snel naar een sectie</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <nav aria-label="Inhoudsopgave" className="space-y-2">
                {sections.map((s) => (
                  <div key={s.id}>
                    <Link
                      href={`#${s.id}`}
                      className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded"
                    >
                      {s.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hulp nodig?</CardTitle>
              <CardDescription>We reageren meestal binnen 1 werkdag.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild className="w-full">
                <Link href="/contact">Contact opnemen</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
