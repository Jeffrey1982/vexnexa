"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
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
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
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

          {/* Desktop Auth/CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Button 
                asChild
                className="button-hover shadow-elegant font-medium"
                onClick={() => handleCtaClick("navbar_dashboard")}
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button 
                asChild
                className="button-hover gradient-primary shadow-elegant font-medium text-sm relative overflow-hidden group"
                onClick={() => handleCtaClick("navbar_primary")}
              >
                <Link href="/auth/register">
                  <span className="relative z-10">Start Gratis</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                </Link>
              </Button>
            )}
            <AuthButton user={user} />
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
                
                <div className="pt-6">
                  <Button 
                    asChild 
                    className="w-full justify-start gradient-primary shadow-elegant font-medium"
                    onClick={() => {
                      setIsOpen(false);
                      handleCtaClick("mobile_primary");
                    }}
                  >
                    <Link href="/auth/register">Start Gratis</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}