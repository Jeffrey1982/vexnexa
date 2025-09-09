import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Mail, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacybeleid - TutusPorta',
  description: 'Lees ons privacybeleid: hoe TutusPorta omgaat met je gegevens, cookies en privacy. GDPR compliant.',
  keywords: 'privacybeleid, privacy policy, GDPR, data protection, cookies, gegevensbescherming',
  openGraph: {
    title: 'Privacybeleid - TutusPorta',
    description: 'Lees ons privacybeleid: hoe TutusPorta omgaat met je gegevens, cookies en privacy. GDPR compliant.',
    url: 'https://tutusporta.com/legal/privacy',
    siteName: 'TutusPorta',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacybeleid - TutusPorta',
    description: 'Lees ons privacybeleid: hoe TutusPorta omgaat met je gegevens, cookies en privacy. GDPR compliant.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/legal/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const lastUpdated = "8 december 2024"

export default function PrivacyPage() {
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
              <h1 className="font-display text-4xl font-bold">Privacybeleid</h1>
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Laatst bijgewerkt: {lastUpdated}
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground">
              Dit privacybeleid legt uit hoe TutusPorta omgaat met je persoonlijke gegevens 
              en je privacy beschermt.
            </p>
          </div>
        </div>

        {/* Quick Summary */}
        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy in het kort
            </CardTitle>
            <CardDescription>
              De belangrijkste punten over hoe we met je gegevens omgaan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm">✅ Wat we WEL doen:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>• Alleen publiek toegankelijke pagina&apos;s scannen</li>
                  <li>• Data veilig opslaan in Europa</li>
                  <li>• Minimale gegevens bewaren</li>
                  <li>• Transparant zijn over data gebruik</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm">❌ Wat we NIET doen:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>• Persoonlijke gegevens uit pagina&apos;s opslaan</li>
                  <li>• Data verkopen aan derden</li>
                  <li>• Cookies zonder toestemming plaatsen</li>
                  <li>• Data buiten Europa bewaren</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">1. Wie we zijn</h2>
            <p className="text-muted-foreground">
              TutusPorta is een accessibility scanning service ontwikkeld in Nederland. 
              We helpen website eigenaren hun sites toegankelijker te maken door WCAG compliance te testen.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Contact gegevens:</p>
              <p className="text-muted-foreground">
                TutusPorta<br />
                E-mail: <a href="mailto:privacy@tutusporta.com" className="text-primary hover:underline">privacy@tutusporta.com</a><br />
                Website: <a href="https://tutusporta.com" className="text-primary hover:underline">tutusporta.com</a>
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">2. Welke gegevens we verzamelen</h2>
            
            <h3 className="font-semibold text-lg">Scan gegevens</h3>
            <p className="text-muted-foreground">
              Wanneer je een website scant, bewaren we:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>De URL van de gescande pagina</li>
              <li>Technische metadata over accessibility issues</li>
              <li>Timestamps van scans</li>
              <li>IP-adres voor rate limiting en misbruik preventie</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Belangrijk:</strong> We slaan GEEN persoonlijke gegevens op die we in pagina&apos;s aantreffen 
              (zoals namen, e-mailadressen, telefoonnummers). We analyseren alleen HTML structuur en toegankelijkheid.
            </p>

            <h3 className="font-semibold text-lg">Account gegevens (optioneel)</h3>
            <p className="text-muted-foreground">
              Als je een account aanmaakt, verzamelen we:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>E-mailadres</li>
              <li>Naam (indien opgegeven)</li>
              <li>Wachtwoord (gehashed, niet leesbaar)</li>
              <li>Account voorkeuren</li>
            </ul>

            <h3 className="font-semibold text-lg">Contact formulier</h3>
            <p className="text-muted-foreground">
              Via het contact formulier verzamelen we:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Naam en e-mailadres</li>
              <li>Je bericht</li>
              <li>Timestamp van verzending</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">3. Cookies en tracking</h2>
            
            <h3 className="font-semibold text-lg">Functionele cookies</h3>
            <p className="text-muted-foreground">
              Deze cookies zijn noodzakelijk voor de werking van de website:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Sessie cookies voor ingelogde gebruikers</li>
              <li>Voorkeuren (taal, theme)</li>
              <li>Cookie toestemming status</li>
            </ul>

            <h3 className="font-semibold text-lg">Analytics cookies (optioneel)</h3>
            <p className="text-muted-foreground">
              Met je toestemming gebruiken we Vercel Analytics voor:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Bezoekersstatistieken (anoniem)</li>
              <li>Populaire pagina&apos;s en features</li>
              <li>Technische prestaties</li>
            </ul>
            <p className="text-muted-foreground">
              Je kunt analytics cookies altijd weigeren of intrekken via de cookie banner.
            </p>

            <h3 className="font-semibold text-lg">UTM parameters</h3>
            <p className="text-muted-foreground">
              We bewaren UTM marketing parameters (utm_source, utm_medium, etc.) tijdelijk in cookies 
              om te begrijpen hoe bezoekers ons vinden. Deze bevatten geen persoonlijke gegevens.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">4. Hoe we gegevens gebruiken</h2>
            <p className="text-muted-foreground">We gebruiken je gegevens alleen voor:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Het uitvoeren van accessibility scans</li>
              <li>Het tonen van scan resultaten en historie</li>
              <li>Account beheer en inloggen</li>
              <li>Klantenservice en support</li>
              <li>Verbetering van onze service (met toestemming)</li>
              <li>Wettelijke verplichtingen naleven</li>
            </ul>
            <p className="text-muted-foreground">
              We verkopen, verhuren of delen je gegevens <strong>nooit</strong> met derden voor marketing doeleinden.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">5. Data opslag en beveiliging</h2>
            
            <h3 className="font-semibold text-lg">Waar we data opslaan</h3>
            <p className="text-muted-foreground">
              Alle gegevens worden veilig opgeslagen binnen Europa in overeenstemming met GDPR:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Database servers in EU datacenters</li>
              <li>Backup systemen binnen Europa</li>
              <li>Geen data transfer naar landen buiten EU/EEA</li>
            </ul>

            <h3 className="font-semibold text-lg">Beveiliging</h3>
            <p className="text-muted-foreground">
              We beschermen je gegevens met:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>SSL/TLS encryptie voor alle data overdracht</li>
              <li>Gehashte wachtwoorden</li>
              <li>Toegangscontroles en monitoring</li>
              <li>Regelmatige security updates</li>
              <li>Data minimalisatie (bewaren alleen wat nodig is)</li>
            </ul>

            <h3 className="font-semibold text-lg">Data retentie</h3>
            <p className="text-muted-foreground">
              We bewaren gegevens zo kort mogelijk:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Scan data: 1 jaar voor Free accounts, langer voor betaalde accounts</li>
              <li>Account gegevens: totdat je je account verwijdert</li>
              <li>Contact berichten: 2 jaar voor support doeleinden</li>
              <li>Analytics: 2 jaar (geanonimiseerd)</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">6. Je rechten (GDPR)</h2>
            <p className="text-muted-foreground">
              Je hebt de volgende rechten betreffende je persoonlijke gegevens:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">🔍 Recht op inzage</h3>
                <p className="text-sm text-muted-foreground">
                  Je kunt opvragen welke gegevens we van je hebben.
                </p>
                
                <h3 className="font-semibold">✏️ Recht op rectificatie</h3>
                <p className="text-sm text-muted-foreground">
                  Je kunt onjuiste gegevens laten corrigeren.
                </p>
                
                <h3 className="font-semibold">🗑️ Recht op vergetelheid</h3>
                <p className="text-sm text-muted-foreground">
                  Je kunt je gegevens laten verwijderen.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold">⏸️ Recht op beperking</h3>
                <p className="text-sm text-muted-foreground">
                  Je kunt verwerking van je gegevens beperken.
                </p>
                
                <h3 className="font-semibold">📦 Recht op dataportabiliteit</h3>
                <p className="text-sm text-muted-foreground">
                  Je kunt je gegevens in een bruikbaar formaat opvragen.
                </p>
                
                <h3 className="font-semibold">❌ Recht van bezwaar</h3>
                <p className="text-sm text-muted-foreground">
                  Je kunt bezwaar maken tegen verwerking.
                </p>
              </div>
            </div>
            
            <p className="text-muted-foreground">
              Om deze rechten uit te oefenen, stuur een e-mail naar{' '}
              <a href="mailto:privacy@tutusporta.com" className="text-primary hover:underline">
                privacy@tutusporta.com
              </a>. We reageren binnen 30 dagen.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">7. Wijzigingen in dit beleid</h2>
            <p className="text-muted-foreground">
              We kunnen dit privacybeleid aanpassen als onze service verandert of als de wet dit vereist. 
              Belangrijke wijzigingen communiceren we via:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>E-mail naar geregistreerde gebruikers</li>
              <li>Melding op onze website</li>
              <li>Update van de &quot;laatst bijgewerkt&quot; datum</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">8. Contact en klachten</h2>
            <p className="text-muted-foreground">
              Heb je vragen over dit privacybeleid of over hoe we met je gegevens omgaan?
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-medium">Neem contact op:</p>
              <p className="text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" />
                E-mail: <a href="mailto:privacy@tutusporta.com" className="text-primary hover:underline">privacy@tutusporta.com</a>
              </p>
              <p className="text-muted-foreground">
                Of gebruik ons <Link href="/contact" className="text-primary hover:underline">contact formulier</Link>
              </p>
            </div>
            
            <p className="text-muted-foreground">
              Als je niet tevreden bent met ons antwoord, kun je een klacht indienen bij de 
              Autoriteit Persoonsgegevens (AP) via{' '}
              <a href="https://autoriteitpersoonsgegevens.nl" className="text-primary hover:underline" target="_blank" rel="noopener">
                autoriteitpersoonsgegevens.nl
              </a>.
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
                <Link href="/legal/terms">
                  Algemene voorwaarden
                </Link>
              </Button>
              <Button asChild>
                <Link href="/contact">
                  Vragen? Neem contact op
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}