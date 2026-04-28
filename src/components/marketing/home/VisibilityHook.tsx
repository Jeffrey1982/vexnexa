"use client";

import { useTranslations } from "next-intl";
import { EyeOff, Eye } from "lucide-react";

/**
 * VisibilityHook — short banner-style section after the hero.
 *
 * Anchor message:
 *   "You can't fix what you can't see. VexNexa uncovers the ~30% of
 *    accessibility barriers hidden from traditional rule-based automation."
 *
 * The 30% figure is presented as an industry observation, not a guarantee.
 */
export function VisibilityHook() {
  const t = useTranslations("home.enterprise.visibility");

  return (
    <section
      className="relative bg-[#0A0F1E] py-16 sm:py-20"
      aria-labelledby="visibility-hook-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
            {/* Visual */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative h-32 w-32 sm:h-40 sm:w-40">
                <div className="absolute inset-0 rounded-full bg-[#3b82f6]/10 blur-2xl" />
                <svg
                  viewBox="0 0 160 160"
                  className="relative h-full w-full"
                  aria-hidden
                  role="img"
                >
                  {/* track */}
                  <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  {/* 30% arc — the "hidden" segment in gold */}
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    fill="none"
                    stroke="#3b82f6"
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
                    fill="#3b82f6"
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
                    fill="rgba(255,255,255,0.55)"
                  >
                    HIDDEN
                  </text>
                </svg>
              </div>
            </div>

            {/* Copy */}
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3b82f6]">
                <EyeOff className="h-3.5 w-3.5" aria-hidden /> {t("eyebrow")}
              </p>
              <h2
                id="visibility-hook-heading"
                className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl"
              >
                {t("title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">{t("body")}</p>

              <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
                <Eye className="h-4 w-4 text-[#3b82f6]" aria-hidden />
                <span>{t("footnote")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
