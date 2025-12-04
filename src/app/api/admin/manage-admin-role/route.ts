import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { grantAdminRole, revokeAdminRole, isUserAdmin } from '@/lib/admin'
import { z } from 'zod'

const AdminRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.enum(['grant', 'revoke']),
})

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const currentUser = await getCurrentUser()
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = AdminRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { userId, action } = validation.data

    // Prevent self-revocation
    if (action === 'revoke' && userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot revoke your own admin role' },
        { status: 400 }
      )
    }

    // Execute the action
    if (action === 'grant') {
      await grantAdminRole(userId, currentUser.id)
      return NextResponse.json({
        success: true,
        message: 'Admin role granted successfully'
      })
    } else {
      await revokeAdminRole(userId, currentUser.id)
      return NextResponse.json({
        success: true,
        message: 'Admin role revoked successfully'
      })
    }

  } catch (error) {
    console.error('Admin role management error:', error)
    return NextResponse.json(
      {
        error: 'Failed to manage admin role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get all admin users
export async function GET(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const currentUser = await getCurrentUser()
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { getAllAdminUsers } = await import('@/lib/admin')
    const admins = await getAllAdminUsers()

    return NextResponse.json({
      success: true,
      admins
    })

  } catch (error) {
    console.error('Fetch admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    )
  }
}
