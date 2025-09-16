import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startCrawl } from "@/lib/crawler";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits, addPageUsage } from "@/lib/billing/entitlements";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication and crawl permissions first
    const user = await requireAuth();
    
    await assertWithinLimits({
      userId: user.id,
      action: "crawl"
    });

    const body = await request.json();
    const { siteId, maxPages = 50, maxDepth = 3 } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Validate site exists and belongs to user
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    if (site.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if there's already a running crawl for this site
    const existingCrawl = await prisma.crawl.findFirst({
      where: {
        siteId,
        status: { in: ["queued", "running"] }
      }
    });

    if (existingCrawl) {
      return NextResponse.json(
        { error: "A crawl is already running for this site" },
        { status: 409 }
      );
    }

    // Start the crawl
    const crawlId = await startCrawl(siteId, maxPages, maxDepth);

    return NextResponse.json({
      success: true,
      crawlId,
      message: "Crawl started successfully"
    });

  } catch (error: any) {
    console.error("Failed to start crawl:", error);
    
    // Handle billing errors
    if (error instanceof Error) {
      if ((error as any).code === "UPGRADE_REQUIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "UPGRADE_REQUIRED",
            feature: (error as any).feature
          },
          { status: 402 }
        );
      }
      
      if ((error as any).code === "LIMIT_REACHED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "LIMIT_REACHED",
            limit: (error as any).limit,
            current: (error as any).current
          },
          { status: 429 }
        );
      }
      
      if ((error as any).code === "TRIAL_EXPIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "TRIAL_EXPIRED"
          },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to start crawl" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const crawlId = searchParams.get("crawlId");

    if (!siteId && !crawlId) {
      return NextResponse.json(
        { error: "Either siteId or crawlId is required" },
        { status: 400 }
      );
    }

    if (crawlId) {
      // Get specific crawl details
      const crawl = await prisma.crawl.findUnique({
        where: { id: crawlId },
        include: {
          site: true,
          crawlUrls: {
            orderBy: { createdAt: "asc" },
            take: 100 // Limit for performance
          }
        }
      });

      if (!crawl) {
        return NextResponse.json(
          { error: "Crawl not found" },
          { status: 404 }
        );
      }

      // Verify user owns this crawl
      if (crawl.site.userId !== user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      return NextResponse.json(crawl);
    }

    if (siteId) {
      // Verify user owns this site
      const site = await prisma.site.findUnique({
        where: { id: siteId }
      });

      if (!site || site.userId !== user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      // Get all crawls for a site
      const crawls = await prisma.crawl.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        include: {
          site: true
        }
      });

      return NextResponse.json(crawls);
    }

  } catch (error) {
    console.error("Failed to get crawl info:", error);
    return NextResponse.json(
      { error: "Failed to get crawl information" },
      { status: 500 }
    );
  }
}