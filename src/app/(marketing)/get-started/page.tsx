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

export default function GetStartedPage() {
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
        throw new Error("Please enter a URL");
      }

      try {
        new URL(url);
      } catch {
        throw new Error("Please enter a valid URL");
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
              Quick start
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold font-display mb-4">
              Get started with your first scan
            </h1>
            <p className="text-xl text-muted-foreground">
              Enter your website URL and we&apos;ll run a comprehensive accessibility scan
            </p>
          </div>

          {/* Main Form Card */}
          <Card className="shadow-lg mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Start your first scan</CardTitle>
              <CardDescription>
                We&apos;ll analyze your website for accessibility issues and provide actionable
                recommendations
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
                    Website URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="text-base"
                    aria-describedby="url-help"
                  />
                  <p id="url-help" className="text-sm text-muted-foreground">
                    Enter the full URL of the page you want to scan
                  </p>
                </div>

                {/* Frequency Selection */}
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-base">
                    Scan frequency
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="frequency" aria-describedby="frequency-help">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time scan</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p id="frequency-help" className="text-sm text-muted-foreground">
                    {frequency === "once"
                      ? "Run a single scan now"
                      : `Automatically scan your site ${frequency}`}
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
                      Email me when the scan is complete
                    </Label>
                    <p id="notify-help" className="text-sm text-muted-foreground">
                      You&apos;ll receive a notification with a link to view your results
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
                      Starting scan...
                    </>
                  ) : (
                    <>
                      Start accessibility scan
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                What happens next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Scan runs automatically</h3>
                  <p className="text-sm text-muted-foreground">
                    Our scanner analyzes your page for WCAG compliance + 8 additional
                    accessibility categories
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">View your detailed report</h3>
                  <p className="text-sm text-muted-foreground">
                    See prioritized issues with code snippets, screenshots, and clear
                    remediation steps
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Fix top issues → re-scan → improve</h3>
                  <p className="text-sm text-muted-foreground">
                    Work through issues by priority, re-scan to track progress, and share
                    reports with your team
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Not ready to scan yet?{" "}
              <Link href="/features" className="text-primary hover:underline">
                Learn more about our features
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
