"use client";

import { useTranslations } from "next-intl";
import { EyeOff, Eye, Sparkles, ScanLine, FileCheck2 } from "lucide-react";

/**
 * VisibilityHook — short banner-style section after the hero.
 *
 * Anchor message:
 *   "You can't fix what you can't see. VexNexa uncovers the ~30% of
 *    accessibility barriers hidden from traditional rule-based automation."
 *
 * Layout: a balanced two-column module (visual + copy) capped at max-w-6xl
 * with a supporting 3-pill stat row beneath the body. This kills the
 * "tower" feel of the previous narrow max-w-4xl version and fills the
 * right column with content so the section reads as a proper feature
 * block instead of a floating circle next to a paragraph.
 */
export function VisibilityHook() {
  const t = useTranslations("home.enterprise.visibility");

  const stats = [
    { Icon: ScanLine, label: "AI-Vision", value: "Logica + visuele context" },
    { Icon: Sparkles, label: "Ambiguïteit", value: "Wat axe-core mist" },
    { Icon: FileCheck2, label: "Audit-ready", value: "Bewijs per bevinding" },
  ];

  return (
    <section
      className="relative bg-white dark:bg-[#0A0F1E] py-20 sm:py-24"
      aria-labelledby="visibility-hook-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-14">
            {/* Visual */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative h-52 w-52 sm:h-60 sm:w-60">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
                <svg
                  viewBox="0 0 160 160"
                  className="relative h-full w-full"
                  aria-hidden
                  role="img"
                >
                  {/* track */}
                  <circle cx="80" cy="80" r="68" fill="none" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="10" />
                  {/* 30% arc — the "hidden" segment in primary */}
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${0.3 * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
                    transform="rotate(-90 80 80)"
                  />
                  <text
                    x="80"
                    y="78"
                    textAnchor="middle"
                    fontFamily="ui-sans-serif, system-ui"
                    fontSize="32"
                    fontWeight="700"
                    className="fill-primary"
                  >
                    30%
                  </text>
                  <text
                    x="80"
                    y="100"
                    textAnchor="middle"
                    fontFamily="ui-sans-serif, system-ui"
                    fontSize="11"
                    letterSpacing="2"
                    className="fill-slate-500 dark:fill-white/55"
                  >
                    HIDDEN
                  </text>
                </svg>
              </div>
            </div>

            {/* Copy */}
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <EyeOff className="h-3.5 w-3.5" aria-hidden /> {t("eyebrow")}
              </p>
              <h2
                id="visibility-hook-heading"
                className="mt-3 font-display text-3xl font-bold leading-tight text-slate-900 dark:text-white sm:text-4xl"
              >
                {t("title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-white/70">
                {t("body")}
              </p>

              {/* Supporting stat row — fills the right column so the section
                  no longer feels narrow and tower-like. */}
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map(({ Icon, label, value }) => (
                  <li
                    key={label}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-white/70">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-white/55">
                <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span>{t("footnote")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
