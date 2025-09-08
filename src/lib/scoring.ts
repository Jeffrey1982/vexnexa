import type { AxeResults, Result } from "axe-core";

type Impact = "minor" | "moderate" | "serious" | "critical";

const WEIGHTS: Record<Impact, number> = {
  minor: 1,
  moderate: 3,
  serious: 7,
  critical: 12,
};

export function scoreFromAxe(results: AxeResults): { score: number; summary: any } {
  const v = results.violations ?? [];
  let weighted = 0;
  let total = 0;

  for (const r of v as Result[]) {
    const impact = (r.impact ?? "moderate") as Impact;
    const weight = WEIGHTS[impact] ?? 3;
    const count = r.nodes?.length ?? 1;
    weighted += weight * count;
    total += count;
  }

  // Simple normalization: start at 100, subtract log-ish penalty
  const penalty = Math.min(100, Math.round(Math.log10(1 + weighted) * 20 + total * 0.5));
  const score = Math.max(0, 100 - penalty);

  const top = v
    .slice()
    .sort((a, b) => (b.nodes?.length ?? 0) - (a.nodes?.length ?? 0))
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      impact: r.impact,
      help: r.help,
      description: r.description,
      nodes: r.nodes?.length ?? 0,
      sampleTargets: r.nodes?.slice(0, 3).flatMap((n) => n.target?.slice(0, 1) ?? []) ?? [],
    }));

  const counts = {
    violations: results.violations?.length ?? 0,
    passes: results.passes?.length ?? 0,
    incomplete: results.incomplete?.length ?? 0,
    inapplicable: results.inapplicable?.length ?? 0,
  };

  return { score, summary: { counts, top } };
}