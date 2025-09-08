export interface ViolationNode {
  target: string[];
  html?: string;
  impact?: "critical" | "serious" | "moderate" | "minor";
  failureSummary?: string;
  any?: any[];
  all?: any[];
  none?: any[];
}

export interface Violation {
  id: string;
  impact?: "critical" | "serious" | "moderate" | "minor" | null;
  help: string;
  description: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNode[];
}

export interface AxeResults {
  violations: Violation[];
  passes?: any[];
  incomplete?: any[];
  inapplicable?: any[];
  url?: string;
  timestamp?: string;
}

export interface IssueStats {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export type ImpactLevel = "critical" | "serious" | "moderate" | "minor";

// Helper function to normalize missing impact as "minor"
export function normalizeImpact(impact?: ImpactLevel | null): ImpactLevel {
  return impact || "minor";
}

// Helper function to compute statistics from violations
export function computeIssueStats(violations: Violation[]): IssueStats {
  const stats: IssueStats = {
    total: violations.length,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  violations.forEach((violation) => {
    const impact = normalizeImpact(violation.impact);
    stats[impact]++;
  });

  return stats;
}

// Helper to get top violations by node count
export function getTopViolations(violations: Violation[], limit = 10): Violation[] {
  return violations
    .sort((a, b) => {
      // Sort by impact priority first, then by node count
      const impactPriority = { critical: 4, serious: 3, moderate: 2, minor: 1 };
      const aImpact = normalizeImpact(a.impact);
      const bImpact = normalizeImpact(b.impact);
      
      if (impactPriority[aImpact] !== impactPriority[bImpact]) {
        return impactPriority[bImpact] - impactPriority[aImpact];
      }
      
      return b.nodes.length - a.nodes.length;
    })
    .slice(0, limit);
}