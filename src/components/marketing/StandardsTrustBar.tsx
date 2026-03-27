"use client";

/**
 * Standards & trust references (axe-core®, WCAG, EN 301 549, GDPR).
 *
 * Attribution:
 * - WCAG conformance logo: © W3C, used per https://www.w3.org/WAI/standards-guidelines/wcag/conformance-logos/
 * - axe-core® is a trademark of Deque Systems, Inc. This bar does not imply endorsement by Deque or W3C.
 * - EU flag: stylized representation for context; not an official EU emblem download.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Official W3C WCAG 2.2 Level AA logo (blue variant). */
const WCAG_22_AA_BLUE =
  "https://www.w3.org/WAI/WCAG22/wcag2.2AA-blue.png";

const AXE_CORE_URL = "https://www.deque.com/axe/axe-core/";
const WCAG_URL = "https://www.w3.org/WAI/standards-guidelines/wcag/";
const EN_URL =
  "https://digital-strategy.ec.europa.eu/en/policies/web-accessibility";
const GDPR_URL =
  "https://commission.europa.eu/law/law-topic/data-protection/reform/what-general-data-protection-regulation-gdpr_en";

function EuFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 27 18"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="27" height="18" fill="#039" rx="1" />
      <g fill="#FC0">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6 - Math.PI / 2;
          const cx = 13.5 + 3.4 * Math.cos(a);
          const cy = 9 + 3.4 * Math.sin(a);
          return <circle key={i} cx={cx} cy={cy} r="0.9" />;
        })}
      </g>
    </svg>
  );
}

const linkClass =
  "group flex min-w-[10rem] max-w-[14rem] flex-col items-center gap-2 rounded-xl border border-transparent px-3 py-3 text-center transition-colors hover:border-border/60 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:min-w-0 md:max-w-none md:flex-1";

export type StandardsTrustBarProps = {
  variant?: "full" | "compact";
  /** When true, shows the optional section heading (recommended above the fold). */
  showHeading?: boolean;
  className?: string;
  /** Rounded card inside a column (e.g. public report) instead of full-bleed horizontal rules. */
  inset?: boolean;
};

export function StandardsTrustBar({
  variant = "full",
  showHeading = true,
  className,
  inset = false,
}: StandardsTrustBarProps) {
  const isFull = variant === "full";
  const wcagW = isFull ? 132 : 96;
  const wcagH = isFull ? 47 : 34;

  return (
    <section
      className={cn(
        "bg-muted/25",
        inset
          ? "rounded-2xl border border-border/50 py-5 md:py-6"
          : "border-y border-border/40",
        !inset && (isFull ? "py-10 md:py-12" : "py-6 md:py-7"),
        className
      )}
      aria-label="Standards and compliance references"
    >
      <div className="container mx-auto px-4">
        {showHeading ? (
          <p
            className={cn(
              "mx-auto max-w-3xl text-center font-medium text-muted-foreground",
              isFull ? "mb-8 text-sm md:text-base" : "mb-5 text-xs md:text-sm"
            )}
          >
            Built on the world&apos;s most trusted accessibility standards
          </p>
        ) : null}

        <div
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 md:snap-none md:flex-wrap md:justify-center md:overflow-visible md:pb-0",
            isFull ? "md:gap-8" : "md:gap-6"
          )}
          role="list"
        >
          {/* 1. axe-core® */}
          <div className="snap-center shrink-0" role="listitem">
            <Link
              href={AXE_CORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="axe-core by Deque — open-source accessibility testing engine (opens in new tab)"
              title="Learn about axe-core on deque.com"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Powered by
              </span>
              <span className="relative block h-9 w-[200px] max-w-full md:h-10">
                {/* eslint-disable-next-line @next/next/no-img-element -- local SVG lockup; next/image skips SVG optimization */}
                <img
                  src="/trust/axe-core-lockup.svg"
                  alt="axe-core®"
                  width={220}
                  height={40}
                  className="mx-auto h-full w-auto max-w-full object-contain object-center opacity-90 grayscale transition-[filter,opacity] group-hover:opacity-100 group-hover:grayscale-0"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  isFull ? "text-xs leading-snug" : "text-[11px] leading-snug"
                )}
              >
                The global standard in automated accessibility testing
              </span>
            </Link>
          </div>

          {/* 2. WCAG 2.2 AA (W3C official logo) */}
          <div className="snap-center shrink-0" role="listitem">
            <Link
              href={WCAG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="W3C Web Content Accessibility Guidelines — WCAG overview (opens in new tab)"
              title="W3C WAI — Web Content Accessibility Guidelines"
            >
              <span className="relative flex min-h-[2.5rem] items-center justify-center">
                <Image
                  src={WCAG_22_AA_BLUE}
                  alt="Level AA conformance, W3C Web Content Accessibility Guidelines 2.2"
                  width={wcagW}
                  height={wcagH}
                  className="h-auto w-[88px] object-contain opacity-95 transition-opacity group-hover:opacity-100 md:w-auto"
                  style={{ maxWidth: isFull ? 132 : 96 }}
                />
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  isFull ? "text-xs leading-snug" : "text-[11px] leading-snug"
                )}
              >
                Conformance testing engine
              </span>
            </Link>
          </div>

          {/* 3. EN 301 549 */}
          <div className="snap-center shrink-0" role="listitem">
            <Link
              href={EN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="European accessibility framework — EN 301 549 and EU web accessibility policy (opens in new tab)"
              title="European Commission — web accessibility"
            >
              <span
                className={cn(
                  "inline-flex items-center rounded-md border border-border/60 bg-background/90 px-3 font-semibold tracking-wide text-foreground shadow-sm",
                  isFull ? "py-2 text-sm" : "py-1.5 text-xs"
                )}
              >
                EN 301 549
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  isFull ? "text-xs leading-snug" : "text-[11px] leading-snug"
                )}
              >
                European accessibility framework
              </span>
            </Link>
          </div>

          {/* 4. GDPR + EU flag */}
          <div className="snap-center shrink-0" role="listitem">
            <Link
              href={GDPR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="General Data Protection Regulation — European Commission overview (opens in new tab)"
              title="European Commission — GDPR"
            >
              <span className="flex items-center gap-2">
                <EuFlagIcon className="h-4 w-6 shrink-0 rounded-sm shadow-sm" />
                <span
                  className={cn(
                    "font-semibold text-muted-foreground",
                    isFull ? "text-xs" : "text-[11px]"
                  )}
                >
                  GDPR compliant
                </span>
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  isFull ? "text-xs leading-snug" : "text-[11px] leading-snug"
                )}
              >
                Data protection by design
              </span>
            </Link>
          </div>
        </div>

        <p
          className={cn(
            "mx-auto mt-6 max-w-2xl text-center text-muted-foreground",
            isFull ? "text-[11px] leading-relaxed" : "text-[10px] leading-relaxed"
          )}
        >
          Logos and names are shown for factual reference only. VexNexa is not endorsed by W3C, Deque, or the
          European Union.
        </p>
      </div>
    </section>
  );
}

/** @deprecated Use `StandardsTrustBar` — same component. */
export const PoweredBySection = StandardsTrustBar;
