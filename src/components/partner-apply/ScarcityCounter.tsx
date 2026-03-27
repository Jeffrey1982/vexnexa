"use client";

export function ScarcityCounter({ spots }: { spots: number }) {
  const n = Number.isFinite(spots) && spots >= 0 ? Math.floor(spots) : 9;
  return (
    <p className="text-lg font-semibold text-primary md:text-xl" aria-live="polite">
      Final <span className="tabular-nums">{n}</span>{" "}
      {n === 1 ? "agency will" : "agencies will"} be accepted – Pilot program closes soon
    </p>
  );
}
