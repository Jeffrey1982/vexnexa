/**
 * Public Report Publication Flow
 *
 * After a scan completes, this module:
 * 1. Normalizes the target domain
 * 2. Checks quality thresholds
 * 3. Upserts the public_scan_sites record
 * 4. Creates a public_scan_reports record
 * 5. Updates latest_public_report_id on the site record
 */

import { prisma } from '@/lib/prisma';
import { normalizeDomain, extractDisplayDomain, isValidDomain } from '@/lib/domain-utils';

// ── Types ────────────────────────────────────────────────

export interface PublishableScan {
  id: string;
  score: number | null;
  issues: number | null;
  impactCritical: number;
  impactSerious: number;
  impactModerate: number;
  impactMinor: number;
  wcagAACompliance: number | null;
  wcagAAACompliance: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  raw: any;
  status: string;
  site: { url: string };
  page?: { url: string } | null;
  createdAt: Date;
}

export interface PublicReport {
  id: string;
  site_id: string;
  normalized_domain: string;
  score: number | null;
}

// ── Quality thresholds ───────────────────────────────────

const MIN_SCORE_FOR_INDEXING = 0; // Allow all valid scores
const MIN_ISSUES_FOR_CONTENT = 0; // Even 0 issues is valid (great score)

/**
 * Check whether a completed scan is eligible for public display.
 */
export function isScanEligibleForPublicReport(scan: PublishableScan): boolean {
  // Must be a completed scan
  if (scan.status !== 'done' && scan.status !== 'COMPLETED') return false;

  // Must have a valid score
  if (scan.score === null || scan.score === undefined) return false;

  // Score must be between 0 and 100
  if (scan.score < 0 || scan.score > 100) return false;

  // Must have issue count defined
  if (scan.issues === null || scan.issues === undefined) return false;

  return true;
}

/**
 * Determine if a public report should be marked as indexable.
 * Reports with too little content get noindex.
 */
export function shouldAllowIndexing(scan: PublishableScan): boolean {
  if (!isScanEligibleForPublicReport(scan)) return false;

  // Must have a real score
  if (scan.score === null || scan.score === undefined) return false;

  // Must have some meaningful data
  const hasIssueData = scan.issues !== null && scan.issues !== undefined;
  const hasImpactData = (scan.impactCritical + scan.impactSerious + scan.impactModerate + scan.impactMinor) >= 0;

  return hasIssueData && hasImpactData;
}

/**
 * Extract top violations from raw scan data for the public summary.
 * We only show rule IDs, descriptions, and impact — no user-specific data.
 */
export function extractTopViolations(raw: any, limit: number = 10): any[] {
  if (!raw?.violations || !Array.isArray(raw.violations)) return [];

  return raw.violations
    .slice(0, limit)
    .map((v: any) => ({
      id: v.id,
      impact: v.impact || 'minor',
      help: v.help || '',
      description: v.description || '',
      helpUrl: v.helpUrl || '',
      tags: (v.tags || []).filter((t: string) =>
        t.startsWith('wcag') || t.startsWith('best-practice')
      ),
      nodeCount: Array.isArray(v.nodes) ? v.nodes.length : 0,
    }));
}

/**
 * Build a structured summary from scan data.
 */
export function buildPublicSummary(scan: PublishableScan): Record<string, any> {
  return {
    score: scan.score,
    totalIssues: scan.issues,
    impactBreakdown: {
      critical: scan.impactCritical,
      serious: scan.impactSerious,
      moderate: scan.impactModerate,
      minor: scan.impactMinor,
    },
    wcagCompliance: {
      aa: scan.wcagAACompliance,
      aaa: scan.wcagAAACompliance,
    },
    performance: scan.performanceScore,
    seo: scan.seoScore,
    scannedAt: scan.createdAt.toISOString(),
  };
}

// ── Main publication function ────────────────────────────

/**
 * Publish a completed scan as a public report.
 * This is safe to call on every scan completion — it handles
 * deduplication and quality gating internally.
 */
export async function publishScanReport(scan: PublishableScan): Promise<PublicReport | null> {
  try {
    // 1. Check eligibility
    if (!isScanEligibleForPublicReport(scan)) {
      console.log(`[PublicReport] Scan ${scan.id} not eligible for public report`);
      return null;
    }

    // 2. Normalize domain
    const siteUrl = scan.site?.url || scan.page?.url;
    if (!siteUrl) {
      console.log(`[PublicReport] Scan ${scan.id} has no site URL`);
      return null;
    }

    const normalizedDomain = normalizeDomain(siteUrl);
    const displayDomain = extractDisplayDomain(siteUrl);

    if (!isValidDomain(normalizedDomain)) {
      console.log(`[PublicReport] Invalid domain: ${normalizedDomain}`);
      return null;
    }

    // 3. Quality checks
    const allowIndexing = shouldAllowIndexing(scan);

    // 4. Extract public-safe data
    const topViolations = extractTopViolations(scan.raw);
    const summary = buildPublicSummary(scan);

    // 5. Upsert public_scan_sites record
    const existingSite = await prisma.$queryRaw<any[]>`
      SELECT id, total_scans FROM public_scan_sites
      WHERE normalized_domain = ${normalizedDomain}
      LIMIT 1
    `;

    let siteId: string;

    if (existingSite.length > 0) {
      siteId = existingSite[0].id;
      await prisma.$executeRaw`
        UPDATE public_scan_sites
        SET last_scanned_at = NOW(),
            total_scans = ${(existingSite[0].total_scans || 0) + 1},
            updated_at = NOW()
        WHERE id = ${siteId}
      `;
    } else {
      const newSite = await prisma.$queryRaw<any[]>`
        INSERT INTO public_scan_sites (id, normalized_domain, display_domain, first_scanned_at, last_scanned_at, total_scans)
        VALUES (gen_random_uuid()::text, ${normalizedDomain}, ${displayDomain}, NOW(), NOW(), 1)
        RETURNING id
      `;
      siteId = newSite[0].id;
    }

    // 6. Create public_scan_reports record
    const newReport = await prisma.$queryRaw<any[]>`
      INSERT INTO public_scan_reports (
        id, site_id, scan_id, normalized_domain, display_domain,
        score, issues_total, impact_critical, impact_serious, impact_moderate, impact_minor,
        pages_scanned, scan_type, summary, top_violations,
        wcag_aa_compliance, wcag_aaa_compliance, performance_score, seo_score,
        scanned_url, is_public, allow_indexing, published_at
      ) VALUES (
        gen_random_uuid()::text, ${siteId}, ${scan.id}, ${normalizedDomain}, ${displayDomain},
        ${scan.score}, ${scan.issues || 0}, ${scan.impactCritical}, ${scan.impactSerious}, ${scan.impactModerate}, ${scan.impactMinor},
        1, 'single_page', ${JSON.stringify(summary)}::jsonb, ${JSON.stringify(topViolations)}::jsonb,
        ${scan.wcagAACompliance}, ${scan.wcagAAACompliance}, ${scan.performanceScore}, ${scan.seoScore},
        ${scan.page?.url || siteUrl}, true, ${allowIndexing}, NOW()
      )
      RETURNING id, site_id, normalized_domain, score
    `;

    const reportId = newReport[0].id;

    // 7. Update latest_public_report_id on the site record
    await prisma.$executeRaw`
      UPDATE public_scan_sites
      SET latest_public_report_id = ${reportId},
          updated_at = NOW()
      WHERE id = ${siteId}
    `;

    console.log(`[PublicReport] Published report ${reportId} for ${normalizedDomain} (score: ${scan.score}, indexable: ${allowIndexing})`);

    return newReport[0] as PublicReport;
  } catch (error) {
    console.error('[PublicReport] Error publishing scan report:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ── Query helpers for report pages ───────────────────────

/**
 * Fetch the latest public report for a normalized domain.
 */
export async function getLatestPublicReport(normalizedDomain: string): Promise<any | null> {
  try {
    const reports = await prisma.$queryRaw<any[]>`
      SELECT r.*, s.public_page_enabled, s.total_scans, s.first_scanned_at
      FROM public_scan_reports r
      JOIN public_scan_sites s ON r.site_id = s.id
      WHERE r.normalized_domain = ${normalizedDomain}
        AND r.is_public = true
        AND s.public_page_enabled = true
      ORDER BY r.published_at DESC
      LIMIT 1
    `;

    return reports[0] || null;
  } catch (error) {
    console.error('[PublicReport] Error fetching latest report:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Fetch a specific public report by scan ID.
 */
export async function getPublicReportByScanId(normalizedDomain: string, scanId: string): Promise<any | null> {
  try {
    const reports = await prisma.$queryRaw<any[]>`
      SELECT r.*, s.public_page_enabled, s.total_scans, s.first_scanned_at
      FROM public_scan_reports r
      JOIN public_scan_sites s ON r.site_id = s.id
      WHERE r.normalized_domain = ${normalizedDomain}
        AND r.scan_id = ${scanId}
        AND r.is_public = true
        AND s.public_page_enabled = true
      LIMIT 1
    `;

    return reports[0] || null;
  } catch (error) {
    console.error('[PublicReport] Error fetching report by scan ID:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Fetch scan history for a domain (for trend display).
 */
export async function getPublicReportHistory(normalizedDomain: string, limit: number = 10): Promise<any[]> {
  try {
    const reports = await prisma.$queryRaw<any[]>`
      SELECT id, score, issues_total, published_at
      FROM public_scan_reports
      WHERE normalized_domain = ${normalizedDomain}
        AND is_public = true
      ORDER BY published_at DESC
      LIMIT ${limit}
    `;

    return reports;
  } catch (error) {
    console.error('[PublicReport] Error fetching report history:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Fetch all indexable domains for sitemap generation.
 */
export async function getIndexablePublicDomains(): Promise<{ normalized_domain: string; updated_at: string }[]> {
  try {
    const domains = await prisma.$queryRaw<any[]>`
      SELECT s.normalized_domain, s.updated_at
      FROM public_scan_sites s
      WHERE s.public_page_enabled = true
        AND s.latest_public_report_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public_scan_reports r
          WHERE r.site_id = s.id
            AND r.is_public = true
            AND r.allow_indexing = true
        )
      ORDER BY s.last_scanned_at DESC
      LIMIT 5000
    `;

    return domains;
  } catch (error) {
    console.error('[PublicReport] Error fetching indexable domains:', error instanceof Error ? error.message : error);
    return [];
  }
}
