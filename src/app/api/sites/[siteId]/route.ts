import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const UpdateSiteSchema = z.object({
  url: z.string().url().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params

  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        pages: {
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 30  // More scans for analytics
        },
        crawls: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/sites/[siteId] - Update site
 */
export async function PUT(
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

    const body = await request.json()
    const validation = UpdateSiteSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Check ownership
    const existingSite = await prisma.site.findUnique({
      where: { id: siteId },
      select: { userId: true },
    })

    if (!existingSite) {
      return notFoundResponse('Site')
    }

    if (existingSite.userId !== user.id) {
      return forbiddenResponse()
    }

    const site = await prisma.site.update({
      where: { id: siteId },
      data: validation.data,
      include: {
        _count: {
          select: {
            scans: true,
            pages: true,
          },
        },
      },
    })

    return successResponse(site, 'Site updated successfully')
  } catch (error) {
    console.error('Error updating site:', error)
    return errorResponse('Failed to update site', 500)
  }
}

/**
 * DELETE /api/sites/[siteId] - Delete site
 */
export async function DELETE(
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
      select: { userId: true },
    })

    if (!existingSite) {
      return notFoundResponse('Site')
    }

    if (existingSite.userId !== user.id) {
      return forbiddenResponse()
    }

    await prisma.site.delete({
      where: { id: siteId },
    })

    return successResponse(null, 'Site deleted successfully')
  } catch (error) {
    console.error('Error deleting site:', error)
    return errorResponse('Failed to delete site', 500)
  }
}
