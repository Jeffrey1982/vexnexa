"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  ArrowRight,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ENTITLEMENTS, PLAN_NAMES, formatPrice } from "@/lib/billing/plans";

// Metadata handled by layout since this is a Client Component

const plans = [
  {
    key: "TRIAL" as const,
    name: "Trial", 
    price: "€0",
    period: "",
    description: "Perfect om te starten met accessibility scanning",
    highlighted: false,
    features: [
      `${ENTITLEMENTS.TRIAL.pagesPerMonth} pagina's per maand`,
      `${ENTITLEMENTS.TRIAL.sites} website`,
      "PDF export",
      "Basis rapport", 
      "14 dagen gratis",
    ],
    limitations: [
      "Geen Word export",
      "Geen scheduling",
      "Beperkte integraties",
    ],
    cta: "Start gratis trial",
    ctaHref: "/dashboard",
    ctaVariant: "outline" as const,
    isTrial: true,
  },
  {
    key: "STARTER" as const,
    name: "Starter",
    price: formatPrice("STARTER"),
    period: "",
    description: "Voor kleine websites en persoonlijk gebruik",
    highlighted: false,
    features: [
      `${ENTITLEMENTS.STARTER.pagesPerMonth} pagina's per maand`,
      `${ENTITLEMENTS.STARTER.sites} website`,
      "PDF export",
      "Basis rapporten",
      "E-mail support",
    ],
    limitations: [
      "Geen Word export", 
      "Geen scheduling",
      "Beperkte integraties",
    ],
    cta: "Upgrade naar Starter",
    ctaVariant: "default" as const,
    isTrial: false,
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: formatPrice("PRO"), 
    period: "",
    description: "Voor professionals die regelmatig scannen",
    highlighted: true,
    features: [
      `${ENTITLEMENTS.PRO.pagesPerMonth} pagina's per maand`,
      `${ENTITLEMENTS.PRO.sites} websites`,
      `${ENTITLEMENTS.PRO.users} gebruikers`,
      "PDF + Word export",
      "Uitgebreide rapporten", 
      "Scheduling",
      "Slack & Jira integratie",
      "Priority support",
    ],
    limitations: [],
    cta: "Upgrade naar Pro",
    ctaVariant: "default" as const,
    isTrial: false,
  },
  {
    key: "BUSINESS" as const,
    name: "Business",
    price: formatPrice("BUSINESS"),
    period: "",
    description: "Voor teams en enterprise gebruik",
    highlighted: false,
    features: [
      `${ENTITLEMENTS.BUSINESS.pagesPerMonth} pagina's per maand`,
      `${ENTITLEMENTS.BUSINESS.sites} websites`,
      `${ENTITLEMENTS.BUSINESS.users} gebruikers`,
      "Alle exports (PDF + Word)",
      "White label rapporten",
      "Advanced scheduling",
      "Alle integraties",
      "Priority support (4u response)",
    ],
    limitations: [],
    cta: "Upgrade naar Business",
    ctaVariant: "default" as const,
    isTrial: false,
  },
];

const comparisonFeatures = [
  { 
    category: "Gebruikslimiet",
    features: [
      { name: "Pagina's per maand", trial: ENTITLEMENTS.TRIAL.pagesPerMonth, starter: ENTITLEMENTS.STARTER.pagesPerMonth, pro: ENTITLEMENTS.PRO.pagesPerMonth, business: ENTITLEMENTS.BUSINESS.pagesPerMonth },
      { name: "Websites", trial: ENTITLEMENTS.TRIAL.sites, starter: ENTITLEMENTS.STARTER.sites, pro: ENTITLEMENTS.PRO.sites, business: ENTITLEMENTS.BUSINESS.sites },
      { name: "Gebruikers", trial: ENTITLEMENTS.TRIAL.users, starter: ENTITLEMENTS.STARTER.users, pro: ENTITLEMENTS.PRO.users, business: ENTITLEMENTS.BUSINESS.users },
    ]
  },
  {
    category: "Rapporten & Export", 
    features: [
      { name: "PDF export", trial: ENTITLEMENTS.TRIAL.pdf, starter: ENTITLEMENTS.STARTER.pdf, pro: ENTITLEMENTS.PRO.pdf, business: ENTITLEMENTS.BUSINESS.pdf },
      { name: "Word export", trial: ENTITLEMENTS.TRIAL.word, starter: ENTITLEMENTS.STARTER.word, pro: ENTITLEMENTS.PRO.word, business: ENTITLEMENTS.BUSINESS.word },
      { name: "White label", trial: ENTITLEMENTS.TRIAL.whiteLabel || false, starter: ENTITLEMENTS.STARTER.whiteLabel || false, pro: ENTITLEMENTS.PRO.whiteLabel || false, business: ENTITLEMENTS.BUSINESS.whiteLabel || false },
    ]
  },
  {
    category: "Features",
    features: [
      { name: "Scheduling", trial: ENTITLEMENTS.TRIAL.schedule, starter: ENTITLEMENTS.STARTER.schedule, pro: ENTITLEMENTS.PRO.schedule, business: ENTITLEMENTS.BUSINESS.schedule },
      { name: "Slack integratie", trial: ENTITLEMENTS.TRIAL.integrations.includes("slack"), starter: ENTITLEMENTS.STARTER.integrations.includes("slack"), pro: ENTITLEMENTS.PRO.integrations.includes("slack"), business: ENTITLEMENTS.BUSINESS.integrations.includes("slack") },
      { name: "Jira integratie", trial: ENTITLEMENTS.TRIAL.integrations.includes("jira"), starter: ENTITLEMENTS.STARTER.integrations.includes("jira"), pro: ENTITLEMENTS.PRO.integrations.includes("jira"), business: ENTITLEMENTS.BUSINESS.integrations.includes("jira") },
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
            <span className="text-primary">jouw project</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Van gratis trial tot enterprise features. 
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
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "TRIAL") return;
    
    setLoading(planKey);
    setError(null);
    
    try {
      const response = await fetch("/api/mollie/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planKey }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }
      
      // Redirect to Mollie checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Er ging iets mis. Probeer opnieuw.");
      setLoading(null);
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {error && (
          <Alert className="mb-8 max-w-md mx-auto" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.key} 
              className={cn(
                "relative",
                plan.highlighted && "border-primary shadow-xl scale-105"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Populair
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
                  onClick={() => plan.isTrial && plan.ctaHref ? window.location.href = plan.ctaHref : handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                >
                  {loading === plan.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Prijzen exclusief btw. Maandelijks opzegbaar. 
            <Link href="/contact" className="text-primary hover:underline ml-1">
              Vragen? Neem contact op.
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
        <div className="max-w-6xl mx-auto">
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
                        <TableHead className="text-center">Trial</TableHead>
                        <TableHead className="text-center">Starter</TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span>Pro</span>
                            <Star className="h-3 w-3 text-primary" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Business</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.features.map((feature, featureIndex) => (
                        <TableRow key={featureIndex}>
                          <TableCell className="font-medium">{feature.name}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.trial)}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.starter)}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.pro)}</TableCell>
                          <TableCell className="text-center">{renderValue(feature.business)}</TableCell>
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

function CTASection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Begin vandaag nog met scannen
          </h2>
          <p className="text-xl opacity-90">
            Start met een gratis trial en upgrade wanneer je meer functionaliteit nodig hebt. 
            Geen setup, geen verrassingen.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Start gratis trial
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
                Neem contact op
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
      <CTASection />
    </>
  );
}