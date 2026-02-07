import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's sites (including team sites)
    const sites = await prisma.site.findMany({
      where: {
        OR: [
          { userId: user.id },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId: user.id
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Calculate real statistics
    const totalSites = sites.length
    const totalScans = sites.reduce((sum, site) => sum + site.scans.length, 0)

    // Calculate average score from all scans
    let totalScore = 0
    let scansWithScore = 0

    for (const site of sites) {
      for (const scan of site.scans) {
        if (scan.score !== null) {
          totalScore += scan.score
          scansWithScore++
        }
      }
    }

    const avgScore = scansWithScore > 0 ? Math.round(totalScore / scansWithScore) : 0

    // Calculate total issues and impact stats
    let totalIssues = 0
    let criticalCount = 0
    let seriousCount = 0
    let moderateCount = 0
    let minorCount = 0

    for (const site of sites) {
      for (const scan of site.scans) {
        if (scan.issues !== null) {
          totalIssues += scan.issues
        }
        // Use impact fields from schema
        criticalCount += scan.impactCritical
        seriousCount += scan.impactSerious
        moderateCount += scan.impactModerate
        minorCount += scan.impactMinor
      }
    }

    const stats = {
      totalSites,
      totalScans,
      avgScore,
      totalIssues,
      impactStats: {
        total: totalIssues,
        critical: criticalCount,
        serious: seriousCount,
        moderate: moderateCount,
        minor: minorCount
      }
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('Dashboard stats error:', error)

    // Return empty stats on error
    const fallbackStats = {
      totalSites: 0,
      totalScans: 0,
      avgScore: 0,
      totalIssues: 0,
      impactStats: {
        total: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      }
    }

    return NextResponse.json(fallbackStats, { status: 500 })
  }
}