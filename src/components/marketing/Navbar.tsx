"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@/lib/supabase/client-new";
import { User } from "@supabase/supabase-js";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X, Linkedin, Twitter, Github } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Features", href: "/features" },
  { name: "Prijzen", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

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
    if (typeof window !== 'undefined' && window.va) {
      window.va.track("cta_click", { location });
    }
  };

  return (
    <nav className={cn("border-b border-border/50 glass shadow-elegant sticky top-0 z-50 transition-all duration-200", className)}>
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-elegant group-hover:scale-105 transition-all duration-300 group-hover:shadow-soft">
              <span className="text-primary-foreground font-bold text-base">T</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl group-hover:text-primary transition-colors duration-200">TutusPorta</span>
              <span className="text-xs text-muted-foreground -mt-0.5">by Vexnexa</span>
            </div>
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

          {/* Desktop Right Section: Social + Auth */}
          <div className="hidden md:flex items-center gap-6">
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              <a
                href="https://linkedin.com/company/vexnexa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg hover:bg-[var(--tp-muted)] text-[var(--tp-text-muted)] hover:text-[var(--tp-primary)] flex items-center justify-center transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/vexnexa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg hover:bg-[var(--tp-muted)] text-[var(--tp-text-muted)] hover:text-[var(--tp-primary)] flex items-center justify-center transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/vexnexa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg hover:bg-[var(--tp-muted)] text-[var(--tp-text-muted)] hover:text-[var(--tp-primary)] flex items-center justify-center transition-all duration-200"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>

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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Dashboard
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
                  <Link href="/auth/login">Inloggen</Link>
                </Button>
                <Button
                  asChild
                  variant="gradient"
                  size="sm"
                  className="font-medium text-sm relative overflow-hidden group"
                  onClick={() => handleCtaClick("navbar_primary")}
                >
                  <Link href="/auth/register">
                    <span className="relative z-10">Start Gratis</span>
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
            <SheetContent side="right" className="w-[320px] sm:w-[400px] glass">
              <SheetHeader className="border-b border-border/20 pb-6">
                <SheetTitle>
                  <Link href="/" className="flex items-center space-x-3 group" onClick={() => setIsOpen(false)}>
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-elegant group-hover:scale-105 transition-all duration-300">
                      <span className="text-primary-foreground font-bold text-base">T</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-xl">TutusPorta</span>
                      <span className="text-xs text-muted-foreground -mt-0.5">by Vexnexa</span>
                    </div>
                  </Link>
                </SheetTitle>
                <SheetDescription className="text-left pt-2">
                  WCAG-scans die wél inzicht geven
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

                {/* Social Icons - Mobile */}
                <div className="pt-4 pb-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Volg ons</p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://linkedin.com/company/vexnexa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-xl bg-[var(--tp-muted)] hover:bg-[var(--tp-primary)] text-[var(--tp-text-muted)] hover:text-white flex items-center justify-center transition-all duration-200 hover:shadow-elev2"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href="https://twitter.com/vexnexa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-xl bg-[var(--tp-muted)] hover:bg-[var(--tp-primary)] text-[var(--tp-text-muted)] hover:text-white flex items-center justify-center transition-all duration-200 hover:shadow-elev2"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a
                      href="https://github.com/vexnexa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-xl bg-[var(--tp-muted)] hover:bg-[var(--tp-primary)] text-[var(--tp-text-muted)] hover:text-white flex items-center justify-center transition-all duration-200 hover:shadow-elev2"
                      aria-label="GitHub"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                      <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <>
                      <Button
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/dashboard');
                        }}
                        className="w-full justify-start gradient-primary shadow-elegant font-medium"
                      >
                        Dashboard
                      </Button>
                      <Button
                        onClick={() => {
                          setIsOpen(false);
                          // Add sign out functionality here if needed
                        }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full justify-start font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/auth/login">Inloggen</Link>
                      </Button>
                      <Button
                        asChild
                        variant="gradient"
                        className="w-full justify-start font-medium"
                        onClick={() => {
                          setIsOpen(false);
                          handleCtaClick("mobile_primary");
                        }}
                      >
                        <Link href="/auth/register">Start Gratis</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}