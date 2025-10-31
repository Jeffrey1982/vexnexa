"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  Globe,
  ArrowRight,
} from "lucide-react";

// NOTE: In Next.js, metadata for a client component can't use `export const metadata`.
// Laat dit object hier staan of verplaats het naar een server component/layout.
const metadata = {
  title: "Contact - TutusPorta WCAG Scanner",
  description:
    "Neem contact op met TutusPorta voor vragen over accessibility scanning, WCAG compliance of custom oplossingen.",
  keywords: "contact, support, accessibility hulp, WCAG vragen, demo, enterprise",
  openGraph: {
    title: "Contact - TutusPorta WCAG Scanner",
    description:
      "Neem contact op met TutusPorta voor vragen over accessibility scanning, WCAG compliance of custom oplossingen.",
    url: "https://tutusporta.com/contact",
    siteName: "TutusPorta",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact - TutusPorta WCAG Scanner",
    description:
      "Neem contact op met TutusPorta voor vragen over accessibility scanning, WCAG compliance of custom oplossingen.",
  },
  alternates: {
    canonical: "https://tutusporta.com/contact",
  },
};

type Method = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  detail: string;
  actionLabel: string;
  href?: string;
};

const contactMethods: Method[] = [
  {
    icon: Mail,
    title: "E-mail Support",
    description: "Voor algemene vragen en support",
    detail: "Responstijd: 24–72 uur",
    actionLabel: "info@tutusporta.com",
    href: "mailto:info@tutusporta.com",
  },
  {
    icon: MessageCircle,
    title: "Sales & Demo",
    description: "Voor Team-plannen en enterprise oplossingen",
    detail: "Persoonlijke demo binnen 24 uur",
    actionLabel: "Plan een gesprek",
    href: "/demo", // Links to demo page with contact form
  },
  {
    icon: Globe,
    title: "Gemaakt in Nederland",
    description: "Privacy-first, GDPR compliant",
    detail: "Data opgeslagen in Europa",
    actionLabel: "Amsterdam, Nederland",
  },
];

export default function ContactPage() {
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    // honeypot
    company: "",
  });

  const isValidEmail = useMemo(
    () => (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    []
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Vul je naam in.";
    if (!formData.email.trim() || !isValidEmail(formData.email)) e.email = "Vul een geldig e-mailadres in.";
    if (!formData.message.trim() || formData.message.trim().length < 10) e.message = "Schrijf minimaal 10 tekens.";
    if (!consent) e.consent = "Geef toestemming om je bericht te mogen beantwoorden.";
    // honeypot
    if (formData.company.trim()) e.company = "Spam gedetecteerd.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Bericht verzonden!",
          description: "We nemen binnen 24 uur contact met je op.",
        });
        const emailForTrack = formData.email;
        const len = formData.message.length;
        setFormData({ name: "", email: "", message: "", company: "" });
        setConsent(false);

        // analytics (Vercel Analytics custom)
        if (typeof window !== "undefined" && (window as any).va?.track) {
          (window as any).va.track("contact_form_submit", {
            email: emailForTrack,
            message_length: len,
          });
        }
      } else {
        throw new Error("Failed to send message");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Er ging iets mis",
        description: "Probeer het later opnieuw of stuur een e-mail naar info@tutusporta.com",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInput = (field: keyof typeof formData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  return (
    <div className="flex flex-col">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        Ga naar hoofdinhoud
      </a>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center space-y-4 p-8 sm:p-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Laten we <span className="text-primary">praten</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Vragen over TutusPorta, een demo plannen of feedback? We horen graag van je.
              Geen verkooppraatjes — gewoon behulpzame mensen.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {contactMethods.map((m, i) => (
            <Card key={i} className="text-center h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <m.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="font-display">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{m.detail}</p>
                {m.href ? (
                  <Link
                    href={m.href}
                    className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded"
                  >
                    {m.actionLabel}
                  </Link>
                ) : (
                  <div className="font-medium text-primary">{m.actionLabel}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="container mx-auto px-4 py-12 sm:py-16 bg-muted/20" id="main">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left column */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl font-bold mb-4">Stuur ons een bericht</h2>
                <p className="text-lg text-muted-foreground">
                  Vul het formulier in en we nemen zo snel mogelijk contact met je op.
                  Voor urgente vragen kun je ook direct mailen.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Respons binnen 24 uur op werkdagen</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Gratis demo’s en consultatie</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Nederlandse support in het Nederlands</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Privacy-first: je gegevens worden veilig bewaard</span>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Liever direct contact? Mail{" "}
                  <a href="mailto:info@tutusporta.com" className="text-primary hover:underline">
                    info@tutusporta.com
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Right column – form */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Contactformulier</CardTitle>
                <CardDescription>
                  We behandelen je gegevens vertrouwelijk volgens ons{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    privacybeleid
                  </Link>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Honeypot (verborgen voor users, zichtbaar voor bots) */}
                  <div className="sr-only" aria-hidden="true">
                    <Label htmlFor="company">Bedrijfsnaam</Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={formData.company}
                      onChange={(e) => handleInput("company", e.target.value)}
                      tabIndex={-1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Naam *</Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => handleInput("name", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Je voornaam en achternaam"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="text-sm text-destructive" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => handleInput("email", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="je@email.nl"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Bericht *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInput("message", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Vertel ons waar we je mee kunnen helpen…"
                      rows={6}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="text-sm text-destructive" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="consent"
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          if (errors.consent) setErrors((x) => ({ ...x, consent: "" }));
                        }}
                        aria-invalid={!!errors.consent}
                        aria-describedby={errors.consent ? "consent-error" : undefined}
                      />
                      <Label htmlFor="consent" className="leading-relaxed">
                        Ik geef toestemming om mijn gegevens te gebruiken om op mijn bericht te reageren, conform het{" "}
                        <Link href="/legal/privacy" className="text-primary hover:underline">
                          privacybeleid
                        </Link>
                        .
                      </Label>
                    </div>
                    {errors.consent && (
                      <p id="consent-error" className="text-sm text-destructive" role="alert">
                        {errors.consent}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Bezig met verzenden…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
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
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">Veelgestelde vragen</h2>
            <p className="text-lg text-muted-foreground">Snel antwoord op de meest voorkomende vragen</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Hoe snel krijg ik antwoord?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We reageren binnen 24 uur op werkdagen. Voor Team-demo’s en sales proberen we binnen 4 uur te reageren.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kunnen jullie een custom demo geven?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Zeker. We doen graag een persoonlijke demo met je eigen website als voorbeeld. Plan een 30-minuten gesprek
                  via het formulier of de “Plan een gesprek”-knop.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bieden jullie training en consultancy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Voor Team-accounts bieden we onboarding en trainingssessies. Voor consultancy leveren we offertes op maat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hoe werkt enterprise ondersteuning?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enterprise krijgt dedicated support, SSO, custom branding en desgewenst on-premise deployment. Neem contact op
                  voor details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Liever eerst uitproberen?</h2>
          <p className="text-xl text-muted-foreground">
            Start direct met een gratis scan van je website. Registratie vereist, resultaat binnen seconden.
          </p>

          <Button size="lg" asChild>
            <Link href="/auth/register">
              Start gratis scan
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
