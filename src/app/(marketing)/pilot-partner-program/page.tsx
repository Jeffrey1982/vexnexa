import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Building2,
  Globe,
  FileText,
  RefreshCw,
  MessageCircle,
  Handshake,
  ClipboardCheck,
  Rocket,
  Shield,
  AlertTriangle,
  Eye,
  Users,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pilotPage.meta");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://vexnexa.com/pilot-partner-program",
    },
  };
}

export default async function PilotPartnerProgramPage() {
  const t = await getTranslations("pilotPage");

  const audiences = [
    { icon: Building2, key: "a1" },
    { icon: Globe, key: "a2" },
    { icon: Shield, key: "a3" },
  ] as const;

  const benefits = [
    { icon: Eye, key: "b1" },
    { icon: FileText, key: "b2" },
    { icon: RefreshCw, key: "b3" },
    { icon: MessageCircle, key: "b4" },
    { icon: Rocket, key: "b5" },
    { icon: Users, key: "b6" },
  ] as const;

  const expectations = ["e1", "e2", "e3", "e4"] as const;
  const agencyPoints = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
  const processSteps = ["s1", "s2", "s3", "s4"] as const;
  const notes = ["n1", "n2", "n3", "n4"] as const;

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-primary">
              <Handshake className="h-4 w-4" aria-hidden="true" />
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              {t("hero.title")}{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <TrackedCTA
                href="/partner-apply"
                event="pilot_partner_apply_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                {t("hero.ctaApply")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="pilot_partner_sample_report_click"
                eventProps={{ location: "hero" }}
                size="lg"
                variant="outline"
              >
                {t("hero.ctaSample")}
              </TrackedCTA>
            </div>

            <p className="text-sm text-muted-foreground pt-2">{t("hero.note")}</p>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="border-y border-border/40 bg-muted py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t("audiences.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("audiences.subtitle")}
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {audiences.map((a) => (
              <Card key={a.key} className="h-full border-0 shadow-elegant">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <a.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold font-display">
                    {t(`audiences.${a.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`audiences.${a.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What pilot partners get */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t("benefits.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("benefits.subtitle")}
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <Card key={b.key} className="h-full border-0 shadow-elegant">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold font-display">
                    {t(`benefits.${b.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`benefits.${b.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What we ask in return */}
      <section className="border-y border-border/40 bg-muted py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t("expectations.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("expectations.subtitle")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
            {expectations.map((key) => (
              <Card key={key} className="h-full border-0 shadow-elegant">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-display">
                        {t(`expectations.${key}.title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {t(`expectations.${key}.description`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why this works well for agencies */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-wider">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {t("agency.eyebrow")}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold font-display">
                {t("agency.title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("agency.body")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <TrackedCTA
                  href="/partner-apply"
                  event="pilot_partner_apply_click"
                  eventProps={{ location: "agency_section" }}
                  className="gradient-primary text-white"
                >
                  {t("agency.ctaApply")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </TrackedCTA>
                <TrackedCTA
                  href="/for-agencies"
                  event="pilot_partner_contact_click"
                  eventProps={{ location: "agency_section" }}
                  variant="outline"
                >
                  {t("agency.ctaLearn")}
                </TrackedCTA>
              </div>
            </div>

            <div className="space-y-3">
              {agencyPoints.map((key) => (
                <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm leading-relaxed">{t(`agency.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What to expect from the pilot */}
      <section className="border-y border-border/40 bg-muted py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t("process.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("process.subtitle")}
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((key, i) => (
              <div key={key} className="relative">
                <Card className="h-full border-0 shadow-elegant">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-10 w-10 rounded-full gradient-primary text-white flex items-center justify-center font-bold text-lg font-display">
                      {i + 1}
                    </div>
                    <h3 className="font-semibold font-display">
                      {t(`process.${key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`process.${key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important notes */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-2xl font-bold font-display">{t("notes.title")}</h2>
            </div>

            <div className="space-y-4">
              {notes.map((key) => (
                <div key={key} className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                  <ClipboardCheck className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`notes.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              {t("finalCta.title")}
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">{t("finalCta.subtitle")}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <TrackedCTA
                href="/partner-apply"
                event="pilot_partner_apply_click"
                eventProps={{ location: "final_cta" }}
                size="lg"
                className="bg-background text-primary hover:bg-muted"
              >
                {t("finalCta.ctaApply")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="pilot_partner_sample_report_click"
                eventProps={{ location: "final_cta" }}
                size="lg"
                variant="outline"
                className="text-primary hover:bg-primary/5"
              >
                {t("finalCta.ctaSample")}
              </TrackedCTA>
              <TrackedCTA
                href="/contact?from=pilot-question"
                event="pilot_partner_contact_click"
                eventProps={{ location: "final_cta" }}
                size="lg"
                variant="outline"
                className="text-primary hover:bg-primary/5"
              >
                {t("finalCta.ctaQuestion")}
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
