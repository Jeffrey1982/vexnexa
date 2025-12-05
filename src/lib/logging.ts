import { prisma } from './prisma'
import { headers } from 'next/headers'

// ============================================
// ERROR LOGGING
// ============================================

export type ErrorLevel = 'error' | 'warning' | 'critical'

interface LogErrorOptions {
  message: string
  stack?: string
  level?: ErrorLevel
  source?: string
  statusCode?: number
  userId?: string
  userEmail?: string
  url?: string
  method?: string
  metadata?: any
}

export async function logError(options: LogErrorOptions) {
  try {
    await prisma.errorLog.create({
      data: {
        message: options.message,
        stack: options.stack,
        level: options.level || 'error',
        source: options.source,
        statusCode: options.statusCode,
        userId: options.userId,
        userEmail: options.userEmail,
        url: options.url,
        method: options.method,
        metadata: options.metadata,
      }
    })
  } catch (error) {
    // Fallback to console if database logging fails
    console.error('[ERROR LOG FAILED]', error, options)
  }
}

// ============================================
// API LOGGING
// ============================================

interface LogApiRequestOptions {
  method: string
  path: string
  statusCode: number
  duration: number // in milliseconds
  userId?: string
  userEmail?: string
  ip?: string
  userAgent?: string
  requestBody?: any
  responseBody?: any
  errorMessage?: string
}

export async function logApiRequest(options: LogApiRequestOptions) {
  try {
    await prisma.apiLog.create({
      data: {
        method: options.method,
        path: options.path,
        statusCode: options.statusCode,
        duration: options.duration,
        userId: options.userId,
        userEmail: options.userEmail,
        ip: options.ip,
        userAgent: options.userAgent,
        requestBody: options.requestBody,
        responseBody: options.responseBody,
        errorMessage: options.errorMessage,
      }
    })
  } catch (error) {
    console.error('[API LOG FAILED]', error)
  }
}

// ============================================
// AUDIT LOGGING
// ============================================

interface LogAuditOptions {
  action: string // e.g., "user.created", "subscription.upgraded"
  entity: string // User, Site, Scan, etc.
  entityId?: string
  description: string
  actorId?: string
  actorEmail?: string
  actorType?: 'user' | 'system' | 'admin' | 'api'
  metadata?: any
  oldValues?: any
  newValues?: any
}

export async function logAudit(options: LogAuditOptions) {
  try {
    // Get IP and user agent from headers if available
    let ip: string | undefined
    let userAgent: string | undefined

    try {
      const headersList = await headers()
      ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
      userAgent = headersList.get('user-agent') || undefined
    } catch {
      // Headers not available (e.g., in a non-request context)
    }

    await prisma.auditLog.create({
      data: {
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        description: options.description,
        actorId: options.actorId,
        actorEmail: options.actorEmail,
        actorType: options.actorType || 'user',
        ip,
        userAgent,
        metadata: options.metadata,
        oldValues: options.oldValues,
        newValues: options.newValues,
      }
    })
  } catch (error) {
    console.error('[AUDIT LOG FAILED]', error)
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

// Log user actions
export async function logUserAction(
  userId: string,
  userEmail: string,
  action: string,
  description: string,
  metadata?: any
) {
  await logAudit({
    action,
    entity: 'User',
    entityId: userId,
    description,
    actorId: userId,
    actorEmail: userEmail,
    actorType: 'user',
    metadata,
  })
}

// Log admin actions
export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  entity: string,
  entityId: string,
  description: string,
  metadata?: any
) {
  await logAudit({
    action,
    entity,
    entityId,
    description,
    actorId: adminId,
    actorEmail: adminEmail,
    actorType: 'admin',
    metadata,
  })
}

// Log system events
export async function logSystemEvent(
  action: string,
  entity: string,
  description: string,
  metadata?: any
) {
  await logAudit({
    action,
    entity,
    description,
    actorType: 'system',
    metadata,
  })
}
