import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getCrawlStatus } from "@/lib/crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const crawlId = params.id;

    // Get crawl status with detailed progress
    const crawlStatus = await getCrawlStatus(crawlId);

    if (!crawlStatus) {
      return NextResponse.json({ ok: false, error: "Crawl not found" }, { status: 404 });
    }

    // Verify ownership through site
    const crawl = await prisma.crawl.findFirst({
      where: {
        id: crawlId,
        site: {
          userId: user.id
        }
      },
      include: {
        site: true
      }
    });

    if (!crawl) {
      return NextResponse.json({ ok: false, error: "Crawl not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      crawl: crawlStatus
    });

  } catch (e: any) {
    console.error("Get crawl status failed:", e);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Failed to get crawl status"
    }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const crawlId = params.id;

    // Verify ownership and get crawl
    const crawl = await prisma.crawl.findFirst({
      where: {
        id: crawlId,
        site: {
          userId: user.id
        }
      }
    });

    if (!crawl) {
      return NextResponse.json({ ok: false, error: "Crawl not found or access denied" }, { status: 404 });
    }

    // Can only cancel running crawls
    if (crawl.status !== "running" && crawl.status !== "queued") {
      return NextResponse.json({ ok: false, error: "Can only cancel running or queued crawls" }, { status: 400 });
    }

    // Update crawl status to cancelled
    await prisma.crawl.update({
      where: { id: crawlId },
      data: {
        status: "error", // Use error status to indicate cancellation
        finishedAt: new Date()
      }
    });

    // Update any running/queued URLs to cancelled
    await prisma.crawlUrl.updateMany({
      where: {
        crawlId: crawlId,
        status: { in: ["queued", "running"] }
      },
      data: {
        status: "skipped",
        reason: "Crawl cancelled by user"
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Crawl cancelled successfully"
    });

  } catch (e: any) {
    console.error("Cancel crawl failed:", e);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Failed to cancel crawl"
    }, { status: 500 });
  }
}