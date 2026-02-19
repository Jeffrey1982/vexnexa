import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { permanentlyDeleteItem, type SoftDeleteModel } from '@/lib/soft-delete'
import { z } from 'zod'

const DeleteSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: z.enum(['user', 'site', 'scan', 'team', 'blogPost', 'supportTicket', 'manualAudit']),
})

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = DeleteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { itemId, itemType } = validation.data

    await permanentlyDeleteItem(itemId, itemType as SoftDeleteModel)

    return NextResponse.json({
      success: true,
      message: `${itemType} permanently deleted`,
    })
  } catch (error) {
    console.error('Permanent delete error:', error)
    return NextResponse.json(
      {
        error: 'Failed to permanently delete item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
