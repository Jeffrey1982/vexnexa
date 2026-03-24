"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@/lib/supabase/client-new";
import { User } from "@supabase/supabase-js";
import { trackEvent } from "@/lib/analytics-events";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X, Linkedin, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslations } from "next-intl";
import VexnexaLogo from "@/components/brand/VexnexaLogo";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const navigationItems = [
    { name: "For Agencies", href: "/for-agencies" },
    { name: t('features'), href: "/features" },
    { name: t('pricing'), href: "/pricing" },
    { name: "Sample Report", href: "/sample-report" },
    { name: t('contact'), href: "/contact" },
  ];

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCtaClick = (location: string) => {
    trackEvent("cta_click", { location });
  };

  return (
    <nav className={cn("border-b border-border/50 glass shadow-elegant sticky top-0 z-50 transition-all duration-200", className)} aria-label="Main navigation">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <VexnexaLogo size={48} className="group-hover:opacity-90 transition-opacity duration-200" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium text-sm relative py-2 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/80 after:transition-all after:duration-200 hover:after:w-full after:rounded-full"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Right Section: Social + Language + Auth */}
          <div className="hidden md:flex items-center gap-6">
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              <a
                href="https://linkedin.com/company/vexnexa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary flex items-center justify-center transition-all duration-200"
                aria-label="Visit VexNexa on LinkedIn"
              >
                <Linkedin className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com/vexnexa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary flex items-center justify-center transition-all duration-200"
                aria-label="Visit VexNexa on Twitter"
              >
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
            ) : user ? (
              <>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {t('dashboard')}
                </Button>
                <AuthButton user={user} />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="font-medium text-sm"
                >
                  <Link href="/auth/login">{t('login')}</Link>
                </Button>
                <Button
                  asChild
                  variant="gradient"
                  size="sm"
                  className="font-medium text-sm relative overflow-hidden group"
                  onClick={() => handleCtaClick("navbar_primary")}
                >
                  <Link href="/auth/register">
                    <span className="relative z-10">{t('signup')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  </Link>
                </Button>
              </>
            )}
            </div>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-primary/5 hover:text-primary transition-all duration-200">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] overflow-y-auto">
              <SheetHeader className="border-b border-border/20 pb-6">
                <SheetTitle>
                  <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                    <VexnexaLogo size={40} />
                  </Link>
                </SheetTitle>
                <SheetDescription className="text-left pt-2">
                  WCAG scans that provide real insights
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col space-y-4 mt-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Auth CTAs — above fold for mobile users */}
                <div className="pt-4 pb-2 border-t border-border/20 space-y-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="w-full h-12 bg-muted rounded animate-pulse"></div>
                      <div className="w-full h-12 bg-muted rounded animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <>
                      <Button
                        className="w-full h-12 bg-primary hover:bg-primary/90 shadow-elegant font-medium text-base"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/dashboard');
                        }}
                      >
                        {t('dashboard')}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-12 font-medium text-base"
                        onClick={() => {
                          setIsOpen(false);
                        }}
                      >
                        {t('signOut')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="gradient"
                        className="w-full h-12 font-medium text-base relative overflow-hidden"
                        onClick={() => {
                          handleCtaClick("mobile_primary");
                          setIsOpen(false);
                          router.push('/auth/register');
                        }}
                      >
                        Start free scan
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full h-12 font-medium text-base"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/auth/login');
                        }}
                      >
                        {t('login')}
                      </Button>
                    </>
                  )}
                </div>

                {/* Language Selector - Mobile */}
                <div className="pt-4 pb-2 border-b border-border/20">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t('language')}</p>
                  <LanguageSelector />
                </div>

                {/* Theme Toggle - Mobile */}
                <div className="pt-4 pb-2 border-b border-border/20">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Theme</p>
                  <ThemeToggle />
                </div>

                {/* Social Icons - Mobile */}
                <div className="pt-4 pb-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t('followUs')}</p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://linkedin.com/company/vexnexa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-xl bg-muted hover:bg-primary text-muted-foreground hover:text-white flex items-center justify-center transition-all duration-200 hover:shadow-elev2"
                      aria-label="Visit VexNexa on LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" aria-hidden="true" />
                    </a>
                    <a
                      href="https://twitter.com/vexnexa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-xl bg-muted hover:bg-primary text-muted-foreground hover:text-white flex items-center justify-center transition-all duration-200 hover:shadow-elev2"
                      aria-label="Visit VexNexa on Twitter"
                    >
                      <Twitter className="w-5 h-5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}