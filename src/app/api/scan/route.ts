import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAccessibilityScan } from "@/lib/scanner";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits, addPageUsage } from "@/lib/billing/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Check authentication and limits first
    const user = await requireAuth();
    
    await assertWithinLimits({
      userId: user.id,
      action: "scan",
      pages: 1
    });

    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ ok: false, error: "URL is required" }, { status: 400 });
    }

    // Bepaal origin van de ingevoerde URL als siteUrl
    let siteUrl: string;
    let fullPageUrl: string;
    
    try {
      const urlObj = new URL(url);
      siteUrl = urlObj.origin;
      fullPageUrl = url;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 });
    }

    // Find-or-create User (fallback op demo user)
    let demoUser = await prisma.user.findUnique({ 
      where: { email: "demo@tutusporta.com" } 
    });
    
    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: { email: "demo@tutusporta.com" }
      });
    }

    // Find-or-create Site op [userId, siteUrl]
    let site = await prisma.site.findUnique({
      where: { 
        userId_url: {
          userId: demoUser.id,
          url: siteUrl
        }
      }
    });

    if (!site) {
      site = await prisma.site.create({
        data: {
          userId: demoUser.id,
          url: siteUrl
        }
      });
    }

    // Find-or-create Page op [siteId, volledigePaginaURL]
    let page = await prisma.page.findUnique({
      where: {
        siteId_url: {
          siteId: site.id,
          url: fullPageUrl
        }
      }
    });

    if (!page) {
      page = await prisma.page.create({
        data: {
          siteId: site.id,
          url: fullPageUrl
        }
      });
    }

    // Markeer scan als running
    const runningScan = await prisma.scan.create({
      data: {
        siteId: site.id,
        pageId: page.id,
        status: "running",
        score: 0,
        issues: 0
      }
    });

    // Run accessibility scan
    let result;
    try {
      result = await runAccessibilityScan(fullPageUrl);
    } catch (scanError: any) {
      // Update scan with error status
      await prisma.scan.update({
        where: { id: runningScan.id },
        data: {
          status: "failed",
          raw: { error: scanError.message }
        }
      });
      
      return NextResponse.json({ 
        ok: false, 
        error: `Accessibility scan failed: ${scanError.message}`,
        scanId: runningScan.id
      }, { status: 500 });
    }

    // Extract impact counts from axe violations
    const violations = result.axe?.violations || [];
    const impactCounts = {
      critical: violations.filter((v: any) => v.impact === 'critical').length,
      serious: violations.filter((v: any) => v.impact === 'serious').length,
      moderate: violations.filter((v: any) => v.impact === 'moderate').length,
      minor: violations.filter((v: any) => v.impact === 'minor').length,
    };

    // Update scan with results
    const completedScan = await prisma.scan.update({
      where: { id: runningScan.id },
      data: {
        status: "done",
        score: Math.round(result.score),
        issues: violations.length,
        impactCritical: impactCounts.critical,
        impactSerious: impactCounts.serious,
        impactModerate: impactCounts.moderate,
        impactMinor: impactCounts.minor,
        raw: result as any
      },
      include: {
        site: true,
        page: true
      }
    });

    // Track usage for successful scan
    await addPageUsage(user.id, 1);

    return NextResponse.json({
      ok: true,
      scan: completedScan,
      scanId: completedScan.id,
      score: completedScan.score,
      issues: completedScan.issues,
      site: completedScan.site?.url,
      page: completedScan.page?.url,
      createdAt: completedScan.createdAt,
    });

  } catch (e: any) {
    console.error("Scan failed:", e);
    
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
      
      if ((e as any).code === "TRIAL_EXPIRED") {
        return NextResponse.json(
          { 
            ok: false,
            error: e.message,
            code: "TRIAL_EXPIRED"
          },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "Scan failed" 
    }, { status: 500 });
  }
}