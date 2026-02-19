import { prisma } from './prisma'

/**
 * Soft delete utilities for data recovery.
 * Sets deletedAt timestamp instead of permanently removing records.
 * Records can be restored within 30 days before permanent cleanup.
 */

export interface SoftDeleteOptions {
  deletedBy?: string
  reason?: string
}

export type SoftDeleteModel = 'user' | 'site' | 'scan' | 'team' | 'blogPost' | 'supportTicket' | 'manualAudit'

// ─── User ────────────────────────────────────────────────────────────────────

export async function softDeleteUser(userId: string, options?: SoftDeleteOptions): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      deletedBy: options?.deletedBy ?? null,
    },
  })
}

export async function restoreUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  })
}

// ─── Site ────────────────────────────────────────────────────────────────────

export async function softDeleteSite(siteId: string, _options?: SoftDeleteOptions): Promise<void> {
  await prisma.site.update({
    where: { id: siteId },
    data: { deletedAt: new Date() },
  })
}

export async function restoreSite(siteId: string): Promise<void> {
  await prisma.site.update({
    where: { id: siteId },
    data: { deletedAt: null },
  })
}

// ─── Scan ────────────────────────────────────────────────────────────────────

export async function softDeleteScan(scanId: string, _options?: SoftDeleteOptions): Promise<void> {
  await prisma.scan.update({
    where: { id: scanId },
    data: { deletedAt: new Date() },
  })
}

export async function restoreScan(scanId: string): Promise<void> {
  await prisma.scan.update({
    where: { id: scanId },
    data: { deletedAt: null },
  })
}

// ─── Team ────────────────────────────────────────────────────────────────────

export async function softDeleteTeam(teamId: string, _options?: SoftDeleteOptions): Promise<void> {
  await prisma.team.update({
    where: { id: teamId },
    data: { deletedAt: new Date() },
  })
}

export async function restoreTeam(teamId: string): Promise<void> {
  await prisma.team.update({
    where: { id: teamId },
    data: { deletedAt: null },
  })
}

// ─── BlogPost ────────────────────────────────────────────────────────────────

export async function softDeleteBlogPost(postId: string, _options?: SoftDeleteOptions): Promise<void> {
  await prisma.blogPost.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  })
}

export async function restoreBlogPost(postId: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id: postId },
    data: { deletedAt: null },
  })
}

// ─── SupportTicket ───────────────────────────────────────────────────────────

export async function softDeleteSupportTicket(ticketId: string, _options?: SoftDeleteOptions): Promise<void> {
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { deletedAt: new Date() },
  })
}

export async function restoreSupportTicket(ticketId: string): Promise<void> {
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { deletedAt: null },
  })
}

// ─── ManualAudit ─────────────────────────────────────────────────────────────

export async function softDeleteManualAudit(auditId: string, _options?: SoftDeleteOptions): Promise<void> {
  await prisma.manualAudit.update({
    where: { id: auditId },
    data: { deletedAt: new Date() },
  })
}

export async function restoreManualAudit(auditId: string): Promise<void> {
  await prisma.manualAudit.update({
    where: { id: auditId },
    data: { deletedAt: null },
  })
}

// ─── Generic restore by type ─────────────────────────────────────────────────

export async function restoreItem(itemId: string, itemType: SoftDeleteModel): Promise<void> {
  switch (itemType) {
    case 'user':
      return restoreUser(itemId)
    case 'site':
      return restoreSite(itemId)
    case 'scan':
      return restoreScan(itemId)
    case 'team':
      return restoreTeam(itemId)
    case 'blogPost':
      return restoreBlogPost(itemId)
    case 'supportTicket':
      return restoreSupportTicket(itemId)
    case 'manualAudit':
      return restoreManualAudit(itemId)
    default:
      throw new Error(`Unknown item type: ${itemType}`)
  }
}

// ─── Permanent delete by type ────────────────────────────────────────────────

export async function permanentlyDeleteItem(itemId: string, itemType: SoftDeleteModel): Promise<void> {
  switch (itemType) {
    case 'user':
      await prisma.user.delete({ where: { id: itemId } })
      break
    case 'site':
      await prisma.site.delete({ where: { id: itemId } })
      break
    case 'scan':
      await prisma.scan.delete({ where: { id: itemId } })
      break
    case 'team':
      await prisma.team.delete({ where: { id: itemId } })
      break
    case 'blogPost':
      await prisma.blogPost.delete({ where: { id: itemId } })
      break
    case 'supportTicket':
      await prisma.supportTicket.delete({ where: { id: itemId } })
      break
    case 'manualAudit':
      await prisma.manualAudit.delete({ where: { id: itemId } })
      break
    default:
      throw new Error(`Unknown item type: ${itemType}`)
  }
}

// ─── Cleanup job ─────────────────────────────────────────────────────────────

/**
 * Permanently delete records that were soft-deleted more than `daysOld` days ago.
 * Intended to be called from a cron job or admin action.
 */
export async function permanentlyDeleteOldRecords(daysOld: number = 30): Promise<{
  users: number
  sites: number
  scans: number
  teams: number
  blogPosts: number
  supportTickets: number
  manualAudits: number
}> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysOld)

  const where = { deletedAt: { not: null, lt: cutoff } }

  const [users, sites, scans, teams, blogPosts, supportTickets, manualAudits] = await Promise.all([
    prisma.user.deleteMany({ where }),
    prisma.site.deleteMany({ where }),
    prisma.scan.deleteMany({ where }),
    prisma.team.deleteMany({ where }),
    prisma.blogPost.deleteMany({ where }),
    prisma.supportTicket.deleteMany({ where }),
    prisma.manualAudit.deleteMany({ where }),
  ])

  return {
    users: users.count,
    sites: sites.count,
    scans: scans.count,
    teams: teams.count,
    blogPosts: blogPosts.count,
    supportTickets: supportTickets.count,
    manualAudits: manualAudits.count,
  }
}

// ─── Admin: get all soft-deleted records ─────────────────────────────────────

export interface SoftDeletedRecords {
  users: Array<{ id: string; email: string; deletedAt: Date; deletedBy: string | null }>
  sites: Array<{ id: string; url: string; deletedAt: Date; userId: string }>
  scans: Array<{ id: string; siteId: string; status: string; deletedAt: Date }>
  teams: Array<{ id: string; name: string; deletedAt: Date }>
  blogPosts: Array<{ id: string; title: string; deletedAt: Date }>
  supportTickets: Array<{ id: string; subject: string; deletedAt: Date }>
  manualAudits: Array<{ id: string; name: string; deletedAt: Date }>
}

export async function getSoftDeletedRecords(): Promise<SoftDeletedRecords> {
  const where = { deletedAt: { not: null } }

  const [users, sites, scans, teams, blogPosts, supportTickets, manualAudits] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, deletedAt: true, deletedBy: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.site.findMany({
      where,
      select: { id: true, url: true, deletedAt: true, userId: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.scan.findMany({
      where,
      select: { id: true, siteId: true, status: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.team.findMany({
      where,
      select: { id: true, name: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.blogPost.findMany({
      where,
      select: { id: true, title: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.supportTicket.findMany({
      where,
      select: { id: true, subject: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.manualAudit.findMany({
      where,
      select: { id: true, name: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
  ])

  return {
    users: users as SoftDeletedRecords['users'],
    sites: sites as SoftDeletedRecords['sites'],
    scans: scans as SoftDeletedRecords['scans'],
    teams: teams as SoftDeletedRecords['teams'],
    blogPosts: blogPosts as SoftDeletedRecords['blogPosts'],
    supportTickets: supportTickets as SoftDeletedRecords['supportTickets'],
    manualAudits: manualAudits as SoftDeletedRecords['manualAudits'],
  }
}
