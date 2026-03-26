import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { successResponse, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/users — Fetch all users for admin dashboard (no caching).
 * Used by the client-side polling mechanism for real-time updates.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    if (!await isAdmin(user.id)) {
      return forbiddenResponse('Admin access required')
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        isAdmin: true,
        sites: {
          select: {
            _count: {
              select: {
                scans: true,
              },
            },
          },
        },
      },
    })

    return successResponse(users)
  } catch (err: any) {
    console.error('[Admin/Users] Error fetching users:', err.message)
    return errorResponse('Failed to fetch users', 500)
  }
}
