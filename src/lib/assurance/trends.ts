/**
 * VexNexa Accessibility Assurance - Trend Analysis & Regression Detection
 *
 * Calculates score trends and detects regressions for monitoring
 */

import { prisma } from '@/lib/prisma';
import type { AssuranceDomain, AssuranceScan, AssuranceAlertType } from '@prisma/client';

export interface TrendDataPoint {
  date: Date;
  score: number;
  wcagAA?: number | null;
  wcagAAA?: number | null;
  issuesCount: number;
  isRegression: boolean;
}

export interface RegressionResult {
  detected: boolean;
  type: AssuranceAlertType | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  currentScore: number;
  previousScore?: number;
  threshold: number;
}

/**
 * Calculate trend data for a domain (last N scans)
 */
export async function calculateTrend(
  domainId: string,
  limit: number = 8
): Promise<TrendDataPoint[]> {
  const scans = await prisma.assuranceScan.findMany({
    where: { domainId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Return in chronological order (oldest first) for charting
  return scans
    .reverse()
    .map((scan) => ({
      date: scan.createdAt,
      score: scan.score,
      wcagAA: scan.wcagAACompliance,
      wcagAAA: scan.wcagAAACompliance,
      issuesCount: scan.issuesCount,
      isRegression: scan.isRegression,
    }));
}

/**
 * Detect if the latest scan represents a regression
 * Two-tier detection:
 * 1. Hard threshold: score < threshold → HIGH/CRITICAL alert
 * 2. Soft threshold: score drop >= 10 points → MEDIUM alert
 */
export async function detectRegression(
  domain: AssuranceDomain,
  currentScan: AssuranceScan
): Promise<RegressionResult> {
  const currentScore = currentScan.score;
  const threshold = domain.scoreThreshold;

  // Get previous scan for comparison
  const previousScan = await prisma.assuranceScan.findFirst({
    where: {
      domainId: domain.id,
      id: { not: currentScan.id },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  const previousScore = previousScan?.score;

  // CRITICAL: Score below 60
  if (currentScore < 60) {
    return {
      detected: true,
      type: 'REGRESSION',
      severity: 'CRITICAL',
      message: `Critical regression: Score dropped to ${currentScore} (threshold: ${threshold})`,
      currentScore,
      previousScore,
      threshold,
    };
  }

  // HIGH: Score below threshold
  if (currentScore < threshold) {
    return {
      detected: true,
      type: 'REGRESSION',
      severity: 'HIGH',
      message: `Score dropped below threshold: ${currentScore} < ${threshold}`,
      currentScore,
      previousScore,
      threshold,
    };
  }

  // MEDIUM: Significant score drop (>= 10 points) even if above threshold
  if (previousScore && previousScore - currentScore >= 10) {
    return {
      detected: true,
      type: 'SCORE_DROP',
      severity: 'MEDIUM',
      message: `Significant score decrease detected: ${previousScore} → ${currentScore} (-${previousScore - currentScore} points)`,
      currentScore,
      previousScore,
      threshold,
    };
  }

  // Check for new critical issues
  if (currentScan.impactCritical > 0) {
    const previousCritical = previousScan?.impactCritical || 0;
    const newCritical = currentScan.impactCritical - previousCritical;

    if (newCritical > 0) {
      return {
        detected: true,
        type: 'CRITICAL_ISSUES',
        severity: 'HIGH',
        message: `${newCritical} new critical accessibility ${newCritical === 1 ? 'issue' : 'issues'} detected`,
        currentScore,
        previousScore,
        threshold,
      };
    }
  }

  // No regression detected
  return {
    detected: false,
    type: null,
    severity: 'LOW',
    message: 'No regression detected',
    currentScore,
    previousScore,
    threshold,
  };
}

/**
 * Create an alert for a regression
 */
export async function createAlert(opts: {
  domainId: string;
  type: AssuranceAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  currentScore: number;
  previousScore?: number;
  threshold?: number;
  scanId?: string;
}) {
  const {
    domainId,
    type,
    severity,
    title,
    message,
    currentScore,
    previousScore,
    threshold,
    scanId,
  } = opts;

  console.log('[Assurance Trends] Creating alert:', { domainId, type, severity, title });

  const alert = await prisma.assuranceAlert.create({
    data: {
      domainId,
      type,
      severity,
      title,
      message,
      currentScore,
      previousScore,
      threshold,
      scanId,
      resolved: false,
    },
  });

  console.log('[Assurance Trends] Alert created:', alert.id);

  return alert;
}

/**
 * Get alert summary for a domain
 */
export async function getAlertSummary(domainId: string) {
  const alerts = await prisma.assuranceAlert.findMany({
    where: { domainId },
    orderBy: { createdAt: 'desc' },
  });

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.resolved).length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && !a.resolved).length;

  return {
    total: alerts.length,
    unresolved: unresolvedCount,
    bySeverity: {
      critical: criticalCount,
      high: highCount,
      medium: alerts.filter((a) => a.severity === 'MEDIUM' && !a.resolved).length,
      low: alerts.filter((a) => a.severity === 'LOW' && !a.resolved).length,
    },
    latest: alerts.slice(0, 5),
  };
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string, userId: string) {
  console.log('[Assurance Trends] Resolving alert:', alertId);

  const alert = await prisma.assuranceAlert.update({
    where: { id: alertId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: userId,
    },
  });

  console.log('[Assurance Trends] Alert resolved');

  return alert;
}

/**
 * Calculate statistics for a domain
 */
export async function getDomainStatistics(domainId: string) {
  const scans = await prisma.assuranceScan.findMany({
    where: { domainId },
    orderBy: { createdAt: 'desc' },
    take: 30, // Last 30 scans
  });

  if (scans.length === 0) {
    return null;
  }

  const latestScan = scans[0];
  const scores = scans.map((s) => s.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Calculate trend direction
  let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
  if (scans.length >= 2) {
    const recentScores = scores.slice(0, 5);
    const olderScores = scores.slice(5, 10);

    if (olderScores.length > 0) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

      if (recentAvg > olderAvg + 2) {
        trendDirection = 'improving';
      } else if (recentAvg < olderAvg - 2) {
        trendDirection = 'declining';
      }
    }
  }

  return {
    latestScore: latestScan.score,
    avgScore: Math.round(avgScore),
    minScore,
    maxScore,
    trendDirection,
    totalScans: scans.length,
    regressionCount: scans.filter((s) => s.isRegression).length,
    latestScanDate: latestScan.createdAt,
  };
}

/**
 * Compare current score against historical performance
 */
export async function compareWithHistory(domainId: string, currentScore: number) {
  const stats = await getDomainStatistics(domainId);

  if (!stats) {
    return {
      isGood: true,
      message: 'First scan - establishing baseline',
    };
  }

  const { avgScore, minScore, maxScore } = stats;

  if (currentScore >= avgScore + 5) {
    return {
      isGood: true,
      message: `Excellent! Score is ${currentScore - avgScore} points above average`,
      comparison: 'above_average',
    };
  }

  if (currentScore >= avgScore - 5) {
    return {
      isGood: true,
      message: 'Score is within normal range',
      comparison: 'average',
    };
  }

  if (currentScore < avgScore - 10) {
    return {
      isGood: false,
      message: `Warning: Score is ${avgScore - currentScore} points below average`,
      comparison: 'below_average',
    };
  }

  return {
    isGood: currentScore >= avgScore,
    message: 'Score is slightly below average',
    comparison: 'slightly_below',
  };
}
