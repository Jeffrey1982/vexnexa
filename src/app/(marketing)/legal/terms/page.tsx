import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Scale, Mail, Calendar, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden - TutusPorta',
  description: 'Lees de algemene voorwaarden van TutusPorta: gebruiksvoorwaarden, betalingen, aansprakelijkheid en servicevoorwaarden.',
  keywords: 'algemene voorwaarden, terms of service, gebruiksvoorwaarden, servicevoorwaarden, aansprakelijkheid',
  openGraph: {
    title: 'Algemene Voorwaarden - TutusPorta',
    description: 'Lees de algemene voorwaarden van TutusPorta: gebruiksvoorwaarden, betalingen, aansprakelijkheid en servicevoorwaarden.',
    url: 'https://tutusporta.com/legal/terms',
    siteName: 'TutusPorta',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Algemene Voorwaarden - TutusPorta',
    description: 'Lees de algemene voorwaarden van TutusPorta: gebruiksvoorwaarden, betalingen, aansprakelijkheid en servicevoorwaarden.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/legal/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const lastUpdated = "8 december 2024"

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar home
          </Link>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-bold">Algemene Voorwaarden</h1>
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Laatst bijgewerkt: {lastUpdated}
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground">
              Deze algemene voorwaarden zijn van toepassing op het gebruik van TutusPorta 
              accessibility scanning service.
            </p>
          </div>
        </div>

        {/* Quick Summary */}
        <Card className="mb-12 border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-warning" />
              Samenvatting van je rechten en plichten
            </CardTitle>
            <CardDescription>
              De belangrijkste punten uit onze voorwaarden in begrijpelijke taal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-success">✅ Wat je mag doen:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>• Onze service gebruiken voor accessibility testing</li>
                  <li>• Rapporten delen met je team en klanten</li>
                  <li>• Je account op elk moment opzeggen</li>
                  <li>• Support vragen als je hulp nodig hebt</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-critical">❌ Wat niet is toegestaan:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>• Misbruik maken van onze service</li>
                  <li>• Andermans websites scannen zonder toestemming</li>
                  <li>• Ons aansprakelijk stellen voor externe schade</li>
                  <li>• Reverse engineering van onze software</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-warning/20">
              <p className="text-sm text-muted-foreground">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                <strong>Let op:</strong> Door TutusPorta te gebruiken ga je akkoord met deze voorwaarden. 
                Lees ze daarom zorgvuldig door.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">1. Definities en toepasselijkheid</h2>
            
            <h3 className="font-semibold text-lg">Definities</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>TutusPorta:</strong> de accessibility scanning service beschikbaar op tutusporta.com</li>
              <li><strong>Gebruiker:</strong> elke persoon die TutusPorta gebruikt, met of zonder account</li>
              <li><strong>Service:</strong> alle functionaliteiten en diensten aangeboden door TutusPorta</li>
              <li><strong>Account:</strong> persoonlijke toegang tot extra features en scan historie</li>
              <li><strong>Scan:</strong> een accessibility test van een webpagina uitgevoerd door onze software</li>
            </ul>

            <h3 className="font-semibold text-lg">Toepasselijkheid</h3>
            <p className="text-muted-foreground">
              Deze algemene voorwaarden zijn van toepassing op alle gebruik van TutusPorta, inclusief:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Gratis scans zonder account</li>
              <li>Accounts (Free, Pro, Team)</li>
              <li>API toegang</li>
              <li>Alle communicatie via onze website</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">2. Gebruik van de service</h2>
            
            <h3 className="font-semibold text-lg">Toegestaan gebruik</h3>
            <p className="text-muted-foreground">Je mag TutusPorta gebruiken voor:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Accessibility testing van websites waar je eigenaar van bent</li>
              <li>Testing van websites waarvoor je toestemming hebt</li>
              <li>Educatieve doeleinden en onderzoek</li>
              <li>Commerciële doeleinden binnen je account limieten</li>
              <li>Delen van scan resultaten met klanten en teamleden</li>
            </ul>

            <h3 className="font-semibold text-lg">Verboden gebruik</h3>
            <p className="text-muted-foreground">Het is niet toegestaan om:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Websites te scannen zonder eigenaar toestemming</li>
              <li>Onze service te gebruiken voor illegale activiteiten</li>
              <li>Rate limits te omzeilen of misbruik te maken van gratis accounts</li>
              <li>Onze software te reverse engineeren of te kopiëren</li>
              <li>Malware, phishing of andere schadelijke content te scannen</li>
              <li>De service te gebruiken om anderen te schaden</li>
            </ul>

            <h3 className="font-semibold text-lg">Account verantwoordelijkheden</h3>
            <p className="text-muted-foreground">
              Als je een account hebt, ben je verantwoordelijk voor:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Het veilig houden van je inloggegevens</li>
              <li>Alle activiteiten onder je account</li>
              <li>Het direct melden van verdachte activiteiten</li>
              <li>Het up-to-date houden van je contactgegevens</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">3. Betalingen en abonnementen</h2>
            
            <h3 className="font-semibold text-lg">Gratis service</h3>
            <p className="text-muted-foreground">
              Onze Free tier is gratis voor altijd en bevat:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>1 scan per week</li>
              <li>PDF export functionaliteit</li>
              <li>Basis e-mail support</li>
            </ul>

            <h3 className="font-semibold text-lg">Betaalde abonnementen</h3>
            <p className="text-muted-foreground">
              Voor Pro en Team accounts geldt:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Prijzen zijn exclusief BTW</li>
              <li>Betaling vooraf via credit card of iDEAL</li>
              <li>Automatische verlenging elke maand</li>
              <li>Geen setup kosten of verborgen fees</li>
              <li>Opzegging mogelijk tot laatste dag van factuurperiode</li>
            </ul>

            <h3 className="font-semibold text-lg">Limiet overschrijdingen</h3>
            <p className="text-muted-foreground">
              Bij overschrijding van je scan limiet:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Free accounts: verdere scans worden geblokkeerd</li>
              <li>Betaalde accounts: extra scans tegen €0.25 per stuk</li>
              <li>Waarschuwingen bij 80% en 100% van je limiet</li>
              <li>Mogelijkheid om mid-cycle te upgraden</li>
            </ul>

            <h3 className="font-semibold text-lg">Opzegging en restitutie</h3>
            <p className="text-muted-foreground">
              Voor opzegging en restitutie geldt:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Opzegging mogelijk via account instellingen</li>
              <li>Service blijft beschikbaar tot einde factuurperiode</li>
              <li>Geen automatische restitutie bij vroegtijdige opzegging</li>
              <li>Restitutie alleen bij technische problemen langer dan 48 uur</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">4. Intellectueel eigendom</h2>
            
            <h3 className="font-semibold text-lg">TutusPorta eigendom</h3>
            <p className="text-muted-foreground">
              Alle rechten op TutusPorta software, designs, content en merken behoren toe aan ons. 
              Dit omvat:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Source code en algoritmes</li>
              <li>User interface en designs</li>
              <li>Logo&apos;s en branding</li>
              <li>Documentatie en tutorials</li>
            </ul>

            <h3 className="font-semibold text-lg">Je content en data</h3>
            <p className="text-muted-foreground">
              Voor content en data die je via TutusPorta verwerkt geldt:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Jij behoudt alle rechten op je eigen websites en content</li>
              <li>Je geeft ons beperkte rechten om scans uit te voeren</li>
              <li>We claimen geen eigendom op je scan data</li>
              <li>Je bent verantwoordelijk voor rechtmatigheid van gescande content</li>
            </ul>

            <h3 className="font-semibold text-lg">Scan rapporten</h3>
            <p className="text-muted-foreground">
              Voor de gegenereerde scan rapporten geldt:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Je mag rapporten vrij delen en gebruiken</li>
              <li>Commercieel gebruik van rapporten is toegestaan</li>
              <li>Je mag rapporten aanpassen voor je eigen doeleinden</li>
              <li>Vermeld TutusPorta als bron waar mogelijk (niet verplicht)</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibent">5. Beschikbaarheid en ondersteuning</h2>
            
            <h3 className="font-semibold text-lg">Service beschikbaarheid</h3>
            <p className="text-muted-foreground">
              We streven naar maximale beschikbaarheid, maar kunnen niet garanderen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>100% uptime (onderhoud en updates zijn nodig)</li>
              <li>Ononderbroken service tijdens technische problemen</li>
              <li>Dat alle websites scanbaar zijn (firewall/rate limits)</li>
              <li>Specifieke response tijden voor scans</li>
            </ul>

            <h3 className="font-semibold text-lg">Ondersteuning</h3>
            <p className="text-muted-foreground">Support wordt geboden conform je account type:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Free:</strong> E-mail support binnen 72 uur</li>
              <li><strong>Pro:</strong> E-mail support binnen 24 uur</li>
              <li><strong>Team:</strong> Priority support binnen 4 uur, telefoon support</li>
            </ul>

            <h3 className="font-semibold text-lg">Updates en wijzigingen</h3>
            <p className="text-muted-foreground">
              We kunnen TutusPorta op elk moment updaten met:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Nieuwe features en verbeteringen</li>
              <li>Security updates en bugfixes</li>
              <li>Wijzigingen in de user interface</li>
              <li>Aanpassingen aan scan algoritmes</li>
            </ul>
            <p className="text-muted-foreground">
              Belangrijke wijzigingen communiceren we vooraf via e-mail en onze changelog.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">6. Aansprakelijkheid en garanties</h2>
            
            <h3 className="font-semibold text-lg">Beperkte garantie</h3>
            <p className="text-muted-foreground">
              TutusPorta wordt aangeboden &quot;as is&quot; met beperkte garanties:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>We streven naar accurate WCAG 2.2 compliance testing</li>
              <li>Scans zijn gebaseerd op industry-standard axe-core library</li>
              <li>We kunnen niet garanderen dat alle issues worden gevonden</li>
              <li>False positives kunnen voorkomen</li>
              <li>Menselijke expertise blijft nodig voor volledige compliance</li>
            </ul>

            <h3 className="font-semibold text-lg">Aansprakelijkheidsbeperking</h3>
            <p className="text-muted-foreground">
              Onze aansprakelijkheid is beperkt tot:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Maximaal het bedrag dat je in de afgelopen 12 maanden hebt betaald</li>
              <li>Directe schade als gevolg van onze nalatigheid</li>
              <li>We zijn niet aansprakelijk voor indirecte of gevolgschade</li>
              <li>Verlies van inkomsten, data of zakelijke kansen valt buiten onze aansprakelijkheid</li>
            </ul>

            <h3 className="font-semibold text-lg">Overmacht</h3>
            <p className="text-muted-foreground">
              We zijn niet aansprakelijk voor service onderbrekingen door:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Natuurrampen, oorlog, terrorisme</li>
              <li>Internet storingen of provider problemen</li>
              <li>Overheidsmaatregelen of wetgeving</li>
              <li>Cyberattacks of security incidents</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">7. Privacy en gegevensbescherming</h2>
            <p className="text-muted-foreground">
              Voor privacy en gegevensbescherming verwijzen we naar ons uitgebreide{' '}
              <Link href="/legal/privacy" className="text-primary hover:underline">
                privacybeleid
              </Link>. De belangrijkste punten:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>We scannen alleen publiek toegankelijke content</li>
              <li>Persoonlijke gegevens uit pagina&apos;s worden niet opgeslagen</li>
              <li>Alle data wordt veilig bewaard in Europa</li>
              <li>Je hebt volledige controle over je account data</li>
              <li>We zijn volledig GDPR compliant</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">8. Beëindiging</h2>
            
            <h3 className="font-semibold text-lg">Beëindiging door jou</h3>
            <p className="text-muted-foreground">
              Je kunt je gebruik van TutusPorta op elk moment beëindigen door:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Je account op te zeggen via account instellingen</li>
              <li>Stoppen met het gebruik van onze service</li>
              <li>Ons te verzoeken je account data te verwijderen</li>
            </ul>

            <h3 className="font-semibold text-lg">Beëindiging door ons</h3>
            <p className="text-muted-foreground">
              We kunnen je toegang beëindigen bij:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Schending van deze voorwaarden</li>
              <li>Misbruik van onze service</li>
              <li>Niet-betaling van verschuldigde bedragen</li>
              <li>Illegaal of schadelijk gebruik</li>
            </ul>
            <p className="text-muted-foreground">
              We sturen waar mogelijk eerst een waarschuwing met gelegenheid tot herstel.
            </p>

            <h3 className="font-semibold text-lg">Gevolgen van beëindiging</h3>
            <p className="text-muted-foreground">
              Na beëindiging:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Verlies je toegang tot je account en scan historie</li>
              <li>Lopende abonnementen worden niet gerestitueerd</li>
              <li>We bewaren data conform ons retentiebeleid</li>
              <li>Deze voorwaarden blijven van kracht voor afwikkeling</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">9. Toepasselijk recht en geschillen</h2>
            
            <h3 className="font-semibold text-lg">Toepasselijk recht</h3>
            <p className="text-muted-foreground">
              Op deze voorwaarden is Nederlands recht van toepassing. Voor internationale 
              gebruikers blijft Nederlands recht gelden voor alle geschillen.
            </p>

            <h3 className="font-semibold text-lg">Geschillenbeslechting</h3>
            <p className="text-muted-foreground">
              Voor geschillenbeslechting geldt de volgende procedure:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-1">
              <li>Probeer eerst direct contact op te nemen via privacy@tutusporta.com</li>
              <li>Geef ons 30 dagen om een oplossing te vinden</li>
              <li>Bij geen oplossing: bemiddeling via geschillencommissie</li>
              <li>Laatste optie: gerechtelijke procedure bij rechtbank Amsterdam</li>
            </ol>

            <h3 className="font-semibold text-lg">Consumentenrechten</h3>
            <p className="text-muted-foreground">
              Als consument behoud je alle wettelijke rechten die niet kunnen worden uitgesloten, 
              ook als deze voorwaarden anders bepalen.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">10. Wijzigingen en slotbepalingen</h2>
            
            <h3 className="font-semibold text-lg">Wijzigingen in voorwaarden</h3>
            <p className="text-muted-foreground">
              We kunnen deze voorwaarden wijzigen wanneer:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Nieuwe features worden toegevoegd</li>
              <li>Wettelijke vereisten wijzigen</li>
              <li>Bedrijfsmodel aanpassingen nodig zijn</li>
              <li>Misbruik moet worden tegengegaan</li>
            </ul>
            <p className="text-muted-foreground">
              Belangrijke wijzigingen communiceren we 30 dagen vooraf via e-mail. 
              Gebruik na wijzigingen betekent acceptatie van de nieuwe voorwaarden.
            </p>

            <h3 className="font-semibold text-lg">Rechtsgeldigheid</h3>
            <p className="text-muted-foreground">
              Als een bepaling van deze voorwaarden nietig wordt verklaard:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Blijven de overige bepalingen volledig van kracht</li>
              <li>Vervangen we de nietige bepaling door een vergelijkbare geldige bepaling</li>
              <li>Blijft de bedoeling van de oorspronkelijke bepaling behouden</li>
            </ul>

            <h3 className="font-semibold text-lg">Volledige overeenkomst</h3>
            <p className="text-muted-foreground">
              Deze voorwaarden, samen met ons privacybeleid, vormen de volledige overeenkomst 
              tussen jou en TutusPorta. Eerdere afspraken of communicatie worden vervangen 
              door deze voorwaarden.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Laatst bijgewerkt: {lastUpdated}
            </p>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link href="/legal/privacy">
                  Privacybeleid
                </Link>
              </Button>
              <Button asChild>
                <Link href="/contact">
                  Vragen? Neem contact op
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Mail className="inline h-4 w-4 mr-1" />
              <strong>Juridische vragen?</strong> Stuur een e-mail naar{' '}
              <a href="mailto:legal@tutusporta.com" className="text-primary hover:underline">
                legal@tutusporta.com
              </a>{' '}
              voor specifieke juridische vragen over deze voorwaarden.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}