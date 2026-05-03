"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import VexnexaLogo from "@/components/brand/VexnexaLogo";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const t = useTranslations('footer');
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "footer_newsletter",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.requiresConfirmation) {
          toast({
            title: t('brand.newsletter.confirmTitle'),
            description: t('brand.newsletter.confirmDescription'),
          });
        } else {
          toast({
            title: t('brand.newsletter.successTitle'),
            description: t('brand.newsletter.successDescription'),
          });
        }
        setEmail("");
      } else if (response.status === 409) {
        toast({
          title: t('brand.newsletter.alreadyTitle'),
          description: t('brand.newsletter.alreadyDescription'),
        });
      } else {
        toast({
          variant: "destructive",
          title: t('brand.newsletter.errorTitle'),
          description: result.error || t('brand.newsletter.errorDescription'),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('brand.newsletter.errorTitle'),
        description: t('brand.newsletter.errorDescription'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border/40 bg-muted", className)}>
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center space-x-3">
              <VexnexaLogo size={48} />
            </Link>

            <p className="text-muted-foreground leading-relaxed max-w-sm">
              {t('brand.tagline')}
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg" id="newsletter-heading">{t('brand.newsletter.title')}</h3>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm" aria-labelledby="newsletter-heading">
                <label htmlFor="newsletter-email" className="sr-only">
                  {t('brand.newsletter.placeholder')}
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder={t('brand.newsletter.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="bg-background"
                  aria-required="true"
                />
                <Button type="submit" disabled={isSubmitting} size="icon" aria-label={t('brand.newsletter.subscribe')}>
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </Button>
              </form>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('brand.followUs')}</h3>
              <div className="flex items-center gap-3">
                <a
                  href="https://twitter.com/vexnexa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-xl bg-muted hover:bg-primary text-muted-foreground hover:text-white flex items-center justify-center transition-all duration-200 hover:shadow-elev2 hover:-translate-y-px"
                  aria-label={t('brand.twitter')}
                >
                  <Twitter className="w-5 h-5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Links - Better organized */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Product */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('product.title')}</h3>
                <div className="flex flex-col space-y-3 text-sm">
                  <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('product.features')}
                  </Link>
                  <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('product.pricing')}
                  </Link>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('product.dashboard')}
                  </Link>
                  <Link href="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('product.changelog')}
                  </Link>
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('solutions.title')}</h3>
                <div className="flex flex-col space-y-3 text-sm">
                  <Link href="/for-agencies" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.forAgencies')}
                  </Link>
                  <Link href="/eaa-compliance-monitoring" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.eaaMonitoring')}
                  </Link>
                  <Link href="/white-label-accessibility-reports" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.whiteLabelReports')}
                  </Link>
                  <Link href="/sample-report" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.sampleReport')}
                  </Link>
                  <Link href="/wcag-scan" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.wcagScanner')}
                  </Link>
                  <Link href="/pilot-partner-program" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.pilotPartner')}
                  </Link>
                  <Link href="/accessibility-monitoring-agencies" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('solutions.agencyMonitoring')}
                  </Link>
                </div>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('support.title')}</h3>
                <div className="flex flex-col space-y-3 text-sm">
                  <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('support.contact')}
                  </Link>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('support.about')}
                  </Link>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('support.blog')}
                  </Link>
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('legal.title')}</h3>
                <div className="flex flex-col space-y-3 text-sm">
                  <Link href="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('legal.privacy')}
                  </Link>
                  <Link href="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('legal.terms')}
                  </Link>
                  <Link href="/legal/security" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('legal.security')}
                  </Link>
                  <Link href="/legal/sla" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('legal.sla')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Simplified */}
        <div className="pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <span>VexNexa &copy; {currentYear} &bull; {t('copyright')}</span>
            </div>

            <div className="text-xs text-muted-foreground text-center md:text-right max-w-md">
              {t('disclaimer')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
