"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Changelog", href: "/changelog" },
  { name: "Contact", href: "/contact" },
];

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCtaClick = (location: string) => {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track("cta_click", { location });
    }
  };

  return (
    <nav className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-display font-bold text-xl">TutusPorta</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="ghost" 
              asChild
              onClick={() => handleCtaClick("navbar_demo")}
            >
              <Link href="/dashboard">Demo</Link>
            </Button>
            <Button 
              asChild
              onClick={() => handleCtaClick("navbar_primary")}
            >
              <Link href="/dashboard">Start gratis scan</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">T</span>
                    </div>
                    <span className="font-display font-bold text-xl">TutusPorta</span>
                  </Link>
                </SheetTitle>
                <SheetDescription>
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
                
                <div className="pt-4 space-y-3">
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full"
                    onClick={() => {
                      setIsOpen(false);
                      handleCtaClick("mobile_demo");
                    }}
                  >
                    <Link href="/dashboard">Demo</Link>
                  </Button>
                  <Button 
                    asChild 
                    className="w-full"
                    onClick={() => {
                      setIsOpen(false);
                      handleCtaClick("mobile_primary");
                    }}
                  >
                    <Link href="/dashboard">Start gratis scan</Link>
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