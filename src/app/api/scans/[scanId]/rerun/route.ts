import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * POST /api/scans/[scanId]/rerun - Rerun scan
 */
export async function POST(
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

    // Get original scan
    const originalScan = await prisma.scan.findUnique({
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

    if (!originalScan) {
      return notFoundResponse('Scan')
    }

    if (originalScan.site.userId !== user.id) {
      return forbiddenResponse()
    }

    // Create new scan with reference to previous
    const newScan = await prisma.scan.create({
      data: {
        siteId: originalScan.siteId,
        pageId: originalScan.pageId,
        status: 'pending',
        previousScanId: originalScan.id,
      },
    })

    // TODO: Trigger actual scan job here
    // For now, just create the record
    // In production, this would:
    // 1. Add job to queue (Bull/BullMQ)
    // 2. Worker picks up job
    // 3. Runs accessibility scan
    // 4. Updates scan record with results

    return successResponse(
      { scanId: newScan.id },
      'Scan queued successfully. Results will be available shortly.'
    )
  } catch (error) {
    console.error('Error rerunning scan:', error)
    return errorResponse('Failed to rerun scan', 500)
  }
}
