import { prisma } from './prisma'

/**
 * Soft delete utilities for data recovery
 */

export interface SoftDeleteOptions {
  deletedBy?: string
  reason?: string
}

/**
 * Soft delete a user
 */
export async function softDeleteUser(userId: string, options?: SoftDeleteOptions) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      deletedBy: options?.deletedBy
    }
  })
}

/**
 * Restore a soft-deleted user
 */
export async function restoreUser(userId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: null,
      deletedBy: null
    }
  })
}

/**
 * Soft delete a site
 */
export async function softDeleteSite(siteId: string, options?: SoftDeleteOptions) {
  return await prisma.site.update({
    where: { id: siteId },
    data: {
      deletedAt: new Date(),
      deletedBy: options?.deletedBy
    }
  })
}

/**
 * Restore a soft-deleted site
 */
export async function restoreSite(siteId: string) {
  return await prisma.site.update({
    where: { id: siteId },
    data: {
      deletedAt: null,
      deletedBy: null
    }
  })
}

/**
 * Soft delete a scan
 */
export async function softDeleteScan(scanId: string, options?: SoftDeleteOptions) {
  return await prisma.scan.update({
    where: { id: scanId },
    data: {
      deletedAt: new Date(),
      deletedBy: options?.deletedBy
    }
  })
}

/**
 * Restore a soft-deleted scan
 */
export async function restoreScan(scanId: string) {
  return await prisma.scan.update({
    where: { id: scanId },
    data: {
      deletedAt: null,
      deletedBy: null
    }
  })
}

/**
 * Permanently delete old soft-deleted records (cleanup job)
 * @param daysOld Number of days after which to permanently delete
 */
export async function permanentlyDeleteOldRecords(daysOld: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const results = await prisma.$transaction(async (tx) => {
    // Delete old soft-deleted users
    const deletedUsers = await tx.user.deleteMany({
      where: {
        deletedAt: {
          lt: cutoffDate
        }
      }
    })

    // Delete old soft-deleted sites
    const deletedSites = await tx.site.deleteMany({
      where: {
        deletedAt: {
          lt: cutoffDate
        }
      }
    })

    // Delete old soft-deleted scans
    const deletedScans = await tx.scan.deleteMany({
      where: {
        deletedAt: {
          lt: cutoffDate
        }
      }
    })

    return {
      users: deletedUsers.count,
      sites: deletedSites.count,
      scans: deletedScans.count
    }
  })

  return results
}

/**
 * Get all soft-deleted records for admin review
 */
export async function getSoftDeletedRecords() {
  const [users, sites, scans] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        email: true,
        deletedAt: true,
        deletedBy: true
      },
      orderBy: { deletedAt: 'desc' }
    }),
    prisma.site.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        url: true,
        deletedAt: true,
        deletedBy: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { deletedAt: 'desc' }
    }),
    prisma.scan.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        deletedAt: true,
        deletedBy: true,
        site: {
          select: {
            url: true
          }
        }
      },
      orderBy: { deletedAt: 'desc' },
      take: 100 // Limit to last 100 scans
    })
  ])

  return { users, sites, scans }
}
