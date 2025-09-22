"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function NewsletterInvalidPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const getContent = () => {
    switch (reason) {
      case "token":
        return {
          title: "Ongeldige link",
          description: "Deze bevestigingslink is niet geldig of verlopen",
          details: [
            "De link is mogelijk verlopen (links zijn 7 dagen geldig)",
            "De link is al gebruikt",
            "De link is beschadigd tijdens het kopiëren"
          ],
          suggestion: "Probeer je opnieuw in te schrijven voor een nieuwe bevestigingslink."
        };
      case "unsubscribed":
        return {
          title: "Account uitgeschreven",
          description: "Dit e-mailadres is al uitgeschreven van onze nieuwsbrief",
          details: [
            "Je hebt je al eerder uitgeschreven",
            "Deze link kan niet meer gebruikt worden"
          ],
          suggestion: "Als je je opnieuw wilt inschrijven, ga dan naar onze homepage."
        };
      default:
        return {
          title: "Probleem met link",
          description: "Er is een probleem met deze nieuwsbrief link",
          details: [
            "De link is mogelijk beschadigd",
            "De link is niet meer geldig"
          ],
          suggestion: "Neem contact op met ons support team voor hulp."
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-orange-800">{content.title}</CardTitle>
          <CardDescription className="text-lg">
            {content.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Mogelijke oorzaken:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {content.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Wat kun je doen?</strong><br />
              {content.suggestion}
            </p>
          </div>

          <div className="pt-4 space-y-3">
            {reason !== "unsubscribed" ? (
              <Button asChild className="w-full">
                <Link href="/#newsletter">
                  Opnieuw inschrijven
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/#newsletter">
                  Inschrijven voor nieuwsbrief
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link href="/contact">Contact opnemen</Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/">Terug naar homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}