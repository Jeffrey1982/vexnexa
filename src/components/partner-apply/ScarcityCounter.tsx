"use client";

export function ScarcityCounter({ spots }: { spots: number }) {
  const n = Number.isFinite(spots) && spots >= 0 ? Math.floor(spots) : 9;
  return (
    <p className="text-lg font-semibold text-primary md:text-xl" aria-live="polite">
      Only <span className="tabular-nums">{n}</span> spots left in this exclusive pilot
    </p>
  );
}
