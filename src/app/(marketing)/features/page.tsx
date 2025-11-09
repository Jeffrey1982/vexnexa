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
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('features')

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      url: "https://vexnexa.com/features",
    },
    alternates: {
      canonical: "https://vexnexa.com/features",
    },
  }
}

async function HeroSection() {
  const t = await getTranslations('features.hero')
  
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            {t('badge')}
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            {t('title')}{" "}
            <span className="text-primary">{t('titleHighlight')}</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
          
          <Button size="lg" asChild>
            <Link href="/auth/register">
              {t('cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

async function SeverityLegend() {
  const t = await getTranslations('features.priorities')
  
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            {t('title')}
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            {t('subtitle')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <SeverityBadge severity="critical" size="lg" />
              <div>
                <h3 className="font-semibold text-critical">{t('critical.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('critical.description')}
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <SeverityBadge severity="serious" size="lg" />
              <div>
                <h3 className="font-semibold text-serious">{t('serious.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('serious.description')}
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <SeverityBadge severity="moderate" size="lg" />
              <div>
                <h3 className="font-semibold text-moderate">{t('moderate.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('moderate.description')}
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <SeverityBadge severity="minor" size="lg" />
              <div>
                <h3 className="font-semibold text-minor">{t('minor.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('minor.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function CurrentFeaturesSection() {
  const t = await getTranslations('features.current')
  
  const currentFeatures = [
    {
      icon: BarChart3,
      title: t('dashboard.title'),
      description: t('dashboard.description'),
      benefits: t.raw('dashboard.benefits') as string[]
    },
    {
      icon: Target,
      title: t('scanResults.title'),
      description: t('scanResults.description'),
      benefits: t.raw('scanResults.benefits') as string[]
    },
    {
      icon: FileText,
      title: t('export.title'),
      description: t('export.description'),
      benefits: t.raw('export.benefits') as string[]
    },
    {
      icon: Shield,
      title: t('axeCore.title'),
      description: t('axeCore.description'),
      benefits: t.raw('axeCore.benefits') as string[]
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
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

async function UpcomingFeaturesSection() {
  const t = await getTranslations('features.upcoming')
  
  const upcomingFeatures = [
    {
      icon: Globe,
      title: t('crawling.title'),
      status: t('crawling.status'),
      description: t('crawling.description'),
    },
    {
      icon: Bell,
      title: t('monitoring.title'),
      status: t('monitoring.status'),
      description: t('monitoring.description'),
    },
    {
      icon: LinkIcon,
      title: t('integrations.title'),
      status: t('integrations.status'),
      description: t('integrations.description'),
    },
    {
      icon: Users,
      title: t('team.title'),
      status: t('team.status'),
      description: t('team.description'),
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
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
            {t('noMissUpdates')}
          </p>
          <Button variant="outline" asChild>
            <Link href="/changelog">
              {t('viewChangelog')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

async function FAQSection() {
  const t = await getTranslations('features.faq')
  
  const faqItems = [
    {
      question: t('privacy.question'),
      answer: t('privacy.answer')
    },
    {
      question: t('performance.question'),
      answer: t('performance.answer')
    },
    {
      question: t('cookies.question'),
      answer: t('cookies.answer')
    },
    {
      question: t('international.question'),
      answer: t('international.answer')
    },
    {
      question: t('account.question'),
      answer: t('account.answer')
    },
    {
      question: t('support.question'),
      answer: t('support.answer')
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t('title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
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
              {t('moreQuestions')}
            </p>
            <Button asChild>
              <Link href="/contact">
                {t('contactUs')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

async function CTASection() {
  const t = await getTranslations('features.cta')
  
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('title')}
          </h2>
          <p className="text-xl opacity-90">
            {t('subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                {t('startScan')}
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
                {t('viewPricing')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function FeaturesPage() {
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
