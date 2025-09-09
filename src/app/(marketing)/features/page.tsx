import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SeverityBadge } from "@/components/SeverityBadge";
import { 
  Shield, 
  Target, 
  FileText, 
  Globe, 
  Zap, 
  Bell, 
  Link as LinkIcon,
  BarChart3,
  Users,
  Clock,
  ArrowRight,
  Check
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features - TutusPorta",
  description: "Ontdek alle features van TutusPorta: Dashboard, scan details, PDF export, prioriteiten en komende integraties.",
  openGraph: {
    title: "Features - TutusPorta",
    description: "Ontdek alle features van TutusPorta: Dashboard, scan details, PDF export, prioriteiten en komende integraties.",
    url: "https://tutusporta.com/features",
  },
  alternates: {
    canonical: "https://tutusporta.com/features",
  },
};

const currentFeatures = [
  {
    icon: BarChart3,
    title: "Overzichtelijk Dashboard",
    description: "Bekijk al je scans in één overzicht met scores, trends en quick wins.",
    benefits: [
      "Alle scans op één plek",
      "Score-trends over tijd",
      "Quick wins identificatie",
      "Site-overzicht met favicons"
    ]
  },
  {
    icon: Target,
    title: "Gedetailleerde Scan Resultaten",
    description: "Diep inzicht in elke accessibility issue met concrete voorbeelden.",
    benefits: [
      "Per-element analyse",
      "WCAG 2.2 richtlijnen",
      "Screenshots van problemen",
      "Filterbare resultaten"
    ]
  },
  {
    icon: FileText,
    title: "PDF & Word Export",
    description: "Deel rapporten met stakeholders via professionele exports.",
    benefits: [
      "PDF rapporten in één klik",
      "Word documenten voor editing",
      "Branded templates",
      "Executive summaries"
    ]
  },
  {
    icon: Shield,
    title: "Echte Axe-Core Scans", 
    description: "Dezelfde engine die professionals wereldwijd gebruiken.",
    benefits: [
      "Industry-standard analyses",
      "Regelmatige updates",
      "Geen false positives",
      "Betrouwbare resultaten"
    ]
  }
];

const upcomingFeatures = [
  {
    icon: Globe,
    title: "Site-wide Crawling",
    status: "Beta",
    description: "Scan hele websites automatisch en krijg een compleet overzicht.",
  },
  {
    icon: Bell,
    title: "Alerts & Monitoring",
    status: "Q1 2024",
    description: "Automatische meldingen bij nieuwe issues of score-wijzigingen.",
  },
  {
    icon: LinkIcon,
    title: "Jira & Linear Integraties",
    status: "Q2 2024", 
    description: "Export issues direct naar je project management tools.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    status: "Q2 2024",
    description: "Nodig teamleden uit en deel scans binnen je organisatie.",
  }
];

const faqItems = [
  {
    question: "Hoe gaat TutusPorta om met privacy?",
    answer: "We scannen alleen publiek toegankelijke content en slaan geen persoonsgegevens op. Onze scans zijn volledig GDPR-compliant en we delen geen data met derden."
  },
  {
    question: "Heeft scannen impact op de performance van mijn website?",
    answer: "Nee, onze scans hebben geen merkbare impact op je website. We simuleren een gewone bezoeker en voeren geen stress-tests uit. De scans lopen in de achtergrond zonder je site te belasten."
  },
  {
    question: "Moet ik cookies accepteren om TutusPorta te gebruiken?",
    answer: "Basis functionaliteit werkt zonder cookies. We gebruiken alleen cookies voor analytics (optioneel) en om je voorkeuren te onthouden. Je kunt alle cookies weigeren en de tool blijft volledig functioneel."
  },
  {
    question: "Kan ik ook internationale websites scannen?", 
    answer: "Ja! TutusPorta werkt met websites in alle talen en landen. We ondersteunen internationale karaktersets en kunnen websites scannen ongeacht de locatie of taal van de content."
  },
  {
    question: "Heb ik een account nodig of kan ik teams aanmaken?",
    answer: "Voor basis gebruik is geen account nodig - je kunt direct scannen. Voor geavanceerde features zoals opgeslagen scans, exports en team-collaboration kun je een gratis account aanmaken."
  },
  {
    question: "Wat voor support krijg ik?",
    answer: "Alle gebruikers krijgen e-mail support. Free plan: 72 uur responstijd. Pro plan: 24 uur. Team plan: prioriteitssupport binnen 4 uur. Plus uitgebreide documentatie en video tutorials."
  }
];

function HeroSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            ✨ Alle features
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            Alles wat je nodig hebt voor{" "}
            <span className="text-primary">WCAG-compliance</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Van snelle scans tot complete site-analyses. Dashboard, exports, prioriteiten en binnenkort team-collaboration.
          </p>
          
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Start gratis scan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SeverityLegend() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Issue Prioriteiten
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Wij categoriseren alle accessibility issues volgens WCAG-impact levels
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <SeverityBadge severity="critical" size="lg" />
              <div>
                <h3 className="font-semibold text-critical">Critical</h3>
                <p className="text-sm text-muted-foreground">
                  Blokkeert toegang volledig. Direct actie vereist.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <SeverityBadge severity="serious" size="lg" />
              <div>
                <h3 className="font-semibold text-serious">Serious</h3>
                <p className="text-sm text-muted-foreground">
                  Significante barrières. Hoge prioriteit.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <SeverityBadge severity="moderate" size="lg" />
              <div>
                <h3 className="font-semibold text-moderate">Moderate</h3>
                <p className="text-sm text-muted-foreground">
                  Hindert gebruik. Medium prioriteit.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <SeverityBadge severity="minor" size="lg" />
              <div>
                <h3 className="font-semibold text-minor">Minor</h3>
                <p className="text-sm text-muted-foreground">
                  Kleine verbeterpunten. Lage prioriteit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CurrentFeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Beschikbare Features
          </h2>
          <p className="text-xl text-muted-foreground">
            Alles wat je nu kunt gebruiken om je website toegankelijker te maken
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="font-display">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function UpcomingFeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Binnenkort Beschikbaar
          </h2>
          <p className="text-xl text-muted-foreground">
            We werken hard aan nieuwe features om je workflow nog beter te maken
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingFeatures.map((feature, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="font-display">{feature.title}</CardTitle>
                  </div>
                  <Badge variant={feature.status === "Beta" ? "default" : "outline"}>
                    {feature.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Mis geen updates van nieuwe features
          </p>
          <Button variant="outline" asChild>
            <Link href="/changelog">
              Bekijk Changelog
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Veelgestelde Vragen
            </h2>
            <p className="text-xl text-muted-foreground">
              Antwoorden op de meest voorkomende vragen over TutusPorta
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Heb je nog andere vragen?
            </p>
            <Button asChild>
              <Link href="/contact">
                Neem contact op
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl opacity-90">
            Start vandaag nog met het verbeteren van je website&apos;s accessibility. 
            Gratis voor 1 scan per week.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard">
                Start gratis scan
                <Zap className="ml-2 h-4 w-4" />
              </Link>
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

export default function FeaturesPage() {
  return (
    <>
      <HeroSection />
      <SeverityLegend />
      <CurrentFeaturesSection />
      <UpcomingFeaturesSection />
      <FAQSection />
      <CTASection />
    </>
  );
}