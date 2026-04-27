import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * GET /api/scans/[scanId] - Poll scan status/results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: {
          select: { userId: true, url: true },
        },
        page: {
          select: { url: true },
        },
      },
    })

    if (!scan) {
      return notFoundResponse('Scan')
    }

    if (scan.site.userId !== user.id) {
      return forbiddenResponse()
    }

    const result = {
      scanId: scan.id,
      status: scan.status,
      score: scan.score,
      issues: scan.issues,
      site: scan.site.url,
      page: scan.page?.url ?? scan.site.url,
      url: scan.page?.url ?? scan.site.url,
      resultJson: scan.resultJson,
      raw: scan.raw,
      error:
        scan.status === 'FAILED' && scan.resultJson && typeof scan.resultJson === 'object'
          ? (scan.resultJson as any).error
          : null,
      createdAt: scan.createdAt,
    }

    return NextResponse.json({
      ok: true,
      success: true,
      data: result,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching scan:', error)
    return errorResponse('Failed to fetch scan', 500)
  }
}

/**
 * DELETE /api/scans/[scanId] - Delete scan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check ownership through site
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: {
          select: { userId: true },
        },
      },
    })

    if (!scan) {
      return notFoundResponse('Scan')
    }

    if (scan.site.userId !== user.id) {
      return forbiddenResponse()
    }

    await prisma.scan.delete({
      where: { id: scanId },
    })

    return successResponse(null, 'Scan deleted successfully')
  } catch (error) {
    console.error('Error deleting scan:', error)
    return errorResponse('Failed to delete scan', 500)
  }
}
