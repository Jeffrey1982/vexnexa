import { prisma } from './prisma'

/**
 * Soft delete utilities for data recovery
 * NOTE: Requires schema migration to add deletedAt/deletedBy fields
 * Currently disabled until migration is applied
 */

export interface SoftDeleteOptions {
  deletedBy?: string
  reason?: string
}

/**
 * Soft delete a user
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function softDeleteUser(userId: string, options?: SoftDeleteOptions) {
  // Hard delete for now - will be soft delete after migration
  return await prisma.user.delete({
    where: { id: userId }
  })
}

/**
 * Restore a soft-deleted user
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function restoreUser(userId: string) {
  throw new Error('Soft delete not yet implemented - requires schema migration')
}

/**
 * Soft delete a site
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function softDeleteSite(siteId: string, options?: SoftDeleteOptions) {
  // Hard delete for now - will be soft delete after migration
  return await prisma.site.delete({
    where: { id: siteId }
  })
}

/**
 * Restore a soft-deleted site
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function restoreSite(siteId: string) {
  throw new Error('Soft delete not yet implemented - requires schema migration')
}

/**
 * Soft delete a scan
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function softDeleteScan(scanId: string, options?: SoftDeleteOptions) {
  // Hard delete for now - will be soft delete after migration
  return await prisma.scan.delete({
    where: { id: scanId }
  })
}

/**
 * Restore a soft-deleted scan
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function restoreScan(scanId: string) {
  throw new Error('Soft delete not yet implemented - requires schema migration')
}

/**
 * Permanently delete old soft-deleted records (cleanup job)
 * @param daysOld Number of days after which to permanently delete
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function permanentlyDeleteOldRecords(daysOld: number = 30) {
  throw new Error('Soft delete not yet implemented - requires schema migration')
}

/**
 * Get all soft-deleted records for admin review
 * TODO: Enable after running migration to add deletedAt/deletedBy fields
 */
export async function getSoftDeletedRecords() {
  // Return empty arrays until soft delete is implemented
  return {
    users: [],
    sites: [],
    scans: []
  }
}
