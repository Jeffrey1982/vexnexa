import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Check, 
  X, 
  Zap, 
  Star, 
  Users,
  Mail,
  Clock,
  FileText,
  Globe,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing - TutusPorta",
  description: "Kies het juiste plan voor je accessibility scans. Van gratis single scans tot team-collaboratie met prioriteit support.",
  openGraph: {
    title: "Pricing - TutusPorta", 
    description: "Kies het juiste plan voor je accessibility scans. Van gratis single scans tot team-collaboratie met prioriteit support.",
    url: "https://tutusporta.com/pricing",
  },
  alternates: {
    canonical: "https://tutusporta.com/pricing",
  },
};

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "",
    description: "Perfect om te starten met accessibility scanning",
    highlighted: false,
    features: [
      "1 scan per week",
      "PDF export",
      "Basis rapport",
      "E-mail support in 72u",
      "WCAG 2.2 compliance check",
    ],
    limitations: [
      "Geen site-wide crawling",
      "Beperkte historie",
      "Geen team features",
    ],
    cta: "Start gratis",
    ctaHref: "/dashboard",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "€19",
    period: "/maand",
    description: "Voor professionals die regelmatig scannen",
    highlighted: true,
    features: [
      "100 scans per maand", 
      "Site-wide crawl (beta)",
      "PDF + Word export",
      "Uitgebreide rapporten",
      "E-mail support in 24u",
      "Scan historie",
      "Priority support",
    ],
    limitations: [],
    cta: "Proberen",
    ctaHref: "/contact",
    ctaVariant: "default" as const,
  },
  {
    name: "Team", 
    price: "€79",
    period: "/maand",
    description: "Voor teams die samen werken aan accessibility",
    highlighted: false,
    features: [
      "1.000 scans per maand",
      "Onbeperkte teamleden",
      "Gedeelde workspaces",
      "Advanced analytics",
      "Prioriteit support in 4u",
      "Custom branding",
      "API toegang (binnenkort)",
    ],
    limitations: [],
    cta: "Plan demo",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
  },
];

const comparisonFeatures = [
  { 
    category: "Scans & Limieten",
    features: [
      { name: "Scans per maand", free: "4 (1/week)", pro: "100", team: "1.000" },
      { name: "Site-wide crawling", free: false, pro: "Beta", team: "Beta" },
      { name: "Scan historie", free: "7 dagen", pro: "1 jaar", team: "Onbeperkt" },
    ]
  },
  {
    category: "Rapporten & Export",
    features: [
      { name: "PDF export", free: true, pro: true, team: true },
      { name: "Word export", free: false, pro: true, team: true },
      { name: "Custom branding", free: false, pro: false, team: true },
      { name: "Executive summary", free: false, pro: true, team: true },
    ]
  },
  {
    category: "Team & Collaboration",
    features: [
      { name: "Teamleden", free: "1", pro: "1", team: "Onbeperkt" },
      { name: "Gedeelde workspaces", free: false, pro: false, team: true },
      { name: "Role management", free: false, pro: false, team: true },
    ]
  },
  {
    category: "Support",
    features: [
      { name: "E-mail support", free: "72u", pro: "24u", team: "4u priority" },
      { name: "Live chat", free: false, pro: false, team: true },
      { name: "Phone support", free: false, pro: false, team: true },
    ]
  },
];

function HeroSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            💰 Transparante prijzen
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            Kies het juiste plan voor{" "}
            <span className="text-primary">jouw team</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Van gratis single scans tot enterprise team-collaboration. 
            Alle prijzen zijn transparant en maandelijks opzegbaar.
          </p>
          
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm">
              Alle prijzen exclusief btw
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCards() {
  const handleCtaClick = (plan: string) => {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track("pricing_cta_click", { plan });
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={cn(
                "relative",
                plan.highlighted && "border-primary shadow-xl scale-105"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Meest populair
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-display">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <div key={limitationIndex} className="flex items-center space-x-3 opacity-60">
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full"
                  variant={plan.ctaVariant}
                  size="lg"
                  asChild
                  onClick={() => handleCtaClick(plan.name.toLowerCase())}
                >
                  <Link href={plan.ctaHref}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Prijzen exclusief btw. Maandelijks opzegbaar. 
            <Link href="/contact" className="text-primary hover:underline ml-1">
              Enterprise? Neem contact op.
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function ComparisonTable() {
  const renderValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-success mx-auto" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Vergelijk alle features
            </h2>
            <p className="text-xl text-muted-foreground">
              Gedetailleerd overzicht van wat elk plan bevat
            </p>
          </div>
          
          <div className="space-y-8">
            {comparisonFeatures.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="font-display">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-center">Free</TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span>Pro</span>
                            <Star className="h-3 w-3 text-primary" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Team</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.features.map((feature, featureIndex) => (
                        <TableRow key={featureIndex}>
                          <TableCell className="font-medium">{feature.name}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.free)}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.pro)}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.team)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqItems = [
    {
      question: "Kan ik mijn plan later upgraden of downgraden?",
      answer: "Ja, je kunt elk moment van plan wisselen. Bij upgrade wordt de nieuwe prijs direct berekend. Bij downgrade gaat de wijziging in bij je volgende factuurperiode."
    },
    {
      question: "Wat gebeurt er als ik mijn scan-limiet overschrijd?",
      answer: "Je ontvangt een melding wanneer je 80% van je limiet bereikt. Bij overschrijding kun je extra scan-pakketten bijkopen of upgraden naar een hoger plan."
    },
    {
      question: "Is er een student- of nonprofit korting?",
      answer: "Ja! Studenten en nonprofit organisaties krijgen 50% korting op alle betaalde plannen. Stuur ons een berichtje met verificatie voor je korting."
    },
    {
      question: "Kan ik jaarlijks betalen voor extra korting?",
      answer: "Absoluut! Bij jaarlijkse betaling krijg je 2 maanden gratis (16,7% korting). De jaarlijkse optie verschijnt in je dashboard na aanmelding."
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Pricing FAQ
            </h2>
            <p className="text-xl text-muted-foreground">
              Veelgestelde vragen over onze prijzen en plannen
            </p>
          </div>
          
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Heb je nog andere vragen over pricing?
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
            Begin vandaag nog met scannen
          </h2>
          <p className="text-xl opacity-90">
            Kies je plan en start direct met het verbeteren van je website's accessibility. 
            Geen setup, geen verrassingen.
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
              <Link href="/contact">
                Plan een demo
                <Users className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <>
      <HeroSection />
      <PricingCards />
      <ComparisonTable />
      <FAQSection />
      <CTASection />
    </>
  );
}