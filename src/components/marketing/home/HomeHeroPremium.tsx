"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

/* ────────────────────────────────────────────
   Animated counter hook
   ──────────────────────────────────────────── */
function useAnimatedCounter(
  end: number,
  start: number,
  duration: number,
  delayMs: number,
  enabled: boolean
): number {
  const [value, setValue] = useState<number>(start);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const animate = (now: number): void => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(start + (end - start) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delayMs);
    return () => clearTimeout(timeout);
  }, [end, start, duration, delayMs, enabled]);

  return value;
}

/* ────────────────────────────────────────────
   Dashboard Mockup (right column)
   ──────────────────────────────────────────── */
function DashboardMockup({ reduceMotion }: { reduceMotion: boolean | null }) {
  const score = useAnimatedCounter(94, 68, 2.6, 800, !reduceMotion);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showIssues, setShowIssues] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);

  useEffect(() => {
    if (reduceMotion) {
      setShowIssues(true);
      setShowReport(true);
      return;
    }
    const t1 = setTimeout(() => setShowIssues(true), 2200);
    const t2 = setTimeout(() => setShowReport(true), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduceMotion]);

  const getScoreColor = (s: number): string => {
    if (s >= 90) return "text-emerald-400";
    if (s >= 70) return "text-emerald-400";
    if (s >= 50) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div
      className="relative rounded-3xl border border-zinc-700/60 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-sm"
      role="img"
      aria-label="Geanimeerde preview van het VexNexa scan dashboard"
    >
      {/* Dashboard header */}
      <div className="mb-4 flex items-center justify-between border-b border-zinc-700/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 12l2 2 4-4" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-200">VexNexa</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Live Scan</span>
        </div>
      </div>

      {/* Target URL */}
      <div className="mb-4 rounded-xl bg-zinc-800/70 px-4 py-2.5 border border-zinc-700/40">
        <p className="text-[11px] text-zinc-500 mb-0.5">Doel</p>
        <p className="text-sm font-medium text-zinc-200 tracking-tight">jouwklant.nl</p>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-zinc-400">Scan voortgang</span>
          <span className="text-[11px] font-semibold text-emerald-400">{score > 90 ? "94" : "..."}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800">
          <div
            ref={progressRef}
            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all ease-out"
            style={{
              width: reduceMotion ? "94%" : undefined,
              animation: reduceMotion ? "none" : "heroScanBar 3s cubic-bezier(0.22,1,0.36,1) 0.5s forwards",
            }}
          />
        </div>
      </div>

      {/* Score display */}
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 p-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="#34d399"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <span className={`absolute text-2xl font-bold tabular-nums ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-100">Compliance Score</p>
          <p className="text-[13px] text-zinc-400">WCAG 2.2 Level AA</p>
        </div>
      </div>

      {/* Issue cards */}
      <AnimatePresence>
        {showIssues && (
          <motion.div
            className="mb-4 space-y-2"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-500/20">
                <span className="text-[10px] font-bold text-red-400">!</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-red-300 truncate">Afbeeldingen missen alt-tekst</p>
                <p className="text-[10px] text-red-400/70">Critical &middot; 4 elementen</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20">
                <span className="text-[10px] font-bold text-amber-400">~</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-amber-300 truncate">Kleurcontrast onvoldoende</p>
                <p className="text-[10px] text-amber-400/70">Moderate &middot; 2 elementen</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* White-label report preview */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-zinc-800/80 to-zinc-800/40 p-4"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-zinc-600" />
                <span className="text-[11px] font-semibold text-zinc-300">Jouw Digitaal Bureau</span>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                White-label
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-[80%] rounded-full bg-zinc-700" />
              <div className="h-1.5 w-[60%] rounded-full bg-zinc-700" />
              <div className="h-1.5 w-[70%] rounded-full bg-emerald-500/20" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-500">PDF &amp; Word export gereed</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Hero Section
   ──────────────────────────────────────────── */
export function HomeHeroPremium() {
  const reduceMotion = useReducedMotion();

  const fade = (delay = 0) =>
    reduceMotion
      ? ({ initial: false } as const)
      : ({
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
        } as const);

  return (
    <>
      {/* Keyframe for scan bar (CSS, no JS needed) */}
      <style jsx global>{`
        @keyframes heroScanBar {
          from { width: 0%; }
          to { width: 94%; }
        }
      `}</style>

      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-zinc-950 to-zinc-900"
        aria-labelledby="home-hero-heading"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-600/[0.04] blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">

            {/* ── Left: Copy ── */}
            <div className="text-center lg:text-left">
              <motion.h1
                id="home-hero-heading"
                className="font-display text-4xl font-bold tracking-tighter text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
                {...fade(0.05)}
              >
                WCAG 2.2 zonder ruis.
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  White-label rapporten die je &eacute;cht verkoopt.
                </span>
              </motion.h1>

              <motion.p
                className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400 lg:mx-0"
                {...fade(0.12)}
              >
                Betrouwbare automatische scans met axe-core. Minder false positives,
                concrete fix-adviezen en volledig branded PDF &amp; Word rapporten.
                Gemaakt voor bureaus en EU-teams die de EAA serieus nemen.
              </motion.p>

              {/* Trust element */}
              <motion.p
                className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-2 text-sm text-zinc-500 lg:mx-0 lg:justify-start"
                {...fade(0.16)}
              >
                <span>Alleen EU-hosted</span>
                <span className="text-zinc-700" aria-hidden="true">&bull;</span>
                <span>GDPR-proof</span>
                <span className="text-zinc-700" aria-hidden="true">&bull;</span>
                <span>Geen creditcard nodig</span>
              </motion.p>

              {/* Buttons */}
              <motion.div
                className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
                {...fade(0.2)}
              >
                <Button
                  size="lg"
                  className="group h-13 rounded-xl bg-emerald-500 px-8 text-base font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/30 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  asChild
                >
                  <Link
                    href="/auth/register"
                    onClick={() => trackEvent("homepage_cta_primary_click", { location: "hero" })}
                  >
                    Gratis scan starten
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-13 rounded-xl border-zinc-700 bg-transparent px-8 text-base font-medium text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  asChild
                >
                  <Link
                    href="#demo"
                    onClick={() => trackEvent("homepage_cta_demo_click", { location: "hero" })}
                  >
                    Bekijk live demo
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* ── Right: Animated Dashboard Mockup (hidden on mobile) ── */}
            <motion.div
              className="hidden lg:block"
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.96, y: 16 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
                  })}
            >
              <DashboardMockup reduceMotion={reduceMotion} />
            </motion.div>

            {/* Mobile fallback: static score card */}
            <motion.div
              className="mx-auto w-full max-w-sm lg:hidden"
              {...fade(0.25)}
            >
              <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 p-5 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Live Scan</span>
                </div>
                <p className="text-5xl font-bold tabular-nums text-emerald-400">94</p>
                <p className="mt-1 text-sm text-zinc-400">Compliance Score &middot; WCAG 2.2 AA</p>
                <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
                  <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
