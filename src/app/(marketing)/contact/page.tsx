"use client";

import type { Metadata } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  Mail, 
  MessageCircle, 
  Send, 
  Clock,
  CheckCircle,
  MapPin,
  Globe,
  ArrowRight
} from 'lucide-react'

// Note: metadata needs to be in a separate component for client components
const metadata = {
  title: 'Contact - TutusPorta WCAG Scanner',
  description: 'Neem contact op met TutusPorta voor vragen over accessibility scanning, WCAG compliance of custom oplossingen.',
  keywords: 'contact, support, accessibility hulp, WCAG vragen, demo, enterprise',
  openGraph: {
    title: 'Contact - TutusPorta WCAG Scanner',
    description: 'Neem contact op met TutusPorta voor vragen over accessibility scanning, WCAG compliance of custom oplossingen.',
    url: 'https://tutusporta.com/contact',
    siteName: 'TutusPorta',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact - TutusPorta WCAG Scanner',
    description: 'Neem contact op met TutusPorta voor vragen over accessibility scanning, WCAG compliance of custom oplossingen.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/contact',
  },
}

const contactMethods = [
  {
    icon: Mail,
    title: 'E-mail Support',
    description: 'Voor algemene vragen en support',
    detail: 'Responstijd: 24-72 uur',
    action: 'hello@tutusporta.com'
  },
  {
    icon: MessageCircle,
    title: 'Sales & Demo',
    description: 'Voor team plannen en enterprise oplossingen',
    detail: 'Persoonlijke demo binnen 24 uur',
    action: 'Plan een gesprek'
  },
  {
    icon: Globe,
    title: 'Gemaakt in Nederland',
    description: 'Privacy-first, GDPR compliant',
    detail: 'Data opgeslagen in Europa',
    action: 'Amsterdam, Nederland'
  }
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Bericht verzonden!",
          description: "We nemen binnen 24 uur contact met je op.",
        })
        setFormData({ name: '', email: '', message: '' })
        
        // Track contact form submission
        if (typeof window !== 'undefined' && window.va) {
          window.va.track("contact_form_submit", { 
            email: formData.email,
            message_length: formData.message.length 
          })
        }
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Er ging iets mis",
        description: "Probeer het later opnieuw of stuur een e-mail naar hello@tutusporta.com",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Laten we{' '}
            <span className="text-primary">praten</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Heb je vragen over TutusPorta, wil je een demo plannen, of heb je feedback? 
            We horen graag van je. Geen verkooppraatjes, gewoon helpzame mensen.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {contactMethods.map((method, index) => (
            <Card key={index} className="text-center h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-display">{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{method.detail}</p>
                <div className="font-medium text-primary">{method.action}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="container mx-auto px-4 py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl font-bold mb-4">
                  Stuur ons een bericht
                </h2>
                <p className="text-lg text-muted-foreground">
                  Vul het formulier in en we nemen zo snel mogelijk contact met je op. 
                  Voor urgente vragen kun je ook direct mailen.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Respons binnen 24 uur op werkdagen</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Gratis demo&apos;s en consultatie</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Nederlandse support in het Nederlands</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Privacy-first: je gegevens worden veilig bewaard</span>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Liever direct contact? Stuur een e-mail naar{' '}
                  <a 
                    href="mailto:hello@tutusporta.com" 
                    className="text-primary hover:underline"
                  >
                    hello@tutusporta.com
                  </a>
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Contact formulier</CardTitle>
                <CardDescription>
                  We behandelen je gegevens vertrouwelijk volgens ons{' '}
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    privacybeleid
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Naam *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Je voornaam en achternaam"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="je@email.nl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Bericht *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Vertel ons waar we je mee kunnen helpen..."
                      rows={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Bezig met verzenden...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Verstuur bericht
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">
              Veelgestelde vragen
            </h2>
            <p className="text-lg text-muted-foreground">
              Snel antwoord op de meest voorkomende vragen
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Hoe snel krijg ik een antwoord?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We reageren binnen 24 uur op werkdagen. Voor team demo&apos;s en sales vragen 
                  proberen we binnen 4 uur te reageren.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kunnen jullie een custom demo geven?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ja! We doen graag een persoonlijke demo met je eigen website als voorbeeld. 
                  Plan een 30-minuten gesprek via het contact formulier.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bieden jullie training en consultancy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Voor Team accounts bieden we onboarding en training sessies. Voor custom 
                  accessibility consultancy kun je contact opnemen voor een offerte.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hoe werkt enterprise ondersteuning?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enterprise accounts krijgen dedicated support, SSO integratie, custom branding 
                  en optioneel on-premise deployment. Neem contact op voor details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Liever eerst uitproberen?
          </h2>
          <p className="text-xl text-muted-foreground">
            Start direct met een gratis scan van je website. Geen account nodig, 
            resultaat binnen seconden.
          </p>
          
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Start gratis scan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}