"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { normalizeUrl } from "@/lib/url";
import { setPendingScanUrl } from "@/lib/pending-scan";
import { trackEvent } from "@/lib/analytics-events";

type ExampleFinding = {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  help: string;
  description: string;
  helpUrl: string;
};

type FreeScanResult = {
  url: string;
  title: string | null;
  standard: string;
  score: number;
  totalIssues: number;
  impactCritical: number;
  impactSerious: number;
  impactModerate: number;
  impactMinor: number;
  examples: ExampleFinding[];
};

type ScanState =
  | { phase: "idle" }
  | { phase: "scanning"; url: string }
  | { phase: "done"; result: FreeScanResult }
  | { phase: "rateLimited" }
  | { phase: "error"; message: string };

/**
 * Email capture — every visitor who typed a URL is a lead. On results it
 * mails the partial report; on error/rate-limit it promises a follow-up
 * (the founder is notified for manual delivery).
 */
function EmailCapture({
  phase,
  url,
  result,
}: {
  phase: "done" | "error" | "rate_limited";
  url: string;
  result?: FreeScanResult;
}) {
  const t = useTranslations("freeScan.emailCapture");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    trackEvent("free_scan_lead_submit", { phase });
    try {
      const res = await fetch("/api/free-scan/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          url,
          phase,
          locale: ["en", "nl", "de", "fr", "es", "pt"].includes(locale) ? locale : "en",
          result: result
            ? {
                score: result.score,
                totalIssues: result.totalIssues,
                impactCritical: result.impactCritical,
                impactSerious: result.impactSerious,
                impactModerate: result.impactModerate,
                impactMinor: result.impactMinor,
              }
            : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setStatus(res.ok && data?.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm font-medium" role="status">
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
        {phase === "done" ? t("successReport") : t("successFollowUp")}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
        {phase === "done" ? t("titleResults") : t("titleFallback")}
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row" noValidate>
        <label htmlFor={`lead-email-${phase}`} className="sr-only">
          {t("emailLabel")}
        </label>
        <input
          id={`lead-email-${phase}`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder={t("placeholder")}
          className="min-h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
        />
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            t("cta")
          )}
        </Button>
      </form>
      <div aria-live="polite">
        {status === "error" && (
          <p className="mt-2 text-xs font-medium text-destructive">{t("error")}</p>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("privacy")}</p>
    </div>
  );
}

const IMPACT_STYLES: Record<ExampleFinding["impact"], string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  serious: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-300",
  moderate: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  minor: "bg-muted text-muted-foreground border-border",
};

export function FreeScanClient() {
  const t = useTranslations("freeScan");
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url");

  const [state, setState] = useState<ScanState>({ phase: "idle" });
  const [inputUrl, setInputUrl] = useState("");
  const [inputError, setInputError] = useState("");
  const startedForUrl = useRef<string | null>(null);

  const runScan = useCallback(async (targetUrl: string) => {
    setState({ phase: "scanning", url: targetUrl });
    try {
      const res = await fetch("/api/free-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setState({ phase: "rateLimited" });
        return;
      }
      if (!res.ok || !data?.ok) {
        setState({ phase: "error", message: data?.error || t("errorGeneric") });
        return;
      }
      trackEvent("free_scan_completed", { score: data.result.score });
      setState({ phase: "done", result: data.result });
    } catch {
      setState({ phase: "error", message: t("errorGeneric") });
    }
  }, [t]);

  useEffect(() => {
    if (!urlParam) return;
    const normalized = normalizeUrl(urlParam);
    if (!normalized || startedForUrl.current === normalized) return;
    startedForUrl.current = normalized;
    runScan(normalized);
  }, [urlParam, runScan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(inputUrl);
    if (!normalized) {
      setInputError(t("urlInvalid"));
      return;
    }
    setInputError("");
    startedForUrl.current = normalized;
    router.replace(`/free-scan?url=${encodeURIComponent(normalized)}`);
    runScan(normalized);
  };

  const currentUrl =
    state.phase === "done"
      ? state.result.url
      : state.phase === "scanning"
        ? state.url
        : normalizeUrl(urlParam || inputUrl) || "";

  const handleRegisterClick = (location: string) => {
    const url =
      state.phase === "done"
        ? state.result.url
        : state.phase === "scanning"
          ? state.url
          : normalizeUrl(urlParam || inputUrl);
    if (url) setPendingScanUrl(url);
    trackEvent("free_scan_register_click", { location });
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <Badge variant="outline">{t("badge")}</Badge>
            <h1 className="font-sans text-3xl font-bold tracking-tight lg:text-4xl">
              {t("title")}
            </h1>
          </div>

          {state.phase === "idle" && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
                  <div className="flex-1">
                    <label htmlFor="free-scan-url" className="sr-only">
                      {t("urlLabel")}
                    </label>
                    <input
                      id="free-scan-url"
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        if (inputError) setInputError("");
                      }}
                      placeholder={t("urlPlaceholder")}
                      aria-describedby={inputError ? "free-scan-url-error" : undefined}
                      aria-invalid={inputError ? true : undefined}
                      className="min-h-12 w-full rounded-lg border border-border bg-background px-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>
                  <Button type="submit" size="lg" className="min-h-12">
                    {t("scanCta")}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
                <div aria-live="assertive" aria-atomic="true">
                  {inputError && (
                    <p id="free-scan-url-error" className="mt-2 text-sm font-medium text-destructive">
                      {inputError}
                    </p>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t("urlHint")}</p>
              </CardContent>
            </Card>
          )}

          {state.phase === "scanning" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
                <p className="font-medium" role="status">
                  {t("scanning", { url: state.url })}
                </p>
                <p className="max-w-md text-sm text-muted-foreground">{t("scanningHint")}</p>
              </CardContent>
            </Card>
          )}

          {state.phase === "rateLimited" && (
            <Card>
              <CardContent className="space-y-4 py-10 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                <h2 className="text-xl font-semibold">{t("rateLimitTitle")}</h2>
                <p className="mx-auto max-w-md text-muted-foreground">{t("rateLimitBody")}</p>
                <Button asChild size="lg">
                  <Link href="/auth/register" onClick={() => handleRegisterClick("rate_limit")}>
                    {t("gateCta")}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                {currentUrl && (
                  <div className="mx-auto max-w-md text-left">
                    <EmailCapture phase="rate_limited" url={currentUrl} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {state.phase === "error" && (
            <Card>
              <CardContent className="space-y-4 py-10 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
                <h2 className="text-xl font-semibold">{t("errorTitle")}</h2>
                <p className="mx-auto max-w-md text-muted-foreground">{state.message}</p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Button variant="outline" onClick={() => setState({ phase: "idle" })}>
                    {t("tryAgain")}
                  </Button>
                  <Button asChild>
                    <Link href="/auth/register" onClick={() => handleRegisterClick("error")}>
                      {t("gateCta")}
                    </Link>
                  </Button>
                </div>
                {currentUrl && (
                  <div className="mx-auto max-w-md text-left">
                    <EmailCapture phase="error" url={currentUrl} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {state.phase === "done" && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-sans text-lg font-semibold">
                      {state.result.title || state.result.url}
                    </CardTitle>
                    <Badge variant="secondary">{state.result.standard}</Badge>
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">{state.result.url}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-end gap-3">
                    <span className="font-sans text-6xl font-semibold leading-none">
                      {state.result.score}
                    </span>
                    <span className="pb-1 text-muted-foreground">{t("of100")}</span>
                    <span className="mb-1 ml-auto rounded-full bg-muted px-3 py-1 text-sm font-medium">
                      {t("issuesFound", { count: state.result.totalIssues })}
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${state.result.score} ${t("of100")}`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, state.result.score))}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        { key: "critical", count: state.result.impactCritical, label: t("severityCritical") },
                        { key: "serious", count: state.result.impactSerious, label: t("severitySerious") },
                        { key: "moderate", count: state.result.impactModerate, label: t("severityModerate") },
                        { key: "minor", count: state.result.impactMinor, label: t("severityMinor") },
                      ] as const
                    ).map((severity) => (
                      <div
                        key={severity.key}
                        className={`rounded-md border px-3 py-2.5 text-center ${IMPACT_STYLES[severity.key]}`}
                      >
                        <p className="text-xl font-semibold leading-tight">{severity.count}</p>
                        <p className="mt-1 text-xs font-medium leading-tight">{severity.label}</p>
                      </div>
                    ))}
                  </div>

                  {state.result.examples.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("examplesTitle")}
                      </h2>
                      {state.result.examples.map((finding) => (
                        <div key={finding.id} className="rounded-lg border border-border p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={IMPACT_STYLES[finding.impact]}>
                              {t(`severity${finding.impact.charAt(0).toUpperCase()}${finding.impact.slice(1)}` as
                                | "severityCritical"
                                | "severitySerious"
                                | "severityModerate"
                                | "severityMinor")}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">{finding.id}</span>
                          </div>
                          <p className="mt-2 text-sm font-medium">{finding.help}</p>
                          <a
                            href={finding.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {t("learnMore")}
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </div>
                      ))}
                      {state.result.totalIssues > state.result.examples.length && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lock className="h-4 w-4" aria-hidden="true" />
                          {t("moreIssues", {
                            count: state.result.totalIssues - state.result.examples.length,
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="space-y-4 py-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                  <h2 className="text-xl font-semibold">{t("gateTitle")}</h2>
                  <p className="mx-auto max-w-md text-muted-foreground">{t("gateBody")}</p>
                  <Button asChild size="lg">
                    <Link href="/auth/register" onClick={() => handleRegisterClick("results")}>
                      {t("gateCta")}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">{t("gateHint")}</p>
                </CardContent>
              </Card>

              <EmailCapture phase="done" url={state.result.url} result={state.result} />

              <p className="text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
