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
// Keep this object here or move it to a server component/layout.
const metadata = {
  title: "Contact - TutusPorta WCAG Scanner",
  description:
    "Contact TutusPorta for questions about accessibility scanning, WCAG compliance or custom solutions.",
  keywords: "contact, support, accessibility help, WCAG questions, demo, enterprise",
  openGraph: {
    title: "Contact - TutusPorta WCAG Scanner",
    description:
      "Contact TutusPorta for questions about accessibility scanning, WCAG compliance or custom solutions.",
    url: "https://tutusporta.com/contact",
    siteName: "TutusPorta",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact - TutusPorta WCAG Scanner",
    description:
      "Contact TutusPorta for questions about accessibility scanning, WCAG compliance or custom solutions.",
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
    description: "For general questions and support",
    detail: "Responstijd: 24–72 uur",
    actionLabel: "info@tutusporta.com",
    href: "mailto:info@tutusporta.com",
  },
  {
    icon: MessageCircle,
    title: "Sales & Demo",
    description: "For Team plans and enterprise solutions",
    detail: "Personal demo within 24 hours",
    actionLabel: "Schedule a call",
    href: "/demo", // Links to demo page with contact form
  },
  {
    icon: Globe,
    title: "Made in the Netherlands",
    description: "Privacy-first, GDPR compliant",
    detail: "Data stored in Europe",
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
    if (!formData.name.trim()) e.name = "Enter your name.";
    if (!formData.email.trim() || !isValidEmail(formData.email)) e.email = "Enter a valid email address.";
    if (!formData.message.trim() || formData.message.trim().length < 10) e.message = "Write at least 10 characters.";
    if (!consent) e.consent = "Give permission to respond to your message.";
    // honeypot
    if (formData.company.trim()) e.company = "Spam detected.";
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
          title: "Message sent!",
          description: "We will contact you within 24 hours.",
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
        title: "Something went wrong",
        description: "Try again later or send an email to info@tutusporta.com",
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
        Skip to main content
      </a>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center space-y-4 p-8 sm:p-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Let's <span className="text-primary">talk</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Vragen over TutusPorta, een demo plannen of feedback? We horen graag van je.
              No sales talk — just helpful people.
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
                <h2 className="font-display text-3xl font-bold mb-4">Send us a message</h2>
                <p className="text-lg text-muted-foreground">
                  Fill in the form and we will contact you as soon as possible.
                  For urgent questions you can also email directly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Response within 24 hours on business days</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Free demos and consultation’s en consultatie</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Dutch support in Dutch</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  <span>Privacy-first: your data is stored securely</span>
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
                <CardTitle className="font-display">Contact form</CardTitle>
                <CardDescription>
                  We treat your data confidentially according to our{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    privacybeleid
                  </Link>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Honeypot (hidden for users, visible for bots) */}
                  <div className="sr-only" aria-hidden="true">
                    <Label htmlFor="company">Company name</Label>
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
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => handleInput("name", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Your first and last name"
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
                      placeholder="you@email.com"
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
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInput("message", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Tell us how we can help you…"
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
                        I give permission to use my data to respond to my message, in accordance with the{" "}
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
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                        Send message
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
            <h2 className="font-display text-3xl font-bold mb-3">Frequently asked questions</h2>
            <p className="text-lg text-muted-foreground">Quick answers to the most common questions</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>How quickly will I get a response??</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We respond within 24 hours on business days. For Team demos and sales we try to respond within 4 hours.’s en sales proberen we binnen 4 uur te reageren.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can you give a custom demo??</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Certainly. We'd be happy to give a personal demo using your own website as an example. Plan een 30-minuten gesprek
                  via het formulier of de “Schedule a call”-knop.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Do you offer training and consultancy??</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  For Team accounts we offer onboarding and training sessions. For consultancy we provide custom quotes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How does enterprise support work??</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enterprise krijgt dedicated support, SSO, custom branding en desgewenst on-premise deployment. Neem contact op
                  for details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Prefer to try it first??</h2>
          <p className="text-xl text-muted-foreground">
            Start directly with a free scan of your website. Registration required, results within seconds.
          </p>

          <Button size="lg" asChild>
            <Link href="/auth/register">
              Start free scan
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
