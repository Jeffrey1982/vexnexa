"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ScarcityCounter({ remaining }: { remaining: number }) {
  const t = useTranslations("partnerApply.counter");
  const n = Number.isFinite(remaining) && remaining >= 0 ? Math.floor(remaining) : 0;

  if (n <= 0) {
    return (
      <p className="text-lg font-semibold text-muted-foreground md:text-xl" aria-live="polite">
        {t("full")}{" "}
        <Link href="/contact?from=pilot-waitlist" className="text-primary underline-offset-4 hover:underline">
          {t("joinWaitlist")}
        </Link>
      </p>
    );
  }

  const urgent = n <= 3;

  return (
    <p
      className={cn(
        "text-lg font-semibold md:text-xl",
        urgent ? "font-bold text-primary" : "text-primary"
      )}
      aria-live="polite"
    >
      {t("left", { count: n })}
    </p>
  );
}
