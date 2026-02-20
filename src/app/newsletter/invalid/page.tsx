"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function NewsletterInvalidContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const t = useTranslations("newsletter.invalid");

  const getContent = () => {
    switch (reason) {
      case "token":
        return {
          title: t("title.token"),
          description: t("description.token"),
          details: t.raw("causes.token") as string[],
          suggestion: t("whatToDo.token")
        };
      case "unsubscribed":
        return {
          title: t("title.unsubscribed"),
          description: t("description.unsubscribed"),
          details: t.raw("causes.unsubscribed") as string[],
          suggestion: t("whatToDo.unsubscribed")
        };
      default:
        return {
          title: t("title.default"),
          description: t("description.default"),
          details: t.raw("causes.default") as string[],
          suggestion: t("whatToDo.default")
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
            <h3 className="font-semibold text-gray-900">{t("possibleCauses")}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {content.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm" dangerouslySetInnerHTML={{ __html: t.markup("whatToDoHeader", { suggestion: content.suggestion }) }} />
          </div>

          <div className="pt-4 space-y-3">
            {reason !== "unsubscribed" ? (
              <Button asChild className="w-full">
                <Link href="/#newsletter">
                  {t("buttons.tryAgain")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/#newsletter">
                  {t("buttons.subscribeNewsletter")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link href="/contact">{t("buttons.contact")}</Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/">{t("buttons.backToHome")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewsletterInvalidPage() {
  const t = useTranslations("newsletter.invalid");

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-800">{t("loading")}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <NewsletterInvalidContent />
    </Suspense>
  );
}
