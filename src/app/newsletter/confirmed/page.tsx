"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

type Expectation = {
  icon: string;
  text: string;
};

const updatesExpectations: Expectation[] = [
  { icon: "Status", text: "Public status notes" },
  { icon: "Fixes", text: "Known issue updates" },
  { icon: "Product", text: "Reliability updates" },
  { icon: "Low volume", text: "Only when it matters" },
];

function NewsletterConfirmedContent() {
  const t = useTranslations("newsletter.confirmed");
  const searchParams = useSearchParams();
  const isUpdatesSignup = searchParams.get("type") === "updates";

  const expectations = isUpdatesSignup
    ? updatesExpectations
    : (t.raw("expectations") as Expectation[]);

  const copy = isUpdatesSignup
    ? {
        title: "Status & Updates confirmed",
        subtitle: "You're now subscribed to VexNexa Status & Updates",
        emailSent: "Updates subscription active",
        checkInbox: "We'll only email you about relevant status notes, known issues, and important product updates.",
        whatToExpect: "What can you expect?",
        primaryHref: "/updates",
        primaryLabel: "View Status & Updates",
        backToHome: t("backToHome"),
        gdprNote:
          "GDPR compliant: You can always unsubscribe via the link in every update, or by sending an email to info@vexnexa.com.",
      }
    : {
        title: t("title"),
        subtitle: t("subtitle"),
        emailSent: t("emailSent"),
        checkInbox: t("checkInbox"),
        whatToExpect: t("whatToExpect"),
        primaryHref: "/dashboard",
        primaryLabel: t("startScan"),
        backToHome: t("backToHome"),
        gdprNote: t("gdprNote"),
      };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">{copy.title}</CardTitle>
          <CardDescription className="text-lg">
            {copy.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">{copy.emailSent}</span>
            </div>
            <p className="text-green-700 text-sm">
              {copy.checkInbox}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">{copy.whatToExpect}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {expectations.map((item, index) => (
                <div key={index} className="flex items-center text-muted-foreground">
                  <span className="mr-2 text-xs font-medium text-green-700">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button asChild className="w-full">
              <Link href={copy.primaryHref}>
                {copy.primaryLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">{copy.backToHome}</Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            {isUpdatesSignup ? (
              <p>{copy.gdprNote}</p>
            ) : (
              <p dangerouslySetInnerHTML={{ __html: copy.gdprNote }} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewsletterConfirmedPage() {
  return (
    <Suspense>
      <NewsletterConfirmedContent />
    </Suspense>
  );
}
