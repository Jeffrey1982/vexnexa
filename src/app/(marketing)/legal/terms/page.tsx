import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Scale, Mail, Calendar, AlertTriangle, ListTree } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Terms of Service - VexNexa',
  description:
    'Read VexNexa terms of service: usage terms, payments, liability and service conditions.',
  keywords: [
    'algemene voorwaarden',
    'terms of service',
    'usage terms',
    'service conditions',
    'liability',
  ],
  openGraph: {
    title: 'Terms of Service - VexNexa',
    description:
      'Read VexNexa terms of service: usage terms, payments, liability and service conditions.',
    url: 'https://vexnexa.com/legal/terms',
    siteName: 'VexNexa',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service - VexNexa',
    description:
      'Read VexNexa terms of service: usage terms, payments, liability and service conditions.',
  },
  alternates: {
    canonical: 'https://vexnexa.com/legal/terms',
    languages: { 'nl-NL': 'https://vexnexa.com/legal/terms' },
  },
  robots: { index: true, follow: true },
}

const lastUpdated = 'December 8, 2024'
const policyVersion = 'v1.1'

const sections = [
  { id: 'toepassing', label: '1. Definities & toepasselijkheid' },
  { id: 'gebruik', label: '2. Gebruik van de service' },
  { id: 'api', label: '3. API & fair use' },
  { id: 'betalingen', label: '4. Betalingen & abonnementen' },
  { id: 'beschikbaarheid', label: '5. Beschikbaarheid & support' },
  { id: 'ip', label: '6. Intellectueel eigendom' },
  { id: 'liability', label: '7. Garanties & liability' },
  { id: 'privacy', label: '8. Privacy & gegevensbescherming' },
  { id: 'beindiging', label: '9. Beëindiging' },
  { id: 'recht', label: '10. Toepasselijk recht & geschillen' },
  { id: 'wijzigingen', label: '11. Wijzigingen & slotbepalingen' },
  { id: 'contact', label: '12. Contact' },
]

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');
  const tc = await getTranslations('legal.common');

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        Skip to main content
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
            Back to homepage
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {tc('lastUpdated')}: {t('lastUpdated')}
            </Badge>
            <Badge variant="secondary" aria-label={`Policy version ${policyVersion}`}>
              {policyVersion}
            </Badge>
          </div>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t('description')}
          </p>

          {/* Summary */}
          <div className="mt-8">
            <Card className="border-warning/30 bg-warning/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Scale className="h-5 w-5" aria-hidden="true" />
                  {t('summary.title')}
                </CardTitle>
                <CardDescription>{t('summary.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('summary.mayTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                    <li>{t('summary.mayItems.0')}</li>
                    <li>{t('summary.mayItems.1')}</li>
                    <li>{t('summary.mayItems.2')}</li>
                    <li>{t('summary.mayItems.3')}</li>
                  </ul>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('summary.notAllowedTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                    <li>{t('summary.notAllowedItems.0')}</li>
                    <li>{t('summary.notAllowedItems.1')}</li>
                    <li>{t('summary.notAllowedItems.2')}</li>
                  </ul>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground border-t pt-3">
                    <AlertTriangle className="inline h-4 w-4 mr-1" aria-hidden="true" />
                    {t('summary.byUsing')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content + Aside */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div
          className={[
            'prose prose-slate max-w-none',
            '[&_h2]:mt-14 [&&_h2]:mb-5 [&&_h2]:scroll-mt-24',
            '[&_h3]:mt-9  [&&_h3]:mb-3',
            '[&_ul]:my-5 [&&_ul>li]:my-2 [&&_ol]:my-5 [&&_ol>li]:my-2 leading-relaxed',
            '[&_h2]:pb-2 [&&_h2]:border-b [&&_h2]:border-muted',
          ].join(' ')}
        >
          {/* helper dividers */}
          {/* 1 */}
          <section id="toepassing">
            <h2>1. Definities & toepasselijkheid</h2>
            <h3>Definities</h3>
            <ul>
              <li><strong>VexNexa</strong>: de accessibility-scanning service op vexnexa.com.</li>
              <li><strong>Wij/Ons</strong>: de verwerkingsverantwoordelijke en dienstverlener (VexNexa B.V.).</li>
              <li><strong>Gebruiker</strong>: iedere natuurlijke of rechtspersoon die de service gebruikt.</li>
              <li><strong>Account</strong>: your personal or business access to functions and history.</li>
              <li><strong>Scan</strong>: een geautomatiseerde test van een webpagina op toegankelijkheid.</li>
              <li><strong>API</strong>: programming interface for automated access to the service.</li>
            </ul>
            <h3>Toepasselijkheid</h3>
            <p>
              These terms apply to all use of VexNexa, including free and paid accounts, the API,
              proefperiodes en alle bijbehorende communicatie. Afwijkingen zijn alleen geldig indien schriftelijk overeengekomen.
            </p>
            <div className="not-prose mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Juridische gegevens (dienstverlener)</p>
              <p className="text-sm text-muted-foreground">
                <strong>Business Type:</strong> Sole proprietorship (Eenmanszaak) <br />
                <strong>Address:</strong> Gagarinstraat 28, 1562TB Krommenie, Netherlands <br />
                <strong>Chamber of Commerce:</strong> 94848262 &nbsp; <strong>Establishment Number:</strong> 000060294744 <br />
                <strong>E-mail:</strong> <a className="text-primary hover:underline" href="mailto:legal@vexnexa.com">legal@vexnexa.com</a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="gebruik">
            <h2>2. Gebruik van de service</h2>
            <h3>Toegestaan gebruik</h3>
            <ul>
              <li>Scanning websites you own or have demonstrable permission for</li>
              <li>Interne en klantprojecten (rapporten delen is toegestaan)</li>
              <li>Education/research and commercial use within your bundle limits</li>
            </ul>
            <h3>Verboden gebruik</h3>
            <ul>
              <li>Scans op sites zonder toestemming van de eigenaar of beheerder</li>
              <li>Omzeilen van rate-limits, DDoS-achtig gedrag, scraping van persoonsgegevens</li>
              <li>Reverse-engineering, kopiëren of herverpakken van onze software of output als eigen tool</li>
              <li>Gebruik in strijd met wet- en regelgeving (o.a. auteursrecht, privacy, computercriminaliteit)</li>
            </ul>
            <h3>Account & beveiliging</h3>
            <ul>
              <li>Beheer je inloggegevens zorgvuldig; elke activiteit onder je account wordt aan jou toegerekend</li>
              <li>Meld misbruik of vermoeden van een datalek direct via <a href="mailto:security@vexnexa.com">security@vexnexa.com</a></li>
              <li>Wij mogen accounts tijdelijk blokkeren bij vermoeden van misbruik of veiligheidsrisico’s</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="api">
            <h2>3. API & fair use</h2>
            <p>
              API-toegang is beschikbaar voor geschikte abonnementen. We hanteren fair-use en technische limieten
              (verzoeken per minuut/dag, gelijktijdige jobs). Details staan in je dashboard.
            </p>
            <ul>
              <li>API-sleutels zijn persoonlijk; delen of open-sourcen is niet toegestaan</li>
              <li>Resultaten mogen in je eigen tooling worden getoond, mits bronvermelding “VexNexa” bij geautomatiseerde rapportage</li>
              <li>Wijzigingen aan endpoints of limieten kunnen zonder voorafgaande kennisgeving plaatsvinden bij misbruik of storingen</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="betalingen">
            <h2>4. Betalingen & abonnementen</h2>
            <h3>Gratis tier (Trial)</h3>
            <ul>
              <li>De gratis Trial blijft gratis met vaste maandelijkse limieten (100 pagina&apos;s/maand, 1 website)</li>
              <li><strong>Harde limiet:</strong> Bij overschrijding van het gratis gebruik wordt de service geblokkeerd tot de volgende maand of totdat je upgrade naar een betaald plan</li>
              <li>Trial verloopt na de aangegeven periode; upgrade is vereist om de service te blijven gebruiken</li>
              <li>Functies kunnen wijzigen — we communiceren substantiële wijzigingen vooraf</li>
              <li>Geen automatische overage-facturatie; upgrade naar betaald plan voor verdere toegang</li>
            </ul>
            <h3>Betaalde abonnementen</h3>
            <ul>
              <li>Prijzen excl. btw; afrekening via o.a. Mollie (bijv. iDEAL/kaart)</li>
              <li>Prepaid per maand; automatische verlenging</li>
              <li>Opzeggen kan tot de laatste dag van de lopende periode (service loopt door tot einde termijn)</li>
              <li>Mid-cycle upgrades zijn mogelijk; kosten worden pro-rato verrekend</li>
            </ul>
            <h3>Limieten & overage (alleen betaalde plannen)</h3>
            <ul>
              <li><strong>Trial/Gratis:</strong> Harde limiet - service wordt geblokkeerd bij overschrijding. Upgrade vereist voor verdere toegang.</li>
              <li><strong>Betaalde plannen:</strong> Bij overschrijding worden extra scans automatisch gefactureerd (€0.002/pagina, €2/extra site, €1/extra gebruiker per maand)</li>
              <li>Waarschuwingen bij 80% en 100% van je limiet</li>
              <li>Bij consistente overschrijding adviseren we een upgrade naar een hoger plan</li>
            </ul>
            <h3>Restituties & chargebacks</h3>
            <ul>
              <li>Geen restitutie bij voortijdige opzegging, tenzij wettelijk verplicht</li>
              <li>Bij langdurige algemene storing (&gt;48 uur) kan een evenredige creditering worden aangeboden</li>
              <li>Onterechte chargebacks kunnen leiden tot (tijdelijke) blokkade en kosten doorbelasting</li>
            </ul>
            <h3>Consumentenherroeping</h3>
            <p>
              Voor consumenten binnen de EU kan het herroepingsrecht gelden. Door directe levering van de digitale dienst
              binnen de herroepingstermijn kan (na expliciete instemming) het herroepingsrecht vervallen voor de geleverde periode.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="beschikbaarheid">
            <h2>5. Beschikbaarheid & support</h2>
            <h3>SLA & onderhoud</h3>
            <ul>
              <li>We streven naar hoge beschikbaarheid, maar 100% uptime is niet gegarandeerd</li>
              <li>Gepland onderhoud wordt waar mogelijk vooraf aangekondigd</li>
              <li>Externe factoren (firewalls, robots.txt, rate-limits) kunnen scans verhinderen</li>
            </ul>
            <h3>Support</h3>
            <ul>
              <li><strong>Free:</strong> e-mail binnen 72 uur</li>
              <li><strong>Pro:</strong> e-mail binnen 24 uur</li>
              <li><strong>Team:</strong> prioriteit (doorgaans &lt; 4 uur), optioneel telefonisch</li>
            </ul>
            <h3>Wijzigingen</h3>
            <p>We kunnen functies, algoritmes of UI aanpassen; bij materiële impact communiceren we tijdig.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ip">
            <h2>6. Intellectueel eigendom</h2>
            <h3>Onze rechten</h3>
            <ul>
              <li>Software, algoritmen, UI, merken en documentatie blijven eigendom van ons (en/of licentiegevers)</li>
              <li>Geen overdracht van IP-rechten; alleen beperkte, herroepbare gebruikslicentie</li>
            </ul>
            <h3>Jouw content & rapporten</h3>
            <ul>
              <li>Je behoudt rechten op je eigen websites en materiaal</li>
              <li>Je verleent ons de noodzakelijke licentie om scans uit te voeren en resultaten te tonen</li>
              <li>Rapporten mag je intern en commercieel gebruiken; bronvermelding wordt gewaardeerd maar is niet verplicht</li>
            </ul>
            <h3>Kennisgevingen</h3>
            <p>
              Vermoed je een inbreuk (bijv. onrechtmatig gebruik van je merk)? Mail{' '}
              <a className="text-primary hover:underline" href="mailto:legal@vexnexa.com">legal@vexnexa.com</a>.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 7 */}
          <section id="liability">
            <h2>7. Garanties & liability</h2>
            <h3>Beperkte garantie</h3>
            <ul>
              <li>Scans volgen gangbare methoden (o.a. regels vergelijkbaar met axe-core), maar dekt niet alle WCAG-criteria in alle contexten</li>
              <li>False positives/negatives kunnen voorkomen; menselijke review blijft noodzakelijk</li>
            </ul>
            <h3>Aansprakelijkheidsbeperking</h3>
            <ul>
              <li>Onze totale liability is beperkt tot het bedrag dat je in de laatste 12 maanden hebt betaald</li>
              <li>Geen liability voor indirecte/gevolgschade, winstderving, dataverlies of reputatieschade</li>
              <li>Uitsluitingen gelden niet bij opzet of bewuste roekeloosheid voor zover wettelijk toegestaan</li>
            </ul>
            <h3>Overmacht</h3>
            <ul>
              <li>Geen liability bij gebeurtenissen buiten onze redelijke controle (o.a. storing bij derden, oorlog, natuurrampen, cyberaanval)</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="privacy">
            <h2>8. Privacy & gegevensbescherming</h2>
            <p>
              We verwerken persoonsgegevens conform ons{' '}
              <Link className="text-primary hover:underline" href="/legal/privacy">privacybeleid</Link>.
              Dat beleid maakt integraal deel uit van deze voorwaarden.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="beindiging">
            <h2>9. Beëindiging</h2>
            <h3>Door jou</h3>
            <ul>
              <li>Opzeggen via je account; toegang blijft tot einde factuurperiode</li>
              <li>Je kunt verwijdering van accountdata verzoeken conform het privacybeleid</li>
            </ul>
            <h3>Door ons</h3>
            <ul>
              <li>Bij schending van voorwaarden, misbruik, niet-betaling of veiligheidsrisico’s kunnen we (tijdelijk) beëindigen</li>
              <li>Waar redelijk geven we eerst een waarschuwing en hersteltermijn</li>
            </ul>
            <h3>Gevolgen</h3>
            <ul>
              <li>Toegang vervalt; dataretentie volgt het privacybeleid</li>
              <li>Openstaande bedragen blijven verschuldigd</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="recht">
            <h2>10. Toepasselijk recht & geschillen</h2>
            <h3>Recht</h3>
            <p>Nederlands recht is van toepassing, met uitzondering van conflictregels.</p>
            <h3>Geschillenbeslechting</h3>
            <ol>
              <li>Eerst intern proberen op te lossen: mail <a href="mailto:legal@vexnexa.com">legal@vexnexa.com</a></li>
              <li>Reactietermijn: 30 dagen om een oplossing te vinden</li>
              <li>Bij uitblijven oplossing: bemiddeling (indien beide partijen instemmen)</li>
              <li>Bevoegde rechter: rechtbank Amsterdam</li>
            </ol>
            <h3>Consumentenrechten</h3>
            <p>Consumenten behouden wettelijke rechten die niet contractueel kunnen worden uitgesloten.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="wijzigingen">
            <h2>11. Wijzigingen & slotbepalingen</h2>
            <h3>Wijzigingen</h3>
            <p>
              We kunnen deze voorwaarden aanpassen (bijv. wetgeving, functies, misbruik-preventie). Bij materiële wijzigingen
              informeren we je — doorgaans 30 dagen vooraf. Verder gebruik na ingangsdatum geldt als acceptatie.
            </p>
            <h3>Scheidsclausule & volledige overeenkomst</h3>
            <ul>
              <li>Als een bepaling nietig/ongedaan gemaakt wordt, blijven overige bepalingen van kracht</li>
              <li>We vervangen een nietige bepaling door een geldige bepaling met vergelijkbare strekking</li>
              <li>Deze voorwaarden + privacybeleid vormen de volledige overeenkomst en vervangen eerdere uitingen</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="contact">
            <h2>12. Contact</h2>
            <div className="not-prose rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-medium">Juridische vragen</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                E-mail: <a className="text-primary hover:underline" href="mailto:legal@vexnexa.com">legal@vexnexa.com</a>
              </p>
            </div>
          </section>

          {/* Footer strip */}
          <div className="not-prose mt-12 rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{tc('lastUpdated')}: {t('lastUpdated')}</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/legal/privacy">Privacybeleid</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Vragen? Neem contact op</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Aside */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="h-4 w-4" />
                {tc('onThisPage')}
              </CardTitle>
              <CardDescription>{tc('quickNavigation')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <nav aria-label="Table of contents" className="space-y-2">
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
              <CardTitle className="text-base">{tc('needHelp')}</CardTitle>
              <CardDescription>{tc('responseTime')}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild className="w-full">
                <Link href="/contact">{tc('contactUs')}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
