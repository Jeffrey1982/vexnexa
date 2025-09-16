import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Test auth
    console.log('Testing auth...');
    const user = await requireAuth();
    console.log('Auth successful, user ID:', user.id);

    // Test database
    console.log('Testing database...');
    const siteCount = await prisma.site.count({
      where: { userId: user.id }
    });
    console.log('Database connection successful, user has', siteCount, 'sites');

    // Test recent scans
    const recentScans = await prisma.scan.findMany({
      where: {
        site: { userId: user.id }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        site: true,
        page: true
      }
    });
    console.log('Found', recentScans.length, 'recent scans');

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      database: {
        connected: true,
        siteCount,
        recentScans: recentScans.map(scan => ({
          id: scan.id,
          status: scan.status,
          score: scan.score,
          createdAt: scan.createdAt,
          url: scan.site?.url
        }))
      },
      environment: {
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version
      }
    });

  } catch (error: any) {
    console.error('Debug scan failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version
      }
    }, { status: 500 });
  }
}