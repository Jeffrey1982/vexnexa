import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits } from "@/lib/billing/entitlements";
import { startCrawl } from "@/lib/crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for bulk operations

export async function POST(req: Request) {
  try {
    // Check authentication and limits first
    const user = await requireAuth();

    const { url, maxPages = 10, maxDepth = 2, includeSitemap = true } = await req.json();

    if (!url) {
      return NextResponse.json({ ok: false, error: "URL is required" }, { status: 400 });
    }

    // Check if user can perform bulk scans based on plan
    await assertWithinLimits({
      userId: user.id,
      action: "bulk_scan",
      pages: maxPages
    });

    // Validate URL format
    let siteUrl: string;
    try {
      const urlObj = new URL(url);
      siteUrl = urlObj.origin;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 });
    }

    // Find-or-create Site for authenticated user
    let site = await prisma.site.findUnique({
      where: {
        userId_url: {
          userId: user.id,
          url: siteUrl
        }
      }
    });

    if (!site) {
      site = await prisma.site.create({
        data: {
          userId: user.id,
          url: siteUrl
        }
      });
    }

    // Create crawl record
    const crawl = await prisma.crawl.create({
      data: {
        siteId: site.id,
        status: "queued",
        maxPages: maxPages,
        maxDepth: maxDepth
      }
    });

    // Start crawling process
    try {
      console.log(`Starting bulk scan crawl for: ${siteUrl} (maxPages: ${maxPages}, maxDepth: ${maxDepth})`);

      // Start the crawling process (non-blocking)
      startCrawl(site.id, maxPages, maxDepth, includeSitemap).catch((error) => {
        console.error(`Crawl ${crawl.id} failed:`, error);
        // Update crawl status to error
        prisma.crawl.update({
          where: { id: crawl.id },
          data: {
            status: "error",
            finishedAt: new Date()
          }
        }).catch(console.error);
      });

      return NextResponse.json({
        ok: true,
        crawlId: crawl.id,
        message: "Bulk scan started successfully",
        estimatedDuration: `${Math.ceil(maxPages * 0.5)} minutes`
      });

    } catch (crawlError: any) {
      console.error('Bulk scan initialization failed:', crawlError);

      // Update crawl with error status
      await prisma.crawl.update({
        where: { id: crawl.id },
        data: {
          status: "error",
          finishedAt: new Date()
        }
      });

      return NextResponse.json({
        ok: false,
        error: `Bulk scan failed: ${crawlError.message}`,
        crawlId: crawl.id
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error("Bulk scan failed:", e);

    // Handle billing errors
    if (e instanceof Error) {
      if ((e as any).code === "UPGRADE_REQUIRED") {
        return NextResponse.json(
          {
            ok: false,
            error: e.message,
            code: "UPGRADE_REQUIRED",
            feature: (e as any).feature
          },
          { status: 402 }
        );
      }

      if ((e as any).code === "LIMIT_REACHED") {
        return NextResponse.json(
          {
            ok: false,
            error: e.message,
            code: "LIMIT_REACHED",
            limit: (e as any).limit,
            current: (e as any).current
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Bulk scan failed"
    }, { status: 500 });
  }
}