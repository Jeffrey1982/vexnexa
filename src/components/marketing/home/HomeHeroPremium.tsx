"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

/*
 * ── Performance notes ──
 * • Zero Framer Motion — saves ~40 kB gzipped from the critical bundle.
 * • All visual animations are CSS-only using transform / opacity (GPU-composited).
 * • Progress bar uses scaleX(0→1) instead of width — avoids layout thrash.
 * • Score counter: single rAF loop mutating textContent directly — no React re-renders.
 * • SVG ring stroke-dashoffset driven by the same rAF loop.
 * • Issue cards + report: pure CSS delayed opacity+translateY, no JS timers.
 * • prefers-reduced-motion: CSS disables all animations; JS skips counter.
 * • Mobile: fully static — no animations, no JS overhead.
 * • will-change only on actively animating elements.
 * • LCP-critical: H1 + subheadline render at full opacity immediately (no fade-in).
 * • Background blur hidden on mobile to reduce GPU compositing cost.
 * • Accent palette: blue-500 (#3b82f6) + slate-700 base.
 */

/* ── Circumference constant for score ring (r=34) ── */
const RING_C = 2 * Math.PI * 34; // ≈ 213.63
const SCORE_START = 68;
const SCORE_END = 94;

/* ────────────────────────────────────────────
   Dashboard Mockup — CSS-animated, minimal JS
   ──────────────────────────────────────────── */
function DashboardMockup() {
  const t = useTranslations("home.heroMockup");
  const scoreRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  const animateScore = useCallback(() => {
    const el = scoreRef.current;
    const ring = ringRef.current;
    const pct = pctRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.textContent = String(SCORE_END);
      if (ring) ring.style.strokeDashoffset = String(RING_C * (1 - SCORE_END / 100));
      if (pct) pct.textContent = `${SCORE_END}%`;
      return;
    }

    const duration = 2600;
    const delay = 800;

    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number): void => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const v = Math.round(SCORE_START + (SCORE_END - SCORE_START) * eased);
        el.textContent = String(v);
        if (ring) ring.style.strokeDashoffset = String(RING_C * (1 - v / 100));
        if (pct) pct.textContent = v > 90 ? `${SCORE_END}%` : "...%";
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const cleanup = animateScore();
    return cleanup;
  }, [animateScore]);

  return (
    <div
      className="hero-mockup relative rounded-3xl border border-slate-700/60 bg-zinc-900/80 p-5 shadow-xl"
      role="img"
      aria-label={t("ariaLabel")}
    >
      {/* Dashboard header — typographic logo, no SVG icon */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-700/50 pb-3">
        <span className="text-[15px] font-bold tracking-wide text-white">
          Vex<span className="text-blue-500">Nexa</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-blue-400">{t("liveScan")}</span>
        </div>
      </div>

      {/* Target URL */}
      <div className="mb-4 rounded-xl bg-zinc-800/70 px-4 py-2.5 border border-slate-700/40">
        <p className="text-[11px] text-zinc-500 mb-0.5">{t("target")}</p>
        <p className="text-sm font-medium text-zinc-200 tracking-tight">yourclient.com</p>
      </div>

      {/* Progress bar — scaleX animation (GPU, no layout) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-zinc-400">{t("scanProgress")}</span>
          <span ref={pctRef} className="text-[11px] font-semibold text-blue-400">...%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className="hero-bar h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 origin-left" />
        </div>
      </div>

      {/* Score display */}
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-zinc-800/50 border border-slate-700/30 p-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              ref={ringRef}
              cx="40" cy="40" r="34" fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - SCORE_START / 100)}
            />
          </svg>
          <span ref={scoreRef} className="absolute text-2xl font-bold tabular-nums text-blue-400">
            {SCORE_START}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-100">{t("complianceScore")}</p>
          <p className="text-[13px] text-zinc-400">WCAG 2.2 Level AA</p>
        </div>
      </div>

      {/* Issue cards — CSS-only delayed fade-in */}
      <div className="hero-issues mb-4 space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-500/20">
            <span className="text-[10px] font-bold text-red-400">!</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-red-300 truncate">{t("missingAlt")}</p>
            <p className="text-[10px] text-red-400/70">{t("criticalElements")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20">
            <span className="text-[10px] font-bold text-amber-400">~</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-amber-300 truncate">{t("lowContrast")}</p>
            <p className="text-[10px] text-amber-400/70">{t("moderateElements")}</p>
          </div>
        </div>
      </div>

      {/* White-label report — CSS-only delayed scale+fade */}
      <div className="hero-report rounded-2xl border border-blue-500/20 bg-gradient-to-br from-zinc-800/80 to-zinc-800/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-slate-600" />
            <span className="text-[11px] font-semibold text-zinc-300">Your Digital Agency</span>
          </div>
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
            {t("whiteLabel")}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-[80%] rounded-full bg-zinc-700" />
          <div className="h-1.5 w-[60%] rounded-full bg-zinc-700" />
          <div className="h-1.5 w-[70%] rounded-full bg-blue-500/20" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-blue-500" />
          <span className="text-[10px] text-zinc-500">{t("exportReady")}</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   CSS keyframes — all GPU-friendly
   ──────────────────────────────────────────── */
const heroStyles = `
/* ── Scan bar: scaleX instead of width (no layout thrash) ── */
@keyframes heroBar { from { transform: scaleX(0); } to { transform: scaleX(0.94); } }
/* ── Fade-up for non-LCP elements (trust, buttons, mobile card) ── */
@keyframes heroFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
/* ── Mockup entrance ── */
@keyframes heroMockupIn { from { opacity: 0; transform: scale(0.96) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
/* ── Issue cards delayed fade ── */
@keyframes heroSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
/* ── Report scale-in ── */
@keyframes heroScaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
/* ── Ping for live dot ── */
@keyframes heroPing { 75%, 100% { transform: scale(2); opacity: 0; } }

/* ── Apply animations ── */
.hero-bar        { transform: scaleX(0.94); animation: heroBar 3s cubic-bezier(0.22,1,0.36,1) 0.5s both; will-change: transform; }
.hero-mockup     { animation: heroMockupIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both; will-change: transform, opacity; }
.hero-issues     { animation: heroSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 2.2s both; }
.hero-report     { animation: heroScaleIn 0.5s cubic-bezier(0.22,1,0.36,1) 2.8s both; }
.hero-ping       { animation: heroPing 1s cubic-bezier(0, 0, 0.2, 1) infinite; }

/* LCP-critical: H1 + subheadline have NO fade animation — always visible at paint */
.hero-fadeup-3   { animation: heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
.hero-fadeup-4   { animation: heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
.hero-fadeup-5   { animation: heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both; }

/* ── Respect prefers-reduced-motion ── */
@media (prefers-reduced-motion: reduce) {
  .hero-bar,
  .hero-mockup,
  .hero-issues,
  .hero-report,
  .hero-ping,
  .hero-fadeup-3,
  .hero-fadeup-4,
  .hero-fadeup-5 {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .hero-bar { transform: scaleX(0.94) !important; }
}
`;

/* ────────────────────────────────────────────
   Main Hero Section
   ──────────────────────────────────────────── */
export function HomeHeroPremium() {
  const t = useTranslations("home");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />

      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-zinc-950 to-zinc-900"
        aria-labelledby="home-hero-heading"
      >
        {/* Background glow — hidden on mobile to reduce GPU cost */}
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.05] blur-[100px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">

            {/* ── Left: Copy ── */}
            <div className="text-center lg:text-left">
              {/* LCP-critical: H1 renders immediately, no opacity:0 start */}
              <h1
                id="home-hero-heading"
                className="text-4xl font-semibold tracking-tighter text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.08]"
              >
                {t("headline")}
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  {t("headline_accent")}
                </span>
              </h1>

              {/* LCP-critical: subheadline also renders immediately */}
              <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400 lg:mx-0">
                {t("subheadline")}
              </p>

              {/* Trust element */}
              <p className="hero-fadeup-3 mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-2 text-sm text-zinc-500 lg:mx-0 lg:justify-start">
                <span>{t("trust_eu_hosted")}</span>
                <span className="text-zinc-700" aria-hidden="true">&bull;</span>
                <span>{t("trust_gdpr")}</span>
                <span className="text-zinc-700" aria-hidden="true">&bull;</span>
                <span>{t("trust_no_card")}</span>
              </p>

              {/* Buttons */}
              <div className="hero-fadeup-4 mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Button
                  size="lg"
                  className="group h-auto rounded-2xl bg-blue-500 py-4 px-8 text-base font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  asChild
                >
                  <Link
                    href="/auth/register"
                    onClick={() => trackEvent("homepage_cta_primary_click", { location: "hero" })}
                  >
                    {t("primary_cta")}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto rounded-2xl border-slate-600 bg-transparent py-4 px-8 text-base font-medium text-slate-200 transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-zinc-800/60 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  asChild
                >
                  <Link
                    href="#demo"
                    onClick={() => trackEvent("homepage_cta_demo_click", { location: "hero" })}
                  >
                    {t("secondary_cta")}
                  </Link>
                </Button>
              </div>
            </div>

            {/* ── Right: Animated Dashboard (desktop only) ── */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>

            {/* ── Mobile fallback: static card, zero JS ── */}
            <div className="hero-fadeup-5 mx-auto w-full max-w-sm lg:hidden">
              <div className="rounded-2xl border border-slate-700/50 bg-zinc-900/80 p-5 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-blue-400">{t("heroMockup.liveScan")}</span>
                </div>
                <p className="text-5xl font-bold tabular-nums text-blue-400">94</p>
                <p className="mt-1 text-sm text-zinc-400">{t("heroMockup.complianceScore")} &middot; WCAG 2.2 AA</p>
                <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
                  <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
