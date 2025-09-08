import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Changelog - TutusPorta',
  description: 'Alle updates, nieuwe features en verbeteringen van TutusPorta accessibility scanner.',
  openGraph: {
    title: 'Changelog - TutusPorta',
    description: 'Alle updates, nieuwe features en verbeteringen van TutusPorta accessibility scanner.',
    url: 'https://tutusporta.com/changelog',
  },
  twitter: {
    card: 'summary',
    title: 'Changelog - TutusPorta',
    description: 'Alle updates, nieuwe features en verbeteringen van TutusPorta accessibility scanner.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/changelog',
  },
}

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-6 mb-12">
          <h1 className="font-display text-4xl font-bold">
            Changelog
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Blijf op de hoogte van alle nieuwe features, verbeteringen en bugfixes. 
            We werken voortdurend aan het verbeteren van je accessibility scanning ervaring.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Beta Launch</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">v0.1.0</Badge>
                  <span className="text-sm text-muted-foreground">December 2024</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-success mb-2">✨ Nieuwe features</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Axe-core powered accessibility scanning</li>
                    <li>• PDF en Word export functionaliteit</li>
                    <li>• Issue prioriteiten (Critical, Serious, Moderate, Minor)</li>
                    <li>• Gedetailleerde rapportage met voorbeelden</li>
                    <li>• Responsive dashboard interface</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-muted-foreground">Site-wide Crawling</CardTitle>
                <Badge variant="outline">Binnenkort</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Scan complete websites in één keer. Krijg een overzicht van accessibility issues 
                over je hele site en prioriteer fixes op basis van impact.
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-muted-foreground">Team Features</CardTitle>
                <Badge variant="outline">In ontwikkeling</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground">
                <p>• Team accounts met meerdere gebruikers</p>
                <p>• Gedeelde scans en rapporten</p>
                <p>• Integraties met Jira en Linear</p>
                <p>• Automated scanning en alerts</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center pt-12">
          <Button asChild>
            <Link href="/dashboard">
              Start gratis scan
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}