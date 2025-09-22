"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl text-gray-800">Uitgeschreven</CardTitle>
          <CardDescription className="text-lg">
            Je ontvangt geen nieuwsbrieven meer van TutusPorta
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-semibold text-gray-800">Uitschrijving bevestigd</span>
            </div>
            <p className="text-gray-700 text-sm">
              Je ontvangt een bevestigingsmail van je uitschrijving.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Wat betekent dit?</h3>
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-start text-gray-600">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Je ontvangt geen marketing emails meer</span>
              </div>
              <div className="flex items-start text-gray-600">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Transactionele emails (zoals account bevestigingen) ontvang je nog wel</span>
              </div>
              <div className="flex items-start text-gray-600">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Je data wordt bewaard conform ons privacybeleid</span>
              </div>
              <div className="flex items-start text-gray-600">
                <span className="mr-2 mt-0.5">↻</span>
                <span>Je kunt je altijd opnieuw inschrijven</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Per ongeluk uitgeschreven?</strong><br>
              Geen probleem! Je kunt je opnieuw inschrijven via onze homepage.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button asChild className="w-full">
              <Link href="/#newsletter">
                Opnieuw inschrijven
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">Terug naar homepage</Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>
              <strong>Feedback:</strong> We zouden graag weten waarom je je hebt uitgeschreven.
              <a href="mailto:info@tutusporta.com?subject=Uitschrijving feedback" className="text-blue-600 hover:underline ml-1">
                Deel je feedback
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}