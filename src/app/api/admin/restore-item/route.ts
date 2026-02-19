import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { restoreItem, type SoftDeleteModel } from '@/lib/soft-delete'
import { z } from 'zod'

const RestoreSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: z.enum(['user', 'site', 'scan', 'team', 'blogPost', 'supportTicket', 'manualAudit']),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = RestoreSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { itemId, itemType } = validation.data

    await restoreItem(itemId, itemType as SoftDeleteModel)

    return NextResponse.json({
      success: true,
      message: `${itemType} restored successfully`,
    })
  } catch (error) {
    console.error('Restore item error:', error)
    return NextResponse.json(
      {
        error: 'Failed to restore item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
