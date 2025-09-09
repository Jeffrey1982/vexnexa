import { PrismaClient } from "@prisma/client";
import Bottleneck from "bottleneck";
import * as cheerio from "cheerio";
import { normalizeUrl, sameOrigin } from "./normalizeUrl";
import { isAllowedByRobots } from "./robots";
import { scanUrl } from "./scanner";

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

  // TODO: Implement proper crawl functionality with appropriate schema
  // For now, create a basic scan instead
  const scan = await prisma.scan.create({
    data: {
      siteId,
      status: "queued",
    }
  });

  // Update scan status to running
  await prisma.scan.update({
    where: { id: scan.id },
    data: { 
      status: "running",
    }
  });

  return scan.id;
}

// TODO: Implement runCrawl with proper schema
export async function runCrawl(crawlId: string) {
  // Disabled for now due to missing schema models
  throw new Error("Crawl functionality not implemented");
}

/*
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
    const scanResult = await limiter.schedule(() => scanUrl(url));

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
        title: scanResult.title
      },
      update: {
        title: scanResult.title || undefined
      }
    });

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        siteId: crawl.siteId,
        pageId: page.id,
        status: "done",
        score: scanResult.score,
        issues: scanResult.issues,
        impactCritical: scanResult.impactCritical,
        impactSerious: scanResult.impactSerious,
        impactModerate: scanResult.impactModerate,
        impactMinor: scanResult.impactMinor,
        raw: scanResult as any
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
      data: { status: "done" }
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
        reason: String(error)
      }
    });
  }
}

async function extractAndQueueLinks(crawlId: string, currentUrl: string, depth: number, siteRoot: string) {
  try {
    // Fetch the page to extract links
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(currentUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "TutusPorta Accessibility Crawler"
      }
    });

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
    const uniqueLinks = [...new Set(links)];

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
*/