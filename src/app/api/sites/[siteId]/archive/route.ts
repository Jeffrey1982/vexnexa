import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * POST /api/sites/[siteId]/archive - Archive site
 * Note: This is a logical archive - site remains in database but marked as archived
 * Actual implementation depends on whether we add an 'archived' field to schema
 * For now, we'll remove it from portfolio as a form of "archiving"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check ownership
    const existingSite = await prisma.site.findUnique({
      where: { id: siteId },
      select: { userId: true, portfolioId: true },
    })

    if (!existingSite) {
      return notFoundResponse('Site')
    }

    if (existingSite.userId !== user.id) {
      return forbiddenResponse()
    }

    // Remove from portfolio as a form of archiving
    // In the future, add an 'archived' boolean field to Site model
    const site = await prisma.site.update({
      where: { id: siteId },
      data: {
        portfolioId: null,
      },
    })

    return successResponse(site, 'Site archived successfully')
  } catch (error) {
    console.error('Error archiving site:', error)
    return errorResponse('Failed to archive site', 500)
  }
}
