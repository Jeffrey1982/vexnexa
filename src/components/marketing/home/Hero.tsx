"use client";

import { useRef, useState } from "react";
import Link from "@/components/marketing/MarketingLink";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { normalizeUrl } from "@/lib/url";
import { setPendingScanUrl } from "@/lib/pending-scan";
import { trackEvent } from "@/lib/analytics-events";
import { ScanConsole, type ConsoleState, type Severity, type Finding } from "./ScanConsole";
import s from "./home.module.css";

type TFn = ReturnType<typeof useTranslations>;
type RawExample = { id: string; impact: string; help?: string; description?: string };

function buildDemo(t: TFn): ConsoleState {
  return {
    phase: "result", url: "example-client.com", isDemo: true, score: 72, total: 31,
    counts: { critical: 3, serious: 8, moderate: 14, minor: 6 },
    findings: [
      { name: t("console.demoFind1"), impact: "critical", ref: "WCAG 4.1.2" },
      { name: t("console.demoFind2"), impact: "serious", ref: "WCAG 1.4.3" },
      { name: t("console.demoFind3"), impact: "serious", ref: "WCAG 3.3.2" },
    ],
  };
}

export function Hero() {
  const t = useTranslations("hero");
  const b = useTranslations("brandHome");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [scan, setScan] = useState<ConsoleState>(() => buildDemo(t));
  const submitting = useRef(false);
  const scanning = scan.phase === "scanning";

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    const normalized = normalizeUrl(url);
    if (!normalized) { setError(t("urlInvalid")); return; }
    submitting.current = true;
    setError("");
    setPendingScanUrl(normalized);
    trackEvent("hero_scan_submit", { location: "hero" });
    setScan({ phase: "scanning", url: normalized });
    const retryHref = `/free-scan?url=${encodeURIComponent(normalized)}`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch("/api/free-scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }), signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.result) {
        const r = data.result;
        const findings: Finding[] = (r.examples ?? []).slice(0, 3).map((ex: RawExample) => ({
          name: ex.help || ex.description || ex.id,
          impact: (["critical", "serious", "moderate", "minor"].includes(ex.impact) ? ex.impact : "moderate") as Severity,
        }));
        setScan({ phase: "result", url: normalized, isDemo: false, score: r.score ?? 0, total: r.totalIssues ?? 0,
          counts: { critical: r.impactCritical ?? 0, serious: r.impactSerious ?? 0, moderate: r.impactModerate ?? 0, minor: r.impactMinor ?? 0 }, findings });
      } else {
        setScan({ phase: "error", url: normalized, kind: data?.code === "RATE_LIMITED" ? "rate" : "generic", retryHref });
      }
    } catch {
      setScan({ phase: "error", url: normalized, kind: "generic", retryHref });
    } finally {
      window.clearTimeout(timeout);
      submitting.current = false;
    }
  };

  return (
    <section className={s.hero} aria-labelledby="hero-heading">
      <div className={`${s.wrap} ${s.heroGrid}`}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}><span className={s.brandDot} aria-hidden="true" />{b("eyebrow")}</p>
          <h1 id="hero-heading">{b("headline")}<span>{b("headlineAccent")}</span></h1>
          <p className={s.heroIntro}>{b("intro")}</p>
          <form onSubmit={handleScanSubmit} className={s.scanForm} noValidate aria-busy={scanning}>
            <label htmlFor="hero-scan-url">{t("urlLabel")}</label>
            <div className={s.scanInputRow}>
              <input id="hero-scan-url" type="text" inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false}
                value={url} onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
                placeholder={t("urlPlaceholder")} aria-describedby={error ? "hero-scan-error" : "hero-scan-hint"} aria-invalid={error ? true : undefined} />
              <button type="submit" className={s.primaryButton} disabled={scanning}>
                {scanning ? b("scanBusy") : t("ctaPrimary")}
                {scanning ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
              </button>
            </div>
            <div aria-live="assertive" aria-atomic="true">{error && <p id="hero-scan-error" className={s.formError}>{error}</p>}</div>
            <p id="hero-scan-hint" className={s.formHint}><Check aria-hidden="true" />{t("urlHint")}</p>
          </form>
          <Link href="/sample-report" className={s.textLink}>{t("ctaSecondary")}<ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={s.consoleStage}>
          <div className={s.stageLabel}><span>VexNexa / WCAG 2.2</span><span>01</span></div>
          <ScanConsole state={scan} />
          <p className={s.stageCaption}>{scan.phase === "result" && scan.isDemo ? b("demoHint") : b("scopeNote")}</p>
        </div>
      </div>
    </section>
  );
}
