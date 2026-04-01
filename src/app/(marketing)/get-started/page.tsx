"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Zap,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function GetStartedPage() {
  const t = useTranslations('getStarted');
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [notify, setNotify] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate URL
      if (!url) {
        throw new Error(t('errors.urlRequired'));
      }

      try {
        new URL(url);
      } catch {
        throw new Error(t('errors.urlInvalid'));
      }

      // Here you would typically create the scan
      // For now, we'll just redirect to the dashboard
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              {t('header.badge')}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold font-display mb-4">
              {t('header.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('header.subtitle')}
            </p>
          </div>

          {/* Main Form Card */}
          <Card className="shadow-lg mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">{t('form.title')}</CardTitle>
              <CardDescription>
                {t('form.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-base">
                    {t('form.url.label')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder={t('form.url.placeholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="text-base"
                    aria-describedby="url-help"
                  />
                  <p id="url-help" className="text-sm text-muted-foreground">
                    {t('form.url.help')}
                  </p>
                </div>

                {/* Frequency Selection */}
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-base">
                    {t('form.frequency.label')}
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="frequency" aria-describedby="frequency-help">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">{t('form.frequency.once')}</SelectItem>
                      <SelectItem value="weekly">{t('form.frequency.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('form.frequency.monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p id="frequency-help" className="text-sm text-muted-foreground">
                    {frequency === "once"
                      ? t('form.frequency.help.once')
                      : t('form.frequency.help.recurring', { frequency })}
                  </p>
                </div>

                {/* Notification Toggle */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="notify"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-2"
                    aria-describedby="notify-help"
                  />
                  <div className="flex-1">
                    <Label htmlFor="notify" className="text-base font-normal cursor-pointer">
                      {t('form.notify.label')}
                    </Label>
                    <p id="notify-help" className="text-sm text-muted-foreground">
                      {t('form.notify.help')}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('form.submit.loading')}
                    </>
                  ) : (
                    <>
                      {t('form.submit.text')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t('nextSteps.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('nextSteps.step1.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('nextSteps.step1.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('nextSteps.step2.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('nextSteps.step2.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('nextSteps.step3.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('nextSteps.step3.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              {t('footer.notReady')}{" "}
              <Link href="/features" className="text-primary hover:underline">
                {t('footer.learnMore')}
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('footer.haveAccount')}{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                {t('footer.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
