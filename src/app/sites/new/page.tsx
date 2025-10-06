"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Globe, Loader2, Play } from "lucide-react";
import Link from "next/link";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { createClient } from "@/lib/supabase/client-new";

export default function NewSitePage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    let validUrl: string;
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = 'https://' + url;
      } else {
        validUrl = url;
      }
      new URL(validUrl); // This will throw if invalid
    } catch {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Run real accessibility scan
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: validUrl }),
      });

      const result = await response.json();

      if (result.ok && result.scanId) {
        // Redirect to scan detail page (same as dashboard)
        router.push(`/scans/${result.scanId}`);
      } else {
        setError(result.error || 'Scan failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Website</h1>
          <p className="text-gray-600 mt-2">
            Enter a website URL to start running accessibility scans
          </p>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Website URL
            </CardTitle>
            <CardDescription>
              We&apos;ll scan this website for WCAG accessibility compliance issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or example.com"
                  className="h-12"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">
                  You can enter just the domain name or the full URL
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading || !url}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Accessibility Scan...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Accessibility Scan
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What we&apos;ll check:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• WCAG 2.1 accessibility compliance</li>
                <li>• Color contrast ratios</li>
                <li>• Alt text for images</li>
                <li>• Keyboard navigation</li>
                <li>• Form accessibility</li>
                <li>• Screen reader compatibility</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>First scan?</strong> Try scanning your homepage first to get an overview of your site&apos;s accessibility status.
            </p>
            <p>
              <strong>Need help?</strong> Our scans are based on WCAG 2.1 AA standards and will help you identify common accessibility issues.
            </p>
            <p>
              <strong>Results:</strong> You&apos;ll get a detailed report with specific issues and recommendations for fixes.
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}