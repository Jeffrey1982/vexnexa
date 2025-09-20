import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/about" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar over ons
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-6">
              Plan een <span className="text-primary">persoonlijke demo</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ontdek hoe TutuSporta jouw team kan helpen met WCAG-compliance en toegankelijkheid
            </p>
          </div>

          {/* Demo Benefits */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card rounded-xl p-8 shadow-elegant border border-border/50">
              <h2 className="text-2xl font-semibold mb-6">Wat je krijgt in 15 minuten:</h2>
              <ul className="space-y-4">
                {[
                  "Live demo van het TutuSporta platform",
                  "Inzicht in automated WCAG scanning",
                  "Rapportage en prioritering uitgelegd",
                  "Team collaboratie features",
                  "Q&A over jouw specifieke behoeften"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-elegant border border-border/50">
              <h2 className="text-2xl font-semibold mb-6">Voor wie is dit?</h2>
              <ul className="space-y-4">
                {[
                  "Development teams (5+ developers)",
                  "Digital agencies met meerdere klanten",
                  "Enterprise organisaties",
                  "Teams die WCAG-compliance nodig hebben",
                  "Organisaties met accessibility requirements"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-primary/5 rounded-xl p-8 border border-primary/20">
            <h2 className="text-2xl font-semibold mb-4">
              Klaar om te starten?
            </h2>
            <p className="text-muted-foreground mb-6">
              Of begin direct met een gratis scan van je website
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/contact">
                  <Calendar className="w-4 h-4 mr-2" />
                  Plan een demo
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  Start gratis scan
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Geen verplichtingen • Demo duurt ~15 minuten • Response binnen 24 uur
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}