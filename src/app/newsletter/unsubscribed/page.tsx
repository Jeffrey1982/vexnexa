"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

export default function NewsletterUnsubscribedPage() {
  const t = useTranslations("newsletter.unsubscribed");
  const details = t.raw("details") as Array<{ icon: string; text: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl text-gray-800">{t("title")}</CardTitle>
          <CardDescription className="text-lg">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-muted-foreground mr-2" />
              <span className="font-semibold text-gray-800">{t("confirmationSent")}</span>
            </div>
            <p className="text-gray-700 text-sm">
              {t("confirmationMessage")}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">{t("whatThisMeans")}</h3>
            <div className="space-y-2 text-sm text-left">
              {details.map((item, index) => (
                <div key={index} className="flex items-start text-muted-foreground">
                  <span className="mr-2 mt-0.5">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm" dangerouslySetInnerHTML={{ __html: t("accidentalNote") }} />
          </div>

          <div className="pt-4 space-y-3">
            <Button asChild className="w-full">
              <Link href="/#newsletter">
                {t("resubscribe")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">{t("backToHome")}</Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p dangerouslySetInnerHTML={{ __html: t("feedbackNote") }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
