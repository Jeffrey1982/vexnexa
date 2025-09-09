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
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <Badge variant="outline" className="mb-4">
            🚀 Nieuw: Site-wide crawling in beta
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            WCAG-scans die wél{" "}
            <span className="text-primary">inzicht geven</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Voer een URL in en krijg een concreet rapport met prioriteiten, voorbeelden en quick wins. 
            Export als PDF of Word.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => {
                handleCtaClick("hero_primary");
                window.location.href = '/dashboard';
              }}
            >
              Start gratis scan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => {
                handleCtaClick("hero_secondary");
                window.location.href = '/features';
              }}
            >
              Bekijk features
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Gratis voor 1 scan per week • Geen creditcard vereist
          </p>
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
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Alles wat je nodig hebt voor WCAG-compliance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Van snelle single-page scans tot complete site-analyses. 
            Ideaal voor marketing, development en compliance teams.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold font-display mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
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
              <Link href="/dashboard">
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
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Start gratis – 1 scan per week
          </h2>
          <p className="text-xl opacity-90">
            Geen creditcard nodig. Upgrade wanneer je meer scans nodig hebt. 
            Maandelijks opzegbaar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => {
                handleCtaClick();
                window.location.href = '/dashboard';
              }}
            >
              Start nu je eerste scan
              <Zap className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
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