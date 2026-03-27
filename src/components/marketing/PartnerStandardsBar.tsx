"use client";

/**
 * Compact “same standards” strip for partner / pilot funnel (axe-core®, WCAG 2.2 AA, EN 301 549).
 * Smaller than StandardsTrustBar; omits GDPR row. Not an endorsement by Deque or W3C.
 */

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  AXE_CORE_URL,
  EN_URL,
  WCAG_22_AA_BLUE,
  WCAG_URL,
} from "@/components/marketing/standards-trust-links";

const partnerItemClass =
  "group flex min-w-[6.75rem] max-w-[9.5rem] shrink-0 snap-center flex-col items-center gap-1 rounded-xl px-2 py-2 text-center transition-[filter,opacity,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:min-w-0 md:max-w-none md:flex-1 md:px-3";

/** ~65% of compact StandardsTrustBar axe lockup. */
function AxeCoreLockupPartner() {
  return (
    <span className="inline-flex items-baseline text-sm font-bold tracking-tight text-[#0867C1] opacity-90 transition-opacity group-hover:opacity-100 dark:text-sky-400 md:text-base">
      axe-core
      <sup className="ml-0.5 translate-y-px text-[0.48em] font-semibold text-muted-foreground dark:text-sky-200/80">
        ®
      </sup>
    </span>
  );
}

export type PartnerStandardsBarProps = {
  className?: string;
  /** When set, replaces the translated intro (e.g. partner apply hero). */
  introOverride?: string;
  /** When set, replaces the translated footnote. */
  footnoteOverride?: string;
};

export function PartnerStandardsBar({
  className,
  introOverride,
  footnoteOverride,
}: PartnerStandardsBarProps) {
  const t = useTranslations("home.pilotBanner");
  /** ~65% of compact bar WCAG cap (32px → ~21px). */
  const wcagMaxH = 21;

  return (
    <div
      className={cn(
        "mx-auto max-w-2xl border-t border-primary/10 pt-6 dark:border-primary/15",
        className
      )}
    >
      <p className="text-center text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
        {introOverride ?? t("standardsIntro")}
      </p>

      <ul
        className="mt-5 flex list-none snap-x snap-mandatory justify-start gap-2 overflow-x-auto pb-1 md:snap-none md:justify-center md:gap-8 md:overflow-visible md:pb-0"
        aria-label={t("standardsAria")}
      >
        {/* axe-core® */}
        <li className="shrink-0">
          <Link
            href={AXE_CORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(partnerItemClass, "hover:bg-background/50")}
            aria-label={`${t("standardsAxeCaption")} — axe-core, opens in new tab`}
            title="Deque — axe-core"
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("standardsPoweredBy")}
            </span>
            <div className="flex h-8 w-full items-center justify-center md:h-9">
              <AxeCoreLockupPartner />
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground md:text-[11px]">
              {t("standardsAxeCaption")}
            </span>
          </Link>
        </li>

        {/* WCAG 2.2 AA */}
        <li className="shrink-0">
          <Link
            href={WCAG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(partnerItemClass, "hover:bg-background/50")}
            aria-label={`${t("standardsWcagCaption")} — W3C WCAG, opens in new tab`}
            title="W3C — Web Content Accessibility Guidelines"
          >
            <span className="h-4" aria-hidden />
            <div className="flex h-8 w-full items-center justify-center md:h-9">
              <Image
                src={WCAG_22_AA_BLUE}
                alt="Level AA conformance, W3C Web Content Accessibility Guidelines 2.2"
                width={88}
                height={31}
                className="w-auto opacity-80 grayscale transition-[filter,opacity] group-hover:opacity-100 group-hover:grayscale-0"
                style={{ maxHeight: wcagMaxH, height: "auto" }}
              />
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground md:text-[11px]">
              {t("standardsWcagCaption")}
            </span>
          </Link>
        </li>

        {/* EN 301 549 */}
        <li className="shrink-0">
          <Link
            href={EN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(partnerItemClass, "hover:bg-background/50")}
            aria-label={`${t("standardsEnCaption")} — EU web accessibility policy, opens in new tab`}
            title="European Commission — web accessibility"
          >
            <span className="h-4" aria-hidden />
            <div className="flex h-8 w-full items-center justify-center md:h-9">
              <span className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-foreground/90 opacity-85 shadow-sm transition-opacity group-hover:opacity-100 md:px-2.5 md:text-xs">
                EN 301 549
              </span>
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground md:text-[11px]">
              {t("standardsEnCaption")}
            </span>
          </Link>
        </li>
      </ul>

      <p className="mt-4 text-center text-[10px] leading-snug text-muted-foreground/80">
        {footnoteOverride ?? t("standardsFootnote")}
      </p>
    </div>
  );
}
