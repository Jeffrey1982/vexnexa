"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Zap, 
  Target, 
  Globe, 
  FileText, 
  Shield,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Metadata is handled by the layout since this is a Client Component

const features = [
  {
    icon: Shield,
    title: "Echte axe-core scans",
    description: "Dezelfde engine die professionals gebruiken voor nauwkeurige WCAG 2.2 analyses.",
  },
  {
    icon: Target,
    title: "Rapport met prioriteit",
    description: "Critical, Serious, Moderate, Minor - weet meteen waar je moet beginnen.",
  },
  {
    icon: Globe,
    title: "Site-wide crawling (beta)",
    description: "Vind problemen pagina-breed en krijg overzicht van je hele website.",
  },
];

const steps = [
  {
    number: "01",
    title: "Voer URL in",
    description: "Plak de link van je pagina in het dashboard",
  },
  {
    number: "02", 
    title: "Scan loopt automatisch",
    description: "Axe-core analyseert alle elementen op WCAG-compliance",
  },
  {
    number: "03",
    title: "Rapport met prioriteiten", 
    description: "Export als PDF/Word en deel met team of klanten",
  },
];

const logos = [
  { name: "Company A", width: 100, height: 40 },
  { name: "Company B", width: 120, height: 40 },
  { name: "Company C", width: 80, height: 40 },
  { name: "Company D", width: 110, height: 40 },
];

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TutusPorta by Vexnexa",
    description: "WCAG accessibility scanning tool for websites by Vexnexa",
    url: "https://tutusporta.com",
    logo: "https://tutusporta.com/logo.png",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://tutusporta.com/contact",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function HeroSection() {
  const handleCtaClick = (location: string) => {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track("cta_click", { location });
    }
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left space-y-8">
            <Badge
              variant="outline"
              className="mb-4 animate-fade-in shadow-elegant border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              🚀 Nieuw: Site-wide crawling in beta
            </Badge>

            <h1 className="animate-slide-up text-4xl lg:text-5xl xl:text-6xl font-bold font-display tracking-tight leading-tight">
              WCAG-scans die wél{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                inzicht geven
              </span>
            </h1>

            <p className="animate-slide-up text-xl lg:text-2xl text-muted-foreground leading-relaxed">
              Voer een URL in en krijg een concreet rapport met prioriteiten, voorbeelden en quick wins.
              Export als PDF of Word.
            </p>

            <div className="animate-scale-in flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
              <Button
                size="lg"
                className="button-hover gradient-primary text-white border-0 shadow-soft relative overflow-hidden group px-8 py-3"
                asChild
              >
                <Link
                  href="/auth/register"
                  onClick={() => handleCtaClick("hero_primary")}
                >
                  <span className="relative z-10 flex items-center">
                    Start gratis scan
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="button-hover border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 px-8 py-3"
                onClick={() => {
                  handleCtaClick("hero_secondary");
                  window.location.href = '/features';
                }}
              >
                Bekijk features
              </Button>
            </div>

            <p className="animate-fade-in text-sm text-muted-foreground pt-4">
              Gratis voor 1 scan per week • Alleen registratie vereist
            </p>
          </div>

          {/* Right column - Hero image placeholder */}
          <div className="relative animate-fade-in">
            <div className="relative z-10">
              {/* Hero image placeholder - replace with actual image */}
              <div className="aspect-square lg:aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-3xl shadow-2xl border border-primary/20 backdrop-blur-sm relative overflow-hidden group">
                {/* Placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold font-display text-foreground mb-3">
                    Accessibility Scanning
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Hero image placeholder
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Perfect spot for an accessibility-themed illustration
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-16 h-16 border border-primary/20 rounded-full opacity-20"></div>
                <div className="absolute bottom-6 left-6 w-12 h-12 border border-accent/30 rounded-full opacity-30"></div>
                <div className="absolute top-1/2 right-8 w-2 h-2 bg-primary/40 rounded-full"></div>
                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-accent/40 rounded-full"></div>
              </div>

              {/* Floating elements around the image */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse delay-500"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return (
    <section className="py-16 border-y bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-muted-foreground">
            Vertrouwd door teams die accessibility serieus nemen
          </p>
        </div>
        
        <div className="flex justify-center items-center space-x-8 lg:space-x-16 opacity-60">
          {logos.map((logo, index) => (
            <div 
              key={logo.name}
              className="bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
              style={{ width: logo.width, height: logo.height }}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4 animate-slide-up">
            Alles wat je nodig hebt voor WCAG-compliance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up leading-relaxed">
            Van snelle single-page scans tot complete site-analyses. 
            Ideaal voor marketing, development en compliance teams.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="text-center interactive-hover border-0 shadow-elegant bg-card/80 backdrop-blur-sm group"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <CardContent className="p-8 h-full flex flex-col">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110">
                    <feature.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold font-display mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisualSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              Van scan tot actieplan in{" "}
              <span className="text-primary">minuten</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Geen technische kennis nodig. Onze rapporten zijn zo duidelijk 
              dat je team direct aan de slag kan met verbeteringen.
            </p>
            
            <div className="space-y-4">
              {[
                "Duidelijke prioritering per issue",
                "Concrete voorbeelden en screenshots", 
                "Export naar PDF of Word",
                "WCAG 2.2 AA compliance check"
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            
            <Button asChild className="mt-6">
              <Link href="/auth/register">
                Probeer nu gratis
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="bg-muted/50 h-64 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Scan detail screenshot</p>
                  <p className="text-sm">Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Hoe het werkt
          </h2>
          <p className="text-xl text-muted-foreground">
            In drie simpele stappen van URL naar actieplan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {step.number}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-semibold font-display mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const handleCtaClick = () => {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track("cta_click", { location: "final_cta" });
    }
  };

  return (
    <section className="py-20 gradient-primary text-primary-foreground relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border border-primary-foreground/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-primary-foreground/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-primary-foreground/15 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display animate-slide-up">
            Start gratis – 1 scan per week
          </h2>
          <p className="text-xl opacity-90 animate-slide-up leading-relaxed">
            Geen creditcard nodig. Upgrade wanneer je meer scans nodig hebt. 
            Maandelijks opzegbaar.
          </p>
          
          <div className="animate-scale-in flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="button-hover bg-white text-primary hover:bg-white/90 shadow-soft px-8 py-3"
              asChild
            >
              <Link 
                href="/auth/register"
                onClick={() => handleCtaClick()}
              >
                Start nu je eerste scan
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="button-hover bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground px-8 py-3"
              asChild
            >
              <Link href="/pricing">
                Bekijk prijzen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <VisualSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}