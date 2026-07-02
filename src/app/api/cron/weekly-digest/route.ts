import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCronAuth } from "@/lib/cron-auth";
import { sendWeeklyDigestEmail, type WeeklyDigestData } from "@/lib/email";
import { getFreeScanLeadCaptureDigestStats } from "@/lib/lead-intelligence/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function delta(current: number, previous: number): string {
  const diff = current - previous;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "±0";
}

/**
 * GET /api/cron/weekly-digest — Monday-morning founder digest.
 *
 * One email with everything that happened in the last 7 days (vs the 7
 * days before): signups, scans, pilot applications, contact messages,
 * and GSC search performance. The ingest crons already collect the data;
 * this is the piece that puts it in front of the founder without anyone
 * opening a dashboard.
 */
async function handler(_request: NextRequest) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = { createdAt: { gte: weekAgo } };
  const lastWeek = { createdAt: { gte: twoWeeksAgo, lt: weekAgo } };

  const [
    newUsers,
    newUsersPrev,
    scansCompleted,
    scansCompletedPrev,
    scansFailed,
    partnerApps,
    partnerAppsPrev,
    contactMessages,
    contactMessagesPrev,
    recentApplications,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: thisWeek }),
    prisma.user.count({ where: lastWeek }),
    prisma.scan.count({ where: { ...thisWeek, status: "COMPLETED" } }),
    prisma.scan.count({ where: { ...lastWeek, status: "COMPLETED" } }),
    prisma.scan.count({ where: { ...thisWeek, status: "FAILED" } }),
    prisma.partnerApplication.count({ where: thisWeek }),
    prisma.partnerApplication.count({ where: lastWeek }),
    prisma.contactMessage.count({ where: thisWeek }),
    prisma.contactMessage.count({ where: lastWeek }),
    prisma.partnerApplication.findMany({
      where: thisWeek,
      select: { companyName: true, website: true, clientSites: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.user.findMany({
      where: thisWeek,
      select: { email: true, plan: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // GSC lives in raw tables written by the ingest cron; tolerate absence.
  let gsc: WeeklyDigestData["gsc"] = null;
  let freeScanStats: Awaited<ReturnType<typeof getFreeScanLeadCaptureDigestStats>> = {
    freeScanLeads: 0,
    freeScanLeadsPrev: 0,
    recentFreeScanLeads: [],
  };
  try {
    const [current] = await prisma.$queryRaw<
      Array<{ clicks: bigint | null; impressions: bigint | null }>
    >`SELECT SUM(clicks)::bigint AS clicks, SUM(impressions)::bigint AS impressions
      FROM gsc_daily_site_metrics WHERE date >= ${weekAgo}::date`;
    const [previous] = await prisma.$queryRaw<
      Array<{ clicks: bigint | null; impressions: bigint | null }>
    >`SELECT SUM(clicks)::bigint AS clicks, SUM(impressions)::bigint AS impressions
      FROM gsc_daily_site_metrics WHERE date >= ${twoWeeksAgo}::date AND date < ${weekAgo}::date`;
    const topQueries = await prisma.$queryRaw<
      Array<{ query: string; clicks: bigint | null }>
    >`SELECT query, SUM(clicks)::bigint AS clicks
      FROM gsc_daily_query_metrics WHERE date >= ${weekAgo}::date
      GROUP BY query ORDER BY SUM(clicks) DESC LIMIT 5`;

    gsc = {
      clicks: Number(current?.clicks ?? 0),
      clicksPrev: Number(previous?.clicks ?? 0),
      impressions: Number(current?.impressions ?? 0),
      impressionsPrev: Number(previous?.impressions ?? 0),
      topQueries: topQueries.map((q) => ({ query: q.query, clicks: Number(q.clicks ?? 0) })),
    };
  } catch (gscError) {
    console.warn("[weekly-digest] GSC data unavailable (table missing or empty):", gscError);
  }

  try {
    freeScanStats = await getFreeScanLeadCaptureDigestStats({ weekAgo, twoWeeksAgo });
  } catch (leadError) {
    console.warn("[weekly-digest] Free-scan lead data unavailable:", leadError);
  }

  const digest: WeeklyDigestData = {
    periodStart: weekAgo,
    periodEnd: now,
    newUsers,
    newUsersDelta: delta(newUsers, newUsersPrev),
    scansCompleted,
    scansCompletedDelta: delta(scansCompleted, scansCompletedPrev),
    scansFailed,
    freeScanLeads: freeScanStats.freeScanLeads,
    freeScanLeadsDelta: delta(freeScanStats.freeScanLeads, freeScanStats.freeScanLeadsPrev),
    recentFreeScanLeads: freeScanStats.recentFreeScanLeads,
    partnerApps,
    partnerAppsDelta: delta(partnerApps, partnerAppsPrev),
    contactMessages,
    contactMessagesDelta: delta(contactMessages, contactMessagesPrev),
    recentApplications,
    recentUsers,
    gsc,
  };

  try {
    const result = await sendWeeklyDigestEmail(digest);
    if (result && (result as any).error) {
      throw new Error(JSON.stringify((result as any).error));
    }
  } catch (mailError) {
    console.error("[weekly-digest] Email failed:", mailError);
    return NextResponse.json({ ok: false, error: "digest email failed" }, { status: 500 });
  }

  console.log("[weekly-digest] Sent:", {
    newUsers,
    scansCompleted,
    freeScanLeads: freeScanStats.freeScanLeads,
    partnerApps,
    contactMessages,
    gsc: !!gsc,
  });
  return NextResponse.json({ ok: true, ...digest, gsc: gsc ? { ...gsc } : null });
}

export const GET = withCronAuth(handler);
export const POST = withCronAuth(handler);
