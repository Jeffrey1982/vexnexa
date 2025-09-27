import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()

    // For now, return mock data since database connection may not be ready
    // This will be replaced with real database queries once Prisma is properly set up
    const mockStats = {
      totalSites: 2,
      totalScans: 8,
      avgScore: 85,
      totalIssues: 24,
      impactStats: {
        total: 24,
        critical: 3,
        serious: 8,
        moderate: 10,
        minor: 3
      }
    }

    return NextResponse.json(mockStats)
  } catch (error) {
    console.error('Dashboard stats error:', error)

    // Return fallback data if authentication fails
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

    return NextResponse.json(fallbackStats)
  }
}