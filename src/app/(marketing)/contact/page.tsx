"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  title: "Contact - VexNexa WCAG Scanner",
  description:
    "Contact VexNexa for questions about accessibility scanning, WCAG compliance or custom solutions.",
  keywords: "contact, support, accessibility help, WCAG questions, enterprise",
  openGraph: {
    title: "Contact - VexNexa WCAG Scanner",
    description:
      "Contact VexNexa for questions about accessibility scanning, WCAG compliance or custom solutions.",
    url: "https://vexnexa.com/contact",
    siteName: "VexNexa",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact - VexNexa WCAG Scanner",
    description:
      "Contact VexNexa for questions about accessibility scanning, WCAG compliance or custom solutions.",
  },
  alternates: {
    canonical: "https://vexnexa.com/contact",
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

export default function ContactPage() {
  const t = useTranslations('contact');
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

  const contactMethods: Method[] = [
    {
      icon: Mail,
      title: t('methods.email.title'),
      description: t('methods.email.description'),
      detail: t('methods.email.detail'),
      actionLabel: t('methods.email.actionLabel'),
      href: "mailto:info@vexnexa.com",
    },
    {
      icon: MessageCircle,
      title: t('methods.sales.title'),
      description: t('methods.sales.description'),
      detail: t('methods.sales.detail'),
      actionLabel: t('methods.sales.actionLabel'),
      href: "#contact-form", // Scroll to contact form on this page
    },
    {
      icon: Globe,
      title: t('methods.location.title'),
      description: t('methods.location.description'),
      detail: t('methods.location.detail'),
      actionLabel: t('methods.location.actionLabel'),
    },
  ];

  const isValidEmail = useMemo(
    () => (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    []
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = t('form.errors.name');
    if (!formData.email.trim() || !isValidEmail(formData.email)) e.email = t('form.errors.email');
    if (!formData.message.trim() || formData.message.trim().length < 10) e.message = t('form.errors.message');
    if (!consent) e.consent = t('form.errors.consent');
    // honeypot
    if (formData.company.trim()) e.company = t('form.errors.spam');
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
          title: t('form.toast.successTitle'),
          description: t('form.toast.successDescription'),
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
        title: t('form.toast.errorTitle'),
        description: t('form.toast.errorDescription'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInput = (field: keyof typeof formData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const benefits = t.raw('form.benefits') as string[];

  return (
    <div className="flex flex-col">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        {t('skipLink')}
      </a>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center space-y-4 p-8 sm:p-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              {t('hero.title')} <span className="text-primary">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('hero.subtitle')}
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
                <h2 className="font-display text-3xl font-bold mb-4">{t('form.title')}</h2>
                <p className="text-lg text-muted-foreground">
                  {t('form.subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {t('form.directContact')}{" "}
                  <a href="mailto:info@vexnexa.com" className="text-primary hover:underline">
                    info@vexnexa.com
                  </a>
                  .
                </p>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-3">Business Information</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Business Type:</strong> Sole proprietorship (Eenmanszaak)</p>
                  <p><strong>Address:</strong> Gagarinstraat 28, 1562TB Krommenie, Netherlands</p>
                  <p><strong>Chamber of Commerce:</strong> 94848262</p>
                  <p><strong>Establishment Number:</strong> 000060294744</p>
                </div>
              </div>
            </div>

            {/* Right column – form */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">{t('form.cardTitle')}</CardTitle>
                <CardDescription>
                  {t('form.cardDescription')}{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    {t('form.privacyPolicy')}
                  </Link>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Honeypot (hidden for users, visible for bots) */}
                  <div className="sr-only" aria-hidden="true">
                    <Label htmlFor="company">{t('form.labels.company')}</Label>
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
                    <Label htmlFor="name">{t('form.labels.name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => handleInput("name", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder={t('form.placeholders.name')}
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
                    <Label htmlFor="email">{t('form.labels.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => handleInput("email", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder={t('form.placeholders.email')}
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
                    <Label htmlFor="message">{t('form.labels.message')}</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInput("message", e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder={t('form.placeholders.message')}
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
                        {t('form.consent.label')}{" "}
                        <Link href="/legal/privacy" className="text-primary hover:underline">
                          {t('form.consent.privacyPolicy')}
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
                        {t('form.submit.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                        {t('form.submit.idle')}
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
            <h2 className="font-display text-3xl font-bold mb-3">{t('faq.title')}</h2>
            <p className="text-lg text-muted-foreground">{t('faq.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('faq.q1.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('faq.q1.answer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('faq.q2.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('faq.q2.answer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('faq.q3.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('faq.q3.answer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('faq.q4.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('faq.q4.answer')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold">{t('cta.title')}</h2>
          <p className="text-xl text-muted-foreground">
            {t('cta.subtitle')}
          </p>

          <Button size="lg" asChild>
            <Link href="/auth/register">
              {t('cta.button')}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
