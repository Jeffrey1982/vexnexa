"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { Menu } from "lucide-react";
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
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 6);
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const navigationItems = [
    { name: t('forAgencies'), href: "/for-agencies" },
    { name: t('pilotProgram'), href: "/pilot-partner-program" },
    { name: t('features'), href: "/features" },
    { name: t('pricing'), href: "/pricing" },
    { name: t('sampleReport'), href: "/sample-report" },
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
    <nav
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/88 backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,background-color] duration-300",
        scrolled && "bg-[var(--color-surface-base)]/94 shadow-[0_12px_34px_-24px_rgba(13,18,16,0.45)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-[4.25rem] items-center justify-between md:h-[4.75rem]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <VexnexaLogo size={40} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-5 md:flex lg:space-x-7">
            {navigationItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-[var(--color-brand-primary-dark)] after:transition-all after:duration-200",
                    active
                      ? "text-[var(--color-ink-900)] after:w-full"
                      : "text-[var(--color-ink-500)] after:w-0 hover:text-[var(--color-ink-900)] hover:after:w-full"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Section: Social + Language + Auth */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <LanguageSelector />
            <ThemeToggle />

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
                  variant="ghost"
                  size="sm"
                  className="font-medium text-sm text-[var(--color-ink-900)] hover:bg-[var(--color-surface-warm)]"
                >
                  <Link href="/auth/login">{t('login')}</Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="bg-[var(--color-ink-900)] font-medium text-sm text-[var(--color-surface-base)] hover:bg-[var(--color-brand-primary)] dark:hover:bg-[var(--color-brand-primary-dark)]"
                  onClick={() => handleCtaClick("navbar_primary")}
                >
                  <Link href="/auth/register">{t('signup')}</Link>
                </Button>
              </>
            )}
            </div>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-[var(--color-surface-warm)] hover:text-[var(--color-brand-primary-dark)] transition-all duration-200">
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
                  {t('tagline')}
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
                        variant="default"
                        className="w-full h-12 font-medium text-base"
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
                        variant="default"
                        className="w-full h-12 font-medium text-base"
                        onClick={() => {
                          handleCtaClick("mobile_primary");
                          setIsOpen(false);
                          router.push('/auth/register');
                        }}
                      >
                        {t('signup')}
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
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t('theme')}</p>
                  <ThemeToggle />
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
