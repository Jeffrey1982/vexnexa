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

const lastUpdated = '27 april 2026'
const policyVersion = 'v1.2'

const sections = [
  { id: 'toepassing', label: '1. Definities & Toepasselijkheid' },
  { id: 'gebruik', label: '2. Gebruik van de dienst' },
  { id: 'api', label: '3. API & Fair Use' },
  { id: 'betalingen', label: '4. Betalingen & Abonnementen' },
  { id: 'beschikbaarheid', label: '5. Beschikbaarheid & Support' },
  { id: 'ip', label: '6. Intellectueel eigendom' },
  { id: 'liability', label: '7. Garanties & Aansprakelijkheid' },
  { id: 'privacy', label: '8. Privacy & Gegevensbescherming' },
  { id: 'beindiging', label: '9. Beëindiging' },
  { id: 'recht', label: '10. Toepasselijk recht & Geschillen' },
  { id: 'wijzigingen', label: '11. Wijzigingen & Slotbepalingen' },
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
        {tc('skipToContent')}
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
            {tc('backToHome')}
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
          {/* 1 */}
          <section id="toepassing">
            <h2>1. Definities & Toepasselijkheid</h2>
            <h3>Definities</h3>
            <ul>
              <li><strong>VexNexa</strong>: de accessibility-scanningdienst onder vexnexa.com.</li>
              <li><strong>Wij/ons</strong>: de verwerkingsverantwoordelijke en dienstverlener (VexNexa B.V.).</li>
              <li><strong>Gebruiker</strong>: iedere natuurlijke of rechtspersoon die de dienst gebruikt.</li>
              <li><strong>Account</strong>: jouw persoonlijke of zakelijke toegang tot functies en geschiedenis.</li>
              <li><strong>Scan</strong>: een geautomatiseerde toegankelijkheidstest van een webpagina.</li>
              <li><strong>API</strong>: programmeerinterface voor geautomatiseerde toegang tot de dienst.</li>
            </ul>
            <h3>Toepasselijkheid</h3>
            <p>
              Deze voorwaarden zijn van toepassing op elk gebruik van VexNexa, inclusief gratis en
              betaalde accounts, de API, proefperiodes en alle daaraan gerelateerde communicatie.
              Afwijkingen zijn alleen geldig indien schriftelijk overeengekomen.
            </p>
            <div className="not-prose mt-5 rounded-lg border bg-muted p-4">
              <p className="font-medium">Juridische gegevens (dienstverlener)</p>
              <p className="text-sm text-muted-foreground">
                <strong>Bedrijfsnaam:</strong> VexNexa B.V. <br />
                <strong>Adres:</strong> Provencialeweg 46B, 1562TB Krommenie, Nederland <br />
                <strong>KvK-nummer:</strong> 94848262 &nbsp; <strong>Vestigingsnummer:</strong> 000060294744 <br />
                <strong>E-mail:</strong>{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="gebruik">
            <h2>2. Gebruik van de dienst</h2>
            <h3>Toegestaan gebruik</h3>
            <ul>
              <li>Scannen van websites die je in eigendom hebt of waarvoor je aantoonbare toestemming hebt</li>
              <li>Interne projecten en klantopdrachten (rapporten delen is toegestaan)</li>
              <li>Educatie/onderzoek en commercieel gebruik binnen de limieten van je abonnement</li>
            </ul>
            <h3>Niet toegestaan</h3>
            <ul>
              <li>Scans op sites zonder toestemming van de eigenaar of beheerder</li>
              <li>Het omzeilen van rate-limits, DDoS-achtig gedrag of het scrapen van persoonsgegevens</li>
              <li>Reverse engineering, kopiëren of herverpakken van onze software of output als eigen product</li>
              <li>Gebruik in strijd met wet- en regelgeving (waaronder auteursrecht, AVG en de Wet computercriminaliteit)</li>
            </ul>
            <h3>Account & beveiliging</h3>
            <ul>
              <li>Beheer je inloggegevens zorgvuldig; alle activiteit onder jouw account wordt aan jou toegerekend</li>
              <li>
                Meld misbruik of een vermoeden van een datalek direct via{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
              </li>
              <li>Bij vermoeden van misbruik of beveiligingsrisico kunnen we accounts tijdelijk blokkeren</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="api">
            <h2>3. API & Fair Use</h2>
            <p>
              API-toegang is beschikbaar voor in aanmerking komende abonnementen. We hanteren fair-use
              en technische limieten (requests per minuut/dag, gelijktijdige jobs). Details vind je in
              je dashboard.
            </p>
            <ul>
              <li>API-sleutels zijn persoonlijk; delen of open-sourcen ervan is niet toegestaan</li>
              <li>Resultaten mogen worden weergegeven in je eigen tooling, mits je &ldquo;VexNexa&rdquo; vermeldt in geautomatiseerde rapportages</li>
              <li>Wijzigingen aan endpoints of limieten kunnen zonder voorafgaande kennisgeving worden doorgevoerd in geval van misbruik of verstoringen</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="betalingen">
            <h2>4. Betalingen & Abonnementen</h2>

            <div className="not-prose my-5 rounded-lg border-l-4 border-primary bg-primary/5 p-4">
              <p className="text-sm">
                <strong>Belangrijk — prijsweergave:</strong> Prijzen op vexnexa.com en in de
                checkout zijn <strong>inclusief 21% BTW</strong>, tenzij expliciet anders vermeld
                voor zakelijke klanten met een geldig BTW-nummer (in dat geval kan de
                BTW-verleggingsregeling of een 0%-tarief van toepassing zijn). Op je factuur wordt
                het BTW-bedrag separaat gespecificeerd.
              </p>
            </div>

            <h3>Gratis (Trial)</h3>
            <ul>
              <li>De gratis Trial blijft gratis met vaste maandelijkse limieten (100 pagina&apos;s per maand, 1 website)</li>
              <li><strong>Harde limiet:</strong> bij overschrijding van het gratis verbruik wordt de dienst geblokkeerd tot de volgende maand of totdat je upgraded naar een betaald plan</li>
              <li>De Trial verloopt na de aangegeven periode; een upgrade is vereist om de dienst te blijven gebruiken</li>
              <li>Functies kunnen wijzigen — substantiële wijzigingen kondigen we vooraf aan</li>
              <li>Er vindt geen automatische overage-facturatie plaats; upgrade naar een betaald plan voor verdere toegang</li>
            </ul>

            <h3>Betaalde abonnementen</h3>
            <ul>
              <li><strong>Prijzen zijn inclusief 21% BTW, tenzij expliciet anders vermeld voor zakelijke klanten.</strong></li>
              <li>
                Betaling verloopt uitsluitend via onze betaaldienstverlener <strong>Mollie B.V.</strong>{' '}
                (Keizersgracht 313, 1016 EE Amsterdam). Beschikbare methoden zijn onder meer iDEAL,
                creditcard en SEPA-incasso. VexNexa slaat zelf geen kaart- of rekeninggegevens op.
              </li>
              <li>Vooruitbetaling per maand of per jaar; automatische verlenging tenzij tijdig opgezegd</li>
              <li>Opzegging is mogelijk tot de laatste dag van de lopende periode (de dienst loopt door tot het einde van de termijn)</li>
              <li>Tussentijdse upgrades zijn mogelijk; kosten worden pro rata verrekend</li>
            </ul>

            <h3>Limieten & Overage (alleen betaalde plannen)</h3>
            <ul>
              <li><strong>Trial/Gratis:</strong> harde limiet — de dienst wordt geblokkeerd bij overschrijding. Een upgrade is vereist voor verdere toegang.</li>
              <li>
                <strong>Betaalde plannen — overage-tarieven (alle bedragen zijn inclusief 21% BTW):</strong>{' '}
                bij overschrijding van limieten worden extra scans automatisch in rekening gebracht
                tegen €0,002 per pagina, €2,00 per extra site per maand, en €1,00 per extra
                gebruiker per maand.
              </li>
              <li>Waarschuwingen volgen bij 80% en 100% van je limiet</li>
              <li>Bij structurele overschrijdingen adviseren we een upgrade naar een hoger plan</li>
            </ul>

            <h3>Restituties & Chargebacks</h3>
            <ul>
              <li>Geen restitutie bij vroegtijdige opzegging, tenzij wettelijk verplicht</li>
              <li>Bij langdurige algehele storing (&gt;48 uur) kan een proportionele creditering worden aangeboden</li>
              <li>Onterechte chargebacks kunnen leiden tot (tijdelijke) blokkering en doorberekening van kosten</li>
            </ul>

            <h3>Herroepingsrecht consument</h3>
            <p>
              Voor consumenten binnen de EU geldt in beginsel een wettelijke bedenktijd van
              <strong> 14 dagen</strong> bij overeenkomsten op afstand (Boek 6, Titel 5, Afdeling 2B BW).
              VexNexa is een digitale dienst die direct na het starten van een scan of het bevestigen
              van een upgrade wordt geleverd.
            </p>
            <p>
              <strong>
                Door een scan te starten of een (upgrade naar een) betaald abonnement te bevestigen,
                geef je uitdrukkelijk toestemming voor onmiddellijke uitvoering van de overeenkomst
                vóór afloop van de bedenktijd, en erken je dat je daarmee voor de betreffende
                facturatieperiode afstand doet van je herroepingsrecht voor de reeds geleverde
                digitale inhoud (artikel 6:230p sub g BW).
              </strong>
            </p>
            <p>
              Voor toekomstige facturatieperiodes blijft het recht bestaan om je abonnement op te
              zeggen vóór de eerstvolgende verlengingsdatum, conform de opzegregels hierboven. De
              afstand van het herroepingsrecht ziet uitsluitend op de reeds geleverde periode.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="beschikbaarheid">
            <h2>5. Beschikbaarheid & Support</h2>
            <h3>SLA & Onderhoud</h3>
            <ul>
              <li>We streven naar hoge beschikbaarheid, maar 100% uptime is niet gegarandeerd</li>
              <li>Gepland onderhoud kondigen we waar mogelijk vooraf aan</li>
              <li>Externe factoren (firewalls, robots.txt, rate-limits) kunnen scans verhinderen</li>
            </ul>
            <h3>Support</h3>
            <ul>
              <li><strong>Free:</strong> e-mail binnen 72 uur</li>
              <li><strong>Pro:</strong> e-mail binnen 24 uur</li>
              <li><strong>Team:</strong> prioriteit (doorgaans &lt; 4 uur), optionele telefonische ondersteuning</li>
            </ul>
            <h3>Wijzigingen</h3>
            <p>We kunnen functies, algoritmes of UI aanpassen; bij materiële impact informeren we tijdig.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ip">
            <h2>6. Intellectueel eigendom</h2>
            <h3>Onze rechten</h3>
            <ul>
              <li>Software, algoritmes, UI, merken en documentatie blijven eigendom van ons (en/of onze licentiegevers)</li>
              <li>Geen overdracht van IE-rechten; uitsluitend een beperkt, herroepbaar gebruiksrecht</li>
            </ul>
            <h3>Jouw content & rapporten</h3>
            <ul>
              <li>Je behoudt de rechten op je eigen websites en materialen</li>
              <li>Je verleent ons de licentie die nodig is om scans uit te voeren en resultaten te tonen</li>
              <li>Rapporten mogen intern en commercieel worden gebruikt; bronvermelding wordt gewaardeerd maar is niet verplicht</li>
            </ul>
            <h3>Meldingen</h3>
            <p>
              Vermoed je een inbreuk (bijvoorbeeld onbevoegd gebruik van je merk)? Mail{' '}
              <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 7 */}
          <section id="liability">
            <h2>7. Garanties & Aansprakelijkheid</h2>
            <h3>Beperkte garantie</h3>
            <ul>
              <li>Scans volgen gangbare methoden (waaronder regels vergelijkbaar met axe-core), maar dekken niet alle WCAG-criteria in alle contexten</li>
              <li>Vals-positieven/negatieven kunnen voorkomen; menselijke review blijft noodzakelijk</li>
            </ul>
            <h3>Beperking van aansprakelijkheid</h3>
            <ul>
              <li>Onze totale aansprakelijkheid is beperkt tot het bedrag dat je in de afgelopen 12 maanden hebt betaald</li>
              <li>Geen aansprakelijkheid voor indirecte/gevolgschade, gederfde winst, gegevensverlies of reputatieschade</li>
              <li>Uitsluitingen gelden niet bij opzet of bewuste roekeloosheid voor zover de wet dit toestaat</li>
            </ul>
            <h3>Overmacht</h3>
            <ul>
              <li>Geen aansprakelijkheid voor gebeurtenissen buiten onze redelijke controle (waaronder storingen bij derden, oorlog, natuurrampen, cyberaanvallen)</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="privacy">
            <h2>8. Privacy & Gegevensbescherming</h2>
            <p>
              We verwerken persoonsgegevens conform ons{' '}
              <Link className="text-primary hover:underline" href="/legal/privacy">privacybeleid</Link>.
              Dat beleid maakt integraal onderdeel uit van deze voorwaarden.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="beindiging">
            <h2>9. Beëindiging</h2>
            <h3>Door jou</h3>
            <ul>
              <li>Opzegging via je account; toegang blijft bestaan tot het einde van de facturatieperiode</li>
              <li>Je kunt verwijdering van accountgegevens aanvragen conform het privacybeleid</li>
            </ul>
            <h3>Door ons</h3>
            <ul>
              <li>Bij schending van de voorwaarden, misbruik, wanbetaling of beveiligingsrisico&apos;s kunnen we (tijdelijk) beëindigen</li>
              <li>Waar redelijk geven we eerst een waarschuwing en herstelperiode</li>
            </ul>
            <h3>Gevolgen</h3>
            <ul>
              <li>Toegang vervalt; gegevensbewaring volgt het privacybeleid</li>
              <li>Openstaande bedragen blijven verschuldigd</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="recht">
            <h2>10. Toepasselijk recht & Geschillen</h2>
            <h3>Recht</h3>
            <p>Op deze overeenkomst is Nederlands recht van toepassing, met uitsluiting van conflictenrechtelijke regels.</p>
            <h3>Geschillenbeslechting</h3>
            <ol>
              <li>
                Eerst proberen we het intern op te lossen: e-mail{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
              </li>
              <li>Reactietermijn: 30 dagen om tot een oplossing te komen</li>
              <li>Komen we er niet uit: mediation (indien beide partijen instemmen)</li>
              <li>Bevoegde rechter: Rechtbank Amsterdam</li>
            </ol>
            <h3>Consumentenrechten</h3>
            <p>Consumenten behouden hun wettelijke rechten die niet contractueel uitgesloten kunnen worden.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="wijzigingen">
            <h2>11. Wijzigingen & Slotbepalingen</h2>
            <h3>Wijzigingen</h3>
            <p>
              We kunnen deze voorwaarden aanpassen (bijvoorbeeld door wetgeving, nieuwe functies of
              misbruikpreventie). Bij materiële wijzigingen informeren we je — doorgaans 30 dagen
              vooraf. Voortgezet gebruik na de ingangsdatum geldt als aanvaarding.
            </p>
            <h3>Deelbaarheid & gehele overeenkomst</h3>
            <ul>
              <li>Indien een bepaling ongeldig of nietig wordt geacht, blijven de overige bepalingen van kracht</li>
              <li>We vervangen een ongeldige bepaling door een geldige bepaling van vergelijkbare strekking</li>
              <li>Deze voorwaarden + het privacybeleid vormen de gehele overeenkomst en vervangen eerdere communicatie</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="contact">
            <h2>12. Contact</h2>
            <div className="not-prose rounded-lg border bg-muted p-4 space-y-2">
              <p className="font-medium">Juridische vragen</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                E-mail:{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
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
