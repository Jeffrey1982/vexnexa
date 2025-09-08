import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Blog - TutusPorta',
  description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
  openGraph: {
    title: 'Blog - TutusPorta',
    description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
    url: 'https://tutusporta.com/blog',
  },
  twitter: {
    card: 'summary',
    title: 'Blog - TutusPorta',
    description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/blog',
  },
}

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="font-display text-4xl font-bold">
          Blog komt binnenkort
        </h1>
        
        <p className="text-lg text-muted-foreground">
          We zijn hard bezig met het schrijven van waardevolle content over web accessibility, 
          WCAG compliance en het optimaliseren van digitale toegankelijkheid.
        </p>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Verwacht binnenkort articles over:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground">
            <li>• WCAG 2.2 richtlijnen uitgelegd</li>
            <li>• Veelgemaakte accessibility fouten</li>
            <li>• Hoe accessibility je conversie verhoogt</li>
            <li>• Tools en technieken voor developers</li>
            <li>• Case studies van succesvolle implementaties</li>
          </ul>
        </div>
        
        <div className="pt-6">
          <Button asChild>
            <Link href="/">
              Terug naar Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}