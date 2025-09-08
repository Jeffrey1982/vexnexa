import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  Globe, 
  Shield,
  ArrowRight,
  Heart,
  Zap,
  CheckCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Over ons - TutusPorta", 
  description: "Ontdek de missie van TutusPorta: het web toegankelijker maken met krachtige WCAG-scans en duidelijke rapporten.",
  openGraph: {
    title: "Over ons - TutusPorta",
    description: "Ontdek de missie van TutusPorta: het web toegankelijker maken met krachtige WCAG-scans en duidelijke rapporten.",
    url: "https://tutusporta.com/about",
  },
  alternates: {
    canonical: "https://tutusporta.com/about",
  },
};

const values = [
  {
    icon: Shield,
    title: "Toegankelijkheid voor iedereen",
    description: "We geloven dat het web voor iedereen toegankelijk moet zijn, ongeacht beperking of technologie."
  },
  {
    icon: Target,
    title: "Actionable insights",
    description: "Geen vage rapporten, maar concrete stappen die teams direct kunnen implementeren."
  },
  {
    icon: Users,
    title: "Samenwerking",
    description: "Accessibility is teamwerk. We bouwen tools die designers, developers en marketeers samenbrengen."
  },
  {
    icon: Zap,
    title: "Snelheid",
    description: "Tijd is kostbaar. Onze scans en rapporten zijn razendsnel zonder in te leveren op kwaliteit."
  }
];

const roadmapItems = [
  {
    quarter: "Q4 2024",
    status: "In ontwikkeling",
    title: "Site-wide Crawling",
    description: "Automatisch hele websites scannen en overzicht krijgen van alle pagina's.",
    completed: false
  },
  {
    quarter: "Q1 2025", 
    status: "Gepland",
    title: "Team Collaboration",
    description: "Werkruimtes delen, taken toewijzen en voortgang bijhouden met je team.",
    completed: false
  },
  {
    quarter: "Q2 2025",
    status: "Gepland", 
    title: "API & Integraties",
    description: "Koppel TutusPorta aan Jira, Linear, Slack en andere tools in je workflow.",
    completed: false
  },
  {
    quarter: "Q3 2025",
    status: "Gepland",
    title: "Monitoring & Alerts", 
    description: "Automatische scans en meldingen bij regressies of nieuwe issues.",
    completed: false
  }
];

function HeroSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            ❤️ Over TutusPorta
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            We maken het web{" "}
            <span className="text-primary">toegankelijker</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            TutusPorta begon vanuit de frustratie dat accessibility vaak te complex werd gemaakt. 
            Wij geloven in krachtige tools die iedereen kan gebruiken.
          </p>
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold font-display">
                Onze missie
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  <strong className="text-foreground">15% van de wereldbevolking heeft een beperking</strong> — 
                  dat zijn meer dan 1 miljard mensen die dagelijks tegen digitale barrières aanlopen.
                </p>
                <p>
                  WCAG-compliance hoeft niet complex te zijn. Met de juiste tools kunnen teams 
                  snel identificeren wat er verbeterd moet worden en hoe dat te doen.
                </p>
                <p>
                  Wij bouwen TutusPorta voor designers die toegankelijke interfaces willen maken, 
                  developers die clean code schrijven, en marketeers die inclusieve campaigns lanceren.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Card className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">WCAG 2.2 AA</h3>
                  <p className="text-muted-foreground">
                    Alle scans volgen de nieuwste internationale accessibility standaarden
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Onze waarden
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deze principes sturen elke feature die we bouwen en elke beslissing die we nemen
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold font-display">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccessibilitySection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Waarom accessibility ertoe doet
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">1.3B</div>
                <h3 className="font-semibold mb-2">Mensen wereldwijd</h3>
                <p className="text-sm text-muted-foreground">
                  hebben een beperking en zijn afhankelijk van toegankelijke websites
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">€13T</div>
                <h3 className="font-semibold mb-2">Jaarlijkse koopkracht</h3>
                <p className="text-sm text-muted-foreground">
                  van mensen met een beperking — een markt die je niet wilt missen
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">Legal</div>
                <h3 className="font-semibold mb-2">Compliance vereist</h3>
                <p className="text-sm text-muted-foreground">
                  Steeds meer landen maken accessibility wettelijk verplicht
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-card border rounded-lg p-8 text-left">
            <h3 className="text-xl font-semibold font-display mb-4">WCAG 2.2 in het kort</h3>
            <p className="text-muted-foreground mb-6">
              De Web Content Accessibility Guidelines (WCAG) 2.2 zijn de internationale standaard 
              voor website toegankelijkheid. Ze zijn gebaseerd op vier principes:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <strong>Waarneembaar</strong>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Informatie moet presenteerbaar zijn op manieren die gebruikers kunnen waarnemen
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <strong>Bedienbaar</strong>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Interface componenten moeten bedienbaar zijn voor alle gebruikers
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <strong>Begrijpelijk</strong>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Informatie en bediening van de interface moet begrijpelijk zijn
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <strong>Robuust</strong>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Content moet robuust genoeg zijn voor diverse hulptechnologieën
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Onze roadmap
            </h2>
            <p className="text-xl text-muted-foreground">
              Dit is waar we naartoe werken. Heb je feedback of feature requests? 
              <Link href="/contact" className="text-primary hover:underline ml-1">
                Laat het ons weten!
              </Link>
            </p>
          </div>
          
          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <Badge 
                        variant={item.completed ? "default" : "outline"}
                        className={item.completed ? "bg-success" : ""}
                      >
                        {item.quarter}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold font-display">{item.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Wil je de eerste zijn die nieuwe features probeert?
            </p>
            <Button asChild>
              <Link href="/contact">
                Word beta tester
                <Heart className="ml-2 w-4 h-4" />
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
            Maak het web toegankelijker
          </h2>
          <p className="text-xl opacity-90">
            Join onze missie om het web voor iedereen toegankelijk te maken. 
            Start vandaag nog met je eerste scan.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard">
                Start gratis scan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
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

export default function AboutPage() {
  return (
    <>
      <HeroSection />
      <MissionSection />
      <ValuesSection />
      <AccessibilitySection />
      <RoadmapSection />
      <CTASection />
    </>
  );
}