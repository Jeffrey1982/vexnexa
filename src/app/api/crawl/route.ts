import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startCrawl } from "@/lib/crawler";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, maxPages = 50, maxDepth = 3 } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Validate site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
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

  } catch (error) {
    console.error("Failed to start crawl:", error);
    return NextResponse.json(
      { error: "Failed to start crawl" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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
          urls: {
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!crawl) {
        return NextResponse.json(
          { error: "Crawl not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(crawl);
    }

    if (siteId) {
      // Get all crawls for a site
      const crawls = await prisma.crawl.findMany({
        where: { siteId },
        orderBy: { startedAt: "desc" },
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