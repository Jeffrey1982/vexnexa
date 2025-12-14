/**
 * VexNexa Accessibility Assurance - Scanner Orchestration
 *
 * Executes automated accessibility scans for monitored domains
 * Stores results, detects regressions, and triggers reports/alerts
 */

import { prisma } from '@/lib/prisma';
import { runEnhancedAccessibilityScan } from '@/lib/scanner-enhanced';
import type { AssuranceDomain, AssuranceScan } from '@prisma/client';

/**
 * Calculate WCAG compliance percentages from scan score and violation counts
 * Uses a simplified model based on accessibility score and impact distribution
 */
function calculateWCAGCompliance(
  score: number,
  totalViolations: number,
  criticalCount: number,
  seriousCount: number
): {
  wcagAA: number;
  wcagAAA: number;
} {
  // WCAG AA compliance estimation
  // Critical and serious violations heavily impact AA compliance
  const criticalPenalty = criticalCount * 3;
  const seriousPenalty = seriousCount * 2;
  const baseAA = Math.max(0, score - criticalPenalty - seriousPenalty);
  const wcagAA = Math.min(100, Math.round(baseAA));

  // WCAG AAA is stricter - any violations significantly reduce compliance
  const totalPenalty = totalViolations * 1.5;
  const baseAAA = Math.max(0, score - totalPenalty);
  const wcagAAA = Math.min(100, Math.round(baseAAA * 0.85)); // AAA is ~85% of adjusted score

  return { wcagAA, wcagAAA };
}

/**
 * Get or create a Site record for the domain
 * Assurance scans are linked to Site records like regular scans
 */
async function getOrCreateSite(domain: string, userId: string) {
  // Check if site already exists
  const existingSite = await prisma.site.findFirst({
    where: {
      userId,
      url: domain,
    },
  });

  if (existingSite) {
    return existingSite;
  }

  // Create new site
  const site = await prisma.site.create({
    data: {
      userId,
      url: domain,
    },
  });

  return site;
}

/**
 * Calculate next run time based on frequency and current time
 */
function calculateNextRunTime(
  frequency: 'WEEKLY' | 'BIWEEKLY',
  dayOfWeek: number,
  timeOfDay: string
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const now = new Date();
  const next = new Date();

  // Set time
  next.setHours(hours, minutes, 0, 0);

  // Calculate days until next run
  const currentDay = now.getDay();
  let daysUntilNext = dayOfWeek - currentDay;

  if (daysUntilNext < 0 || (daysUntilNext === 0 && now >= next)) {
    // Target day has passed this week, schedule for next week
    daysUntilNext += 7;
  }

  // Add extra week for biweekly
  if (frequency === 'BIWEEKLY') {
    daysUntilNext += 7;
  }

  next.setDate(now.getDate() + daysUntilNext);

  return next;
}

/**
 * Execute an accessibility scan for an Assurance domain
 */
export async function executeAssuranceScan(domainId: string): Promise<AssuranceScan> {
  console.log('[Assurance Scanner] Starting scan for domain:', domainId);

  // Fetch domain with subscription
  const domain = await prisma.assuranceDomain.findUnique({
    where: { id: domainId },
    include: { subscription: { include: { user: true } } },
  });

  if (!domain) {
    throw new Error(`Domain not found: ${domainId}`);
  }

  if (!domain.active) {
    throw new Error(`Domain is inactive: ${domainId}`);
  }

  console.log('[Assurance Scanner] Scanning:', {
    domain: domain.domain,
    label: domain.label,
    userId: domain.subscription.userId,
  });

  try {
    // Get or create Site record
    const site = await getOrCreateSite(domain.domain, domain.subscription.userId);

    // Execute the actual accessibility scan using existing scanner
    console.log('[Assurance Scanner] Running enhanced accessibility scan...');
    const scanResult = await runEnhancedAccessibilityScan(domain.domain);

    console.log('[Assurance Scanner] Scan completed:', {
      score: scanResult.score,
      violations: scanResult.violations.length,
    });

    // Calculate impact counts
    const criticalCount = scanResult.violations.filter((v) => v.impact === 'critical').length;
    const seriousCount = scanResult.violations.filter((v) => v.impact === 'serious').length;

    // Calculate WCAG compliance based on score and violation severity
    const wcagCompliance = calculateWCAGCompliance(
      scanResult.score,
      scanResult.violations.length,
      criticalCount,
      seriousCount
    );

    // Store scan in main Scan table (reusing existing infrastructure)
    const scan = await prisma.scan.create({
      data: {
        siteId: site.id,
        status: 'done',
        score: Math.round(scanResult.score),
        issues: scanResult.violations.length,
        impactCritical: scanResult.violations.filter((v) => v.impact === 'critical').length,
        impactSerious: scanResult.violations.filter((v) => v.impact === 'serious').length,
        impactModerate: scanResult.violations.filter((v) => v.impact === 'moderate').length,
        impactMinor: scanResult.violations.filter((v) => v.impact === 'minor').length,
        wcagAACompliance: wcagCompliance.wcagAA,
        wcagAAACompliance: wcagCompliance.wcagAAA,
        raw: scanResult as any,
      },
    });

    console.log('[Assurance Scanner] Scan stored in database:', scan.id);

    // Get previous AssuranceScan for comparison
    const previousScan = await prisma.assuranceScan.findFirst({
      where: { domainId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    // Calculate score change
    const scoreChange = previousScan ? Math.round(scanResult.score) - previousScan.score : 0;

    // Check if this is a regression
    const isRegression = Math.round(scanResult.score) < domain.scoreThreshold;

    console.log('[Assurance Scanner] Score analysis:', {
      currentScore: Math.round(scanResult.score),
      previousScore: previousScan?.score,
      scoreChange,
      threshold: domain.scoreThreshold,
      isRegression,
    });

    // Create AssuranceScan record (denormalized for fast querying)
    const assuranceScan = await prisma.assuranceScan.create({
      data: {
        domainId: domain.id,
        scanId: scan.id,
        score: Math.round(scanResult.score),
        wcagAACompliance: wcagCompliance.wcagAA,
        wcagAAACompliance: wcagCompliance.wcagAAA,
        issuesCount: scanResult.violations.length,
        impactCritical: scanResult.violations.filter((v) => v.impact === 'critical').length,
        impactSerious: scanResult.violations.filter((v) => v.impact === 'serious').length,
        impactModerate: scanResult.violations.filter((v) => v.impact === 'moderate').length,
        impactMinor: scanResult.violations.filter((v) => v.impact === 'minor').length,
        previousScanId: previousScan?.id,
        scoreChange,
        isRegression,
      },
    });

    console.log('[Assurance Scanner] AssuranceScan created:', assuranceScan.id);

    // Update domain's lastRunAt and nextRunAt
    const nextRunAt = calculateNextRunTime(
      domain.scanFrequency,
      domain.dayOfWeek,
      domain.timeOfDay
    );

    await prisma.assuranceDomain.update({
      where: { id: domainId },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    });

    console.log('[Assurance Scanner] Next scan scheduled for:', nextRunAt);

    return assuranceScan;
  } catch (error) {
    console.error('[Assurance Scanner] Error executing scan:', error);

    // Update domain's nextRunAt even if scan failed (prevent getting stuck)
    const nextRunAt = calculateNextRunTime(
      domain.scanFrequency,
      domain.dayOfWeek,
      domain.timeOfDay
    );

    await prisma.assuranceDomain.update({
      where: { id: domainId },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    });

    throw error;
  }
}

/**
 * Execute scans for all due domains
 * Used by cron job
 */
export async function executeDueScans(limit: number = 50) {
  console.log('[Assurance Scanner] Checking for due scans...');

  // Find domains that are active and due for scanning
  const dueDomains = await prisma.assuranceDomain.findMany({
    where: {
      active: true,
      nextRunAt: {
        lte: new Date(),
      },
    },
    include: {
      subscription: true,
    },
    take: limit,
    orderBy: {
      nextRunAt: 'asc',
    },
  });

  console.log(`[Assurance Scanner] Found ${dueDomains.length} domains due for scanning`);

  const results = {
    total: dueDomains.length,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ domainId: string; domain: string; error: string }>,
  };

  // Execute scans sequentially (to avoid overwhelming the server)
  for (const domain of dueDomains) {
    try {
      console.log(`[Assurance Scanner] Scanning ${domain.domain}...`);
      await executeAssuranceScan(domain.id);
      results.successful++;
    } catch (error) {
      console.error(`[Assurance Scanner] Failed to scan ${domain.domain}:`, error);
      results.failed++;
      results.errors.push({
        domainId: domain.id,
        domain: domain.domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log('[Assurance Scanner] Batch scan complete:', results);

  return results;
}

/**
 * Trigger manual scan for a domain (outside of schedule)
 */
export async function triggerManualScan(domainId: string) {
  console.log('[Assurance Scanner] Triggering manual scan for:', domainId);

  // Check if domain exists and is active
  const domain = await prisma.assuranceDomain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  if (!domain.active) {
    throw new Error('Domain is inactive');
  }

  // Execute scan
  const scan = await executeAssuranceScan(domainId);

  console.log('[Assurance Scanner] Manual scan completed:', scan.id);

  return scan;
}
