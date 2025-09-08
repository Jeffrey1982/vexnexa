"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
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

      if (response.ok) {
        toast({
          title: "Bedankt voor je inschrijving!",
          description: "We houden je op de hoogte van nieuwe features en tips.",
        });
        setEmail("");
      } else if (response.status === 409) {
        toast({
          title: "Dit e-mailadres staat al ingeschreven",
          description: "Bedankt voor je interesse!",
        });
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Er ging iets mis",
        description: "Probeer het later opnieuw.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t bg-muted/50", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Newsletter */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="font-display font-bold text-xl">TutusPorta</span>
            </Link>
            
            <p className="text-muted-foreground max-w-md">
              WCAG-scans die wél inzicht geven. Voer een URL in en krijg een concreet rapport 
              met prioriteiten, voorbeelden en quick wins.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-2">
              <h3 className="font-semibold">Blijf op de hoogte</h3>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="je@email.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <Button type="submit" disabled={isSubmitting}>
                  <Mail className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">
                Changelog
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Support & Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                Over ons
              </Link>
            </div>
            
            <h3 className="font-semibold pt-2">Juridisch</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Voorwaarden
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <span>Gemaakt met</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>in NL © {currentYear}</span>
            </div>
            
            <div className="text-xs text-muted-foreground max-w-md text-center md:text-right">
              Wij scannen publiek toegankelijke content en slaan geen persoonsgegevens op vanuit pagina's.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}