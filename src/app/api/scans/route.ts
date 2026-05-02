import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { errorResponse, unauthorizedResponse } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100)

    const scans = await prisma.scan.findMany({
      where: {
        site: {
          userId: user.id,
        },
      },
      include: {
        site: {
          select: {
            id: true,
            url: true,
          },
        },
        page: {
          select: {
            id: true,
            url: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      ok: true,
      scans,
      data: scans,
    })
  } catch (error) {
    console.error('Error listing scans:', error)
    return errorResponse('Failed to list scans', 500)
  }
}
