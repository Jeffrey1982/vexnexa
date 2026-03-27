"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function ScarcityCounter({ remaining }: { remaining: number }) {
  const n = Number.isFinite(remaining) && remaining >= 0 ? Math.floor(remaining) : 0;

  if (n <= 0) {
    return (
      <p className="text-lg font-semibold text-muted-foreground md:text-xl" aria-live="polite">
        Program is full –{" "}
        <Link href="/contact?from=pilot-waitlist" className="text-primary underline-offset-4 hover:underline">
          Join the waitlist
        </Link>
      </p>
    );
  }

  const urgent = n <= 3;

  return (
    <p
      className={cn(
        "text-lg font-semibold md:text-xl",
        urgent
          ? "text-orange-600 dark:text-orange-400"
          : "text-primary"
      )}
      aria-live="polite"
    >
      Only <span className="tabular-nums">{n}</span> spot{n === 1 ? "" : "s"} left
    </p>
  );
}
