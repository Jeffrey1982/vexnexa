"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Fixed dark palette — the console is a physical "instrument" that stays
 * dark in both site themes (Option A). Colours are hardcoded on purpose so
 * they do not follow the light/dark tokens the rest of the hero uses.
 * Secondary text (`muted`) is kept above 4.5:1 on `bg` for real AA contrast.
 */
const C = {
  bg: "#111815",
  sunken: "#0C120F",
  border: "#23302A",
  ink: "#ECF3EE",
  muted: "#9DB0A4",
  green: "#4FBF7F",
  critical: "#FF6B6B",
  serious: "#F6B24A",
  moderate: "#6FC095",
  minor: "#9DB0A4",
} as const;

const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;

export type Severity = "critical" | "serious" | "moderate" | "minor";
export type Finding = { name: string; impact: Severity; ref?: string };

export type ConsoleState =
  | { phase: "scanning"; url: string }
  | {
      phase: "result";
      url: string;
      isDemo: boolean;
      score: number;
      counts: Record<Severity, number>;
      total: number;
      findings: Finding[];
    }
  | { phase: "error"; url: string; kind: "rate" | "generic"; retryHref: string };

const SEV_COLOR: Record<Severity, string> = {
  critical: C.critical,
  serious: C.serious,
  moderate: C.moderate,
  minor: C.minor,
};

/**
 * Whether we may animate: needs a browser that can report a motion
 * preference and a rAF loop, and the user must not have asked to reduce
 * motion. When we can't tell (SSR, tests), fall back to instant final
 * states rather than animating blindly.
 */
function canAnimate(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    typeof requestAnimationFrame === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ScanConsole({ state }: { state: ConsoleState }) {
  const t = useTranslations("hero");
  const scanning = state.phase === "scanning";
  const result = state.phase === "result" ? state : null;
  const error = state.phase === "error" ? state : null;

  const host = state.url.replace(/^https?:\/\//, "") || "your-agency-client.nl";
  const targetScore = result?.score ?? 0;

  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progressStep, setProgressStep] = useState(0);

  // Count the score up whenever a result is revealed (guarded for reduced motion / SSR).
  useEffect(() => {
    if (!result) {
      setDisplayScore(0);
      return;
    }
    if (!canAnimate()) {
      setDisplayScore(targetScore);
      return;
    }
    const start = performance.now();
    const DUR = 1150;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(targetScore * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [result, targetScore]);

  // Cycle the honest progress messages while scanning.
  useEffect(() => {
    if (!scanning) {
      setProgressStep(0);
      return;
    }
    progressTimer.current = setInterval(() => {
      setProgressStep((s) => (s + 1) % 3);
    }, 1400);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [scanning]);

  const progressLabel = t(`console.progress${progressStep + 1}` as "console.progress1");
  const arcOffset = result ? RING_C * (1 - targetScore / 100) : RING_C;

  return (
    <figure
      className="relative mx-auto w-full max-w-full lg:mx-0 lg:max-w-3xl"
      style={{ color: C.ink }}
    >
      <figcaption className="sr-only">{t("scanCardLabel")}</figcaption>

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          boxShadow: "0 40px 90px -50px rgba(0,0,0,0.9)",
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ background: C.sunken, borderBottom: `1px solid ${C.border}` }}
        >
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.border }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.border }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.border }} />
          </span>
          <span
            className="min-w-0 flex-1 truncate font-mono text-xs"
            style={{ color: C.muted }}
          >
            https://{host}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: scanning ? C.serious : C.green }}
              aria-hidden="true"
            />
            <span style={{ color: scanning ? C.serious : C.green }}>
              {scanning ? t("console.scanningTag") : t("liveLabel")}
            </span>
          </span>
        </div>

        {/* Body */}
        <div className="relative p-5 sm:p-6">
          {scanning && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <span
                className="absolute inset-y-0 w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,rgba(79,191,127,0.18),transparent)",
                  animation: "vnScanSweep 1s linear infinite",
                }}
              />
            </div>
          )}

          {error ? (
            <ErrorState error={error} />
          ) : (
            <>
              {/* Score + meta */}
              <div className="flex flex-wrap items-center gap-5">
                <div
                  className="relative flex-none"
                  style={{ width: 128, height: 128 }}
                  role="img"
                  aria-label={`${t("scanCardLabel")}: ${displayScore} ${t("scanCardScore")}`}
                >
                  <svg width="128" height="128" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                    <circle cx="66" cy="66" r={RING_R} fill="none" stroke={C.border} strokeWidth="10" />
                    <circle
                      cx="66"
                      cy="66"
                      r={RING_R}
                      fill="none"
                      stroke={C.green}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={arcOffset}
                      style={{ transition: "stroke-dashoffset 1.15s cubic-bezier(0.22,0.7,0.2,1)" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-4xl font-medium tabular-nums leading-none">
                      {scanning ? "—" : displayScore}
                    </span>
                    <span className="mt-1 font-mono text-[11px]" style={{ color: C.muted }}>
                      {t("scanCardScore")}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                    {result?.isDemo ? t("console.sampleTag") : "WCAG 2.2 AA"}
                  </p>
                  <p className="mt-1.5 truncate font-mono text-[15px]">{host}</p>
                  {result && (
                    <p className="mt-3 inline-flex items-center gap-2 text-[13px]" style={{ color: C.muted }}>
                      <span
                        className="rounded-md px-2 py-0.5 font-mono text-[11px]"
                        style={{ color: C.serious, border: `1px solid rgba(246,178,74,0.35)`, background: "rgba(246,178,74,0.10)" }}
                      >
                        {t("console.needsAttention")}
                      </span>
                      {t("console.issuesShort", { count: result.total })}
                    </p>
                  )}
                </div>
              </div>

              {/* Severity tiles */}
              <div className="mt-5 grid grid-cols-4 gap-2" aria-label={t("scanCardLabel")}>
                {(["critical", "serious", "moderate", "minor"] as Severity[]).map((sev, i) => (
                  <div
                    key={sev}
                    className="rounded-lg px-2.5 py-2.5 text-left"
                    style={{
                      background: C.sunken,
                      border: `1px solid ${sev === "critical" || sev === "serious" ? SEV_COLOR[sev] + "4d" : C.border}`,
                      animation: result ? `slideUp 0.4s ease both ${0.12 + i * 0.09}s` : undefined,
                      opacity: result ? undefined : 0.35,
                    }}
                  >
                    <p className="font-mono text-[22px] font-medium tabular-nums leading-none" style={{ color: SEV_COLOR[sev] }}>
                      {result ? result.counts[sev] : "0"}
                    </p>
                    <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
                      {t(`severity${sev.charAt(0).toUpperCase()}${sev.slice(1)}` as "severityCritical")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Findings */}
              <div className="mt-4 flex flex-col gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  {t("console.topFindings")}
                </p>
                {(result?.findings ?? []).slice(0, 3).map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: C.sunken,
                      border: `1px solid ${C.border}`,
                      animation: `fadeIn 0.45s ease both ${0.5 + i * 0.14}s`,
                    }}
                  >
                    <span className="h-2 w-2 flex-none rounded-full" style={{ background: SEV_COLOR[f.impact] }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px]">{f.name}</span>
                      {f.ref && (
                        <span className="mt-0.5 block font-mono text-[11px]" style={{ color: C.muted }}>
                          {f.ref}
                        </span>
                      )}
                    </span>
                    <span
                      className="flex-none rounded px-1.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: SEV_COLOR[f.impact], background: SEV_COLOR[f.impact] + "1f" }}
                    >
                      {t(`severity${f.impact.charAt(0).toUpperCase()}${f.impact.slice(1)}` as "severityCritical")}
                    </span>
                  </div>
                ))}
                {scanning && (
                  <p className="inline-flex items-center gap-2 px-1 py-2 font-mono text-[12px]" style={{ color: C.muted }} aria-live="polite">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    {progressLabel}
                  </p>
                )}
              </div>

              {result && !result.isDemo && (
                <Link
                  href="/auth/register"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold"
                  style={{ background: C.green, color: C.sunken }}
                >
                  {t("console.fullReport")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </div>

        {/* Foot */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 font-mono text-[11px]"
          style={{ background: C.sunken, borderTop: `1px solid ${C.border}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: C.green }} aria-hidden="true" />
            {t("trustLabel")}
          </span>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[11.5px] leading-relaxed" style={{ color: "var(--color-hero-muted)" }}>
        {t("console.caption")}
      </p>
    </figure>
  );
}

function ErrorState({ error }: { error: Extract<ConsoleState, { phase: "error" }> }) {
  const t = useTranslations("hero");
  return (
    <div className="flex flex-col items-start gap-4 py-6">
      <p className="text-[15px]" style={{ color: C.ink }}>
        {error.kind === "rate" ? t("console.errorRateLimit") : t("console.errorGeneric")}
      </p>
      {error.kind === "rate" ? (
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ background: C.green, color: C.sunken }}
        >
          {t("console.createAccount")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href={error.retryHref}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ background: C.green, color: C.sunken }}
        >
          {t("console.retry")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
