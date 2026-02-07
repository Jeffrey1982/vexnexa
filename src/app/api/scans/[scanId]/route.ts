import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

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
