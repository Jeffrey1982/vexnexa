import { prisma } from './prisma'

/**
 * Admin role management utilities
 */

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  })
  return user?.isAdmin || false
}

export async function grantAdminRole(userId: string, grantedBy: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update user to admin
    await tx.user.update({
      where: { id: userId },
      data: { isAdmin: true }
    })

    // Log the admin event
    await tx.userAdminEvent.create({
      data: {
        userId,
        adminId: grantedBy,
        eventType: 'MANUAL_ACTIVATION',
        description: 'Admin role granted',
        metadata: {
          action: 'grant_admin',
          timestamp: new Date().toISOString()
        }
      }
    })
  })
}

export async function revokeAdminRole(userId: string, revokedBy: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update user to remove admin
    await tx.user.update({
      where: { id: userId },
      data: { isAdmin: false }
    })

    // Log the admin event
    await tx.userAdminEvent.create({
      data: {
        userId,
        adminId: revokedBy,
        eventType: 'MANUAL_SUSPENSION',
        description: 'Admin role revoked',
        metadata: {
          action: 'revoke_admin',
          timestamp: new Date().toISOString()
        }
      }
    })
  })
}

export async function getAllAdminUsers() {
  return await prisma.user.findMany({
    where: { isAdmin: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { email: 'asc' }
  })
}

// Alias for convenience
export const isAdmin = isUserAdmin
