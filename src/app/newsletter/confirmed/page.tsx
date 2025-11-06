"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

export default function NewsletterConfirmedPage() {
  const t = useTranslations("newsletter.confirmed");
  const expectations = t.raw("expectations") as Array<{ icon: string; text: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">{t("title")}</CardTitle>
          <CardDescription className="text-lg">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">{t("emailSent")}</span>
            </div>
            <p className="text-green-700 text-sm">
              {t("checkInbox")}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">{t("whatToExpect")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {expectations.map((item, index) => (
                <div key={index} className="flex items-center text-gray-600">
                  <span className="mr-2">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                {t("startScan")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">{t("backToHome")}</Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p dangerouslySetInnerHTML={{ __html: t("gdprNote") }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
