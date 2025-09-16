import { PrismaClient } from "@prisma/client";
import Bottleneck from "bottleneck";
import * as cheerio from "cheerio";
import { normalizeUrl, sameOrigin } from "./normalizeUrl";
import { isAllowedByRobots } from "./robots";
import { runAccessibilityScan } from "./scanner";
import { calculateWCAGCompliance } from "./analytics";
import { getPerformanceMetrics, analyzeSEOMetrics, calculateComplianceRisk } from "./performance-analytics";

const prisma = new PrismaClient();

// Rate limiter: max 2 requests per second
const limiter = new Bottleneck({
  minTime: 500, // 500ms between requests
  maxConcurrent: 2
});

export async function startCrawl(siteId: string, maxPages = 50, maxDepth = 3) {
  const site = await prisma.site.findUnique({
    where: { id: siteId }
  });
  if (!site) throw new Error("Site not found");

  // Create a new crawl record
  const crawl = await prisma.crawl.create({
    data: {
      siteId,
      maxPages,
      maxDepth,
      status: "queued"
    }
  });

  // Add the starting URL to the crawl queue
  await prisma.crawlUrl.create({
    data: {
      crawlId: crawl.id,
      url: site.url,
      depth: 0,
      status: "queued"
    }
  });

  // Update crawl with initial queue count
  await prisma.crawl.update({
    where: { id: crawl.id },
    data: { 
      pagesQueued: 1,
      status: "running"
    }
  });

  return crawl.id;
}

export async function runCrawl(crawlId: string) {
  const crawl = await prisma.crawl.findUnique({
    where: { id: crawlId },
    include: { site: true }
  });
  if (!crawl) throw new Error("Crawl not found");

  try {
    while (true) {
      // Get next queued URL
      const nextUrl = await prisma.crawlUrl.findFirst({
        where: {
          crawlId,
          status: "queued"
        },
        orderBy: { createdAt: "asc" }
      });

      if (!nextUrl) break; // No more URLs to process

      // Check if we've hit our page limit
      const doneCount = await prisma.crawlUrl.count({
        where: {
          crawlId,
          status: "done"
        }
      });

      if (doneCount >= crawl.maxPages) {
        // Mark remaining queued URLs as skipped
        await prisma.crawlUrl.updateMany({
          where: {
            crawlId,
            status: "queued"
          },
          data: {
            status: "skipped",
            reason: "Page limit reached"
          }
        });
        break;
      }

      // Process this URL
      await processUrl(crawlId, nextUrl.id, nextUrl.url, nextUrl.depth, crawl);
    }

    // Update crawl status to completed
    await prisma.crawl.update({
      where: { id: crawlId },
      data: {
        status: "done",
        finishedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Crawl failed:", error);
    await prisma.crawl.update({
      where: { id: crawlId },
      data: {
        status: "error",
        finishedAt: new Date()
      }
    });
    throw error;
  }
}

async function processUrl(crawlId: string, urlId: string, url: string, depth: number, crawl: any) {
  try {
    // Check robots.txt
    const siteRoot = new URL(crawl.site.url).origin;
    const path = new URL(url).pathname;
    const allowed = await isAllowedByRobots(siteRoot, path);
    
    if (!allowed) {
      await prisma.crawlUrl.update({
        where: { id: urlId },
        data: {
          status: "skipped",
          reason: "Blocked by robots.txt"
        }
      });
      return;
    }

    // Run accessibility scan using rate limiter
    const scanResult = await limiter.schedule(() => runAccessibilityScan(url));

    // Extract violations from axe results
    const violations = scanResult.axe?.violations || [];

    // Calculate impact counts
    const impactCounts = {
      critical: violations.filter((v: any) => v.impact === 'critical').length,
      serious: violations.filter((v: any) => v.impact === 'serious').length,
      moderate: violations.filter((v: any) => v.impact === 'moderate').length,
      minor: violations.filter((v: any) => v.impact === 'minor').length,
    };

    // Calculate WCAG compliance
    const wcagAACompliance = calculateWCAGCompliance(violations, "AA");
    const wcagAAACompliance = calculateWCAGCompliance(violations, "AAA");

    // Create violation counts by rule for trending
    const violationsByRule: Record<string, number> = {};
    violations.forEach((violation: any) => {
      violationsByRule[violation.id] = (violationsByRule[violation.id] || 0) + 1;
    });

    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics(url);

    // Analyze SEO correlation
    const seoMetrics = analyzeSEOMetrics(violations);

    // Calculate compliance risk
    const complianceRisk = calculateComplianceRisk(Math.round(scanResult.score), violations);

    // Find or create page
    const page = await prisma.page.upsert({
      where: {
        siteId_url: {
          siteId: crawl.siteId,
          url
        }
      },
      create: {
        siteId: crawl.siteId,
        url,
        title: scanResult.title || extractTitleFromUrl(url)
      },
      update: {
        title: scanResult.title || undefined
      }
    });

    // Find previous scan for comparison
    const previousScan = await prisma.scan.findFirst({
      where: {
        siteId: crawl.siteId,
        pageId: page.id,
        status: "done",
        createdAt: { lt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate changes from previous scan
    const issuesFixed = previousScan ? Math.max(0, (previousScan.issues || 0) - violations.length) : 0;
    const newIssues = previousScan ? Math.max(0, violations.length - (previousScan.issues || 0)) : violations.length;
    const scoreImprovement = previousScan ? Math.round(scanResult.score) - (previousScan.score || 0) : null;

    // Create comprehensive scan record
    const scan = await prisma.scan.create({
      data: {
        siteId: crawl.siteId,
        pageId: page.id,
        status: "done",
        score: Math.round(scanResult.score),
        issues: violations.length,
        impactCritical: impactCounts.critical,
        impactSerious: impactCounts.serious,
        impactModerate: impactCounts.moderate,
        impactMinor: impactCounts.minor,

        // Enhanced analytics fields
        wcagAACompliance: wcagAACompliance,
        wcagAAACompliance: wcagAAACompliance,
        violationsByRule: violationsByRule,
        issuesFixed: issuesFixed,
        newIssues: newIssues,
        scoreImprovement: scoreImprovement,
        previousScanId: previousScan?.id,

        // Performance metrics
        performanceScore: performanceMetrics.performanceScore,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint,
        largestContentfulPaint: performanceMetrics.largestContentfulPaint,
        cumulativeLayoutShift: performanceMetrics.cumulativeLayoutShift,
        firstInputDelay: performanceMetrics.firstInputDelay,
        totalBlockingTime: performanceMetrics.totalBlockingTime,

        // SEO metrics
        seoScore: seoMetrics.seoScore,
        metaDescription: seoMetrics.metaDescription,
        headingStructure: seoMetrics.headingStructure,
        altTextCoverage: seoMetrics.altTextCoverage,
        linkAccessibility: seoMetrics.linkAccessibility,

        // Compliance risk assessment
        adaRiskLevel: complianceRisk.adaRiskLevel,
        wcag21Compliance: complianceRisk.wcag21Compliance,
        wcag22Compliance: complianceRisk.wcag22Compliance,
        complianceGaps: complianceRisk.complianceGaps,
        legalRiskScore: complianceRisk.legalRiskScore,

        // Performance metrics
        scanDuration: scanResult.scanDuration || null,
        pageLoadTime: scanResult.pageLoadTime || null,
        elementsScanned: scanResult.elementsScanned || null,

        raw: scanResult.axe || scanResult // Save the complete axe results
      }
    });

    // Update page's latest scan
    await prisma.page.update({
      where: { id: page.id },
      data: { latestScanId: scan.id }
    });

    // Mark URL as done
    await prisma.crawlUrl.update({
      where: { id: urlId },
      data: { 
        status: "done",
        processedAt: new Date()
      }
    });

    // If we haven't reached max depth, extract links and add them to queue
    if (depth < crawl.maxDepth) {
      await extractAndQueueLinks(crawlId, url, depth + 1, siteRoot);
    }

    // Update crawl progress
    const doneCount = await prisma.crawlUrl.count({
      where: { crawlId, status: "done" }
    });
    await prisma.crawl.update({
      where: { id: crawlId },
      data: { pagesDone: doneCount }
    });

  } catch (error) {
    console.error(`Failed to process ${url}:`, error);
    await prisma.crawlUrl.update({
      where: { id: urlId },
      data: {
        status: "error",
        reason: String(error),
        processedAt: new Date()
      }
    });
  }
}

async function extractAndQueueLinks(crawlId: string, currentUrl: string, depth: number, siteRoot: string) {
  try {
    // Fetch the page to extract links
    const fetch = (await import("node-fetch")).default;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(currentUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TutusPorta Accessibility Crawler"
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return;
    const html = await response.text();
    const $ = cheerio.load(html);

    const links: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, currentUrl).toString();
        const normalized = normalizeUrl(absoluteUrl);
        
        // Only crawl same-origin links
        if (sameOrigin(normalized, siteRoot)) {
          links.push(normalized);
        }
      } catch {
        // Invalid URL, skip
      }
    });

    // Remove duplicates
    const uniqueLinks = Array.from(new Set(links));

    // Add new links to queue (ignore duplicates)
    for (const link of uniqueLinks) {
      try {
        await prisma.crawlUrl.create({
          data: {
            crawlId,
            url: link,
            depth,
            status: "queued"
          }
        });
      } catch {
        // URL already exists in crawl, skip
      }
    }

    // Update queued count
    const queuedCount = await prisma.crawlUrl.count({
      where: { crawlId, status: "queued" }
    });
    await prisma.crawl.update({
      where: { id: crawlId },
      data: { pagesQueued: queuedCount }
    });

  } catch (error) {
    console.error(`Failed to extract links from ${currentUrl}:`, error);
  }
}

// Helper function to extract title from URL
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    if (path === '/' || path === '') {
      return urlObj.hostname;
    }

    // Convert path to title
    return path
      .split('/')
      .filter(Boolean)
      .join(' > ')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return url;
  }
}

// Enhanced crawl status monitoring
export async function getCrawlStatus(crawlId: string) {
  const crawl = await prisma.crawl.findUnique({
    where: { id: crawlId },
    include: {
      site: true,
      crawlUrls: {
        select: {
          id: true,
          url: true,
          status: true,
          depth: true,
          reason: true,
          processedAt: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!crawl) return null;

  const statusCounts = {
    queued: crawl.crawlUrls.filter(u => u.status === 'queued').length,
    running: crawl.crawlUrls.filter(u => u.status === 'running').length,
    done: crawl.crawlUrls.filter(u => u.status === 'done').length,
    error: crawl.crawlUrls.filter(u => u.status === 'error').length,
    skipped: crawl.crawlUrls.filter(u => u.status === 'skipped').length
  };

  const progress = {
    totalUrls: crawl.crawlUrls.length,
    completedUrls: statusCounts.done,
    progressPercentage: crawl.crawlUrls.length > 0
      ? Math.round((statusCounts.done / crawl.crawlUrls.length) * 100)
      : 0,
    estimatedTimeRemaining: calculateEstimatedTime(crawl, statusCounts)
  };

  return {
    ...crawl,
    statusCounts,
    progress,
    isRunning: crawl.status === 'running',
    canRestart: crawl.status === 'error' || crawl.status === 'done'
  };
}

function calculateEstimatedTime(crawl: any, statusCounts: any): string | null {
  if (crawl.status !== 'running' || statusCounts.done === 0) return null;

  const startTime = new Date(crawl.startedAt).getTime();
  const now = new Date().getTime();
  const elapsedMs = now - startTime;

  const avgTimePerPage = elapsedMs / statusCounts.done;
  const remainingPages = statusCounts.queued;
  const estimatedRemainingMs = avgTimePerPage * remainingPages;

  const minutes = Math.ceil(estimatedRemainingMs / (1000 * 60));

  if (minutes < 1) return "Less than 1 minute";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}