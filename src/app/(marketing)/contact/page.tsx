"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  Globe,
  ArrowRight,
  FileText,
  Building2,
  CreditCard,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics-events";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";

type Method = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  detail: string;
  actionLabel: string;
  href?: string;
};

function ContactPageContent() {
  const t = useTranslations('contact');
  const { toast } = useToast();

  const quickReasons = [
    {
      icon: FileText,
      title: t('quickReasons.sampleReport.title'),
      description: t('quickReasons.sampleReport.description'),
    },
    {
      icon: Building2,
      title: t('quickReasons.agencyWorkflows.title'),
      description: t('quickReasons.agencyWorkflows.description'),
    },
    {
      icon: CreditCard,
      title: t('quickReasons.choosePlan.title'),
      description: t('quickReasons.choosePlan.description'),
    },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRef, setSubmittedRef] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    reason: "",
    // Lead-form additions (sent to /api/contact, surfaced in info@ email)
    companyName: "",
    phoneNumber: "",
    domainCount: "",
    industry: "",
    // honeypot
    company: "",
  });

  // Capture source page from ?from= URL param
  const searchParams = useSearchParams();
  const [source, setSource] = useState("");

  // Read ?intent= so the form can switch between General / Walkthrough /
  // Sample-PDF / White-label modes. Defaults to "general".
  type Intent = "general" | "walkthrough" | "sample-pdf" | "white-label";
  const intentOptions: readonly Intent[] = ["general", "walkthrough", "sample-pdf", "white-label"];
  const [intent, setIntent] = useState<Intent>("general");

  useEffect(() => {
    const from = searchParams.get("from");
    if (from) setSource(from);
    const raw = (searchParams.get("intent") || "").toLowerCase();
    const matched = (intentOptions as readonly string[]).includes(raw)
      ? (raw as Intent)
      : "general";
    setIntent(matched);
    // Pre-select a sensible reason based on the intent so the dropdown
    // already reflects what the user came here for.
    setFormData((p) => ({
      ...p,
      reason:
        matched === "sample-pdf"
          ? "sample_report"
          : matched === "white-label"
          ? "white_label_reports"
          : matched === "walkthrough"
          ? "agency_use"
          : p.reason,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Per-intent banner copy + which extra fields to render.
  const intentBanner: Record<Intent, { title: string; subtitle: string; cta: string }> = {
    general: {
      title: "Get in touch",
      subtitle: "Send us a message and we'll get back to you as fast as possible.",
      cta: "Send message",
    },
    walkthrough: {
      title: "Plan your Enterprise Walkthrough",
      subtitle:
        "30-minute guided demo of the AI-Vision platform, VNI portfolio view, and audit-ready reporting. We respond within one business day to schedule.",
      cta: "Request walkthrough",
    },
    "sample-pdf": {
      title: "Request a sample PDF report",
      subtitle:
        "We'll send a sanitised real-world VexNexa report so you can show your team exactly what the audit-ready output looks like.",
      cta: "Request sample report",
    },
    "white-label": {
      title: "Request a white-label sample",
      subtitle:
        "See how VexNexa rebrands the entire scan-to-report flow under your agency colours. We respond within one business day with previews.",
      cta: "Request white-label sample",
    },
  };
  const banner = intentBanner[intent];
  const showLeadFields = intent !== "general";

  const contactReasons: { value: string; label: string }[] = [
    { value: "agency_use", label: "Agency use" },
    { value: "white_label_reports", label: "White-label reports" },
    { value: "monitoring_multiple_sites", label: "Monitoring multiple sites" },
    { value: "pricing_plans", label: "Pricing / plans" },
    { value: "sample_report", label: "Sample report" },
    { value: "other", label: "Other" },
  ];

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
    if (!formData.reason) e.reason = "Please select a reason for contacting us";
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
          reason: formData.reason,
          source: source || undefined,
          intent,
          companyName: formData.companyName.trim() || undefined,
          phoneNumber: formData.phoneNumber.trim() || undefined,
          domainCount: formData.domainCount.trim() || undefined,
          industry: formData.industry.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as { messageId?: string };
        if (data?.messageId) setSubmittedRef(data.messageId);
        toast({
          title: t('form.toast.successTitle'),
          description: t('form.toast.successDescription'),
        });
        const len = formData.message.length;
        setFormData({
          name: "",
          email: "",
          message: "",
          reason: "",
          companyName: "",
          phoneNumber: "",
          domainCount: "",
          industry: "",
          company: "",
        });
        setConsent(false);

        trackEvent("contact_cta_click", { location: "form_submit", message_length: len, intent });
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

      {/* Hero — switches to intent-aware copy when ?intent= is present */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center space-y-4 p-8 sm:p-12">
            {intent !== "general" && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {intent === "walkthrough"
                  ? "Enterprise"
                  : intent === "sample-pdf"
                  ? "Sample Report"
                  : "White-Label"}
              </span>
            )}
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              {intent === "general" ? (
                <>
                  {t("pageHero.title")} <span className="text-primary">{t("pageHero.titleHighlight")}</span>
                </>
              ) : (
                banner.title
              )}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {intent === "general" ? t("pageHero.subtitle") : banner.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Quick reason cards */}
      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {quickReasons.map((r, i) => (
            <Card key={i} className="border-0 shadow-elegant bg-card/80">
              <CardContent className="p-6 space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <r.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold font-display text-sm">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          ))}
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
                  <p><strong>Address:</strong> Provencialeweg 46B 1506MC Zaandam</p>
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

                  {/* Lead-form extras — only rendered when ?intent= is set */}
                  {showLeadFields && (
                    <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="companyName">Company / organisation</Label>
                        <Input
                          id="companyName"
                          type="text"
                          autoComplete="organization"
                          value={formData.companyName}
                          onChange={(e) => handleInput("companyName", e.target.value)}
                          disabled={isSubmitting}
                          placeholder="Your company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone (optional)</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          autoComplete="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInput("phoneNumber", e.target.value)}
                          disabled={isSubmitting}
                          placeholder="+31 …"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domainCount">
                          {intent === "white-label" ? "Client sites under management" : "Domains/sites in scope"}
                        </Label>
                        <Input
                          id="domainCount"
                          type="text"
                          inputMode="numeric"
                          value={formData.domainCount}
                          onChange={(e) => handleInput("domainCount", e.target.value)}
                          disabled={isSubmitting}
                          placeholder="e.g. 1, 5, 25, 100+"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="industry">Industry / sector (optional)</Label>
                        <Input
                          id="industry"
                          type="text"
                          value={formData.industry}
                          onChange={(e) => handleInput("industry", e.target.value)}
                          disabled={isSubmitting}
                          placeholder="e.g. Public sector, e-commerce, finance, agency"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">What are you contacting us about? *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value: string) => {
                        setFormData((p) => ({ ...p, reason: value }));
                        if (errors.reason) setErrors((prev) => ({ ...prev, reason: "" }));
                        trackEvent("contact_reason_selected", { reason: value });
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="reason"
                        aria-invalid={!!errors.reason}
                        aria-describedby={errors.reason ? "reason-error" : undefined}
                      >
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactReasons.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.reason && (
                      <p id="reason-error" className="text-sm text-destructive" role="alert">
                        {errors.reason}
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
                        {intent === "general" ? t("form.submit.idle") : banner.cta}
                      </>
                    )}
                  </Button>

                  {submittedRef && (
                    <div className="rounded-lg border border-success/40 bg-success/[0.06] p-4 text-sm">
                      <p className="font-medium text-foreground">
                        ✓ Request received — thank you!
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Reference: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{submittedRef}</code>
                        . We&apos;ve sent a confirmation to your email.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <AgencyCTAStrip location="contact" />

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

      {/* CTA strip */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            Prefer to explore on your own first?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-primary text-white" asChild>
              <Link
                href="/sample-report"
                onClick={() => trackEvent("contact_cta_click", { location: "cta_strip_report" })}
              >
                View sample report
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="/pricing"
                onClick={() => trackEvent("contact_cta_click", { location: "cta_strip_pricing" })}
              >
                Compare plans
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="/for-agencies"
                onClick={() => trackEvent("contact_cta_click", { location: "cta_strip_agencies" })}
              >
                Agency solutions
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense>
      <ContactPageContent />
    </Suspense>
  );
}
