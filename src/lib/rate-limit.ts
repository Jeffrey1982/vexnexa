import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  identifier?: (req: NextRequest) => string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  limit: number
}

export function rateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, identifier = getDefaultIdentifier } = config

  return (req: NextRequest): RateLimitResult => {
    const key = identifier(req)
    const now = Date.now()
    const resetTime = now + windowMs

    let entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // First request or window expired
      entry = { count: 1, resetTime }
      rateLimitStore.set(key, entry)

      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime,
        limit: maxRequests
      }
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        limit: maxRequests
      }
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)

    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
      limit: maxRequests
    }
  }
}

function getDefaultIdentifier(req: NextRequest): string {
  // Get IP address from various headers
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0]?.trim() ||
            realIp ||
            cfConnectingIp ||
            'unknown'

  return `ip:${ip}`
}

// Pre-configured rate limiters for common use cases
export const contactFormLimiter = rateLimit({
  maxRequests: 5, // 5 messages per hour
  windowMs: 60 * 60 * 1000 // 1 hour
})

export const newsletterLimiter = rateLimit({
  maxRequests: 5, // 5 signups per day per IP
  windowMs: 24 * 60 * 60 * 1000 // 24 hours
})

export const apiLimiter = rateLimit({
  maxRequests: 100, // 100 requests per 15 minutes
  windowMs: 15 * 60 * 1000 // 15 minutes
})

export const authLimiter = rateLimit({
  maxRequests: 10, // 10 auth attempts per 15 minutes
  windowMs: 15 * 60 * 1000 // 15 minutes
})

// Free-scan and lead-capture limits moved to the distributed NamedLimit
// configs below (FREE_SCAN_LIMIT / FREE_SCAN_LEAD_LIMIT) — public abuse
// surfaces must not rely on per-instance memory.

/* ─────────────────────────────────────────────────────────────────────────
 * Distributed rate limiting (Upstash Redis REST)
 *
 * The in-memory store above is per-lambda-instance on Vercel, so limits on
 * public endpoints are effectively unenforced under scale-out. The helpers
 * below use Upstash when UPSTASH_REDIS_REST_URL/TOKEN are set and fall back
 * to the in-memory store otherwise (local dev, missing config, Redis down).
 * ──────────────────────────────────────────────────────────────────────── */

export interface NamedLimit {
  name: string
  maxRequests: number
  windowMs: number
}

export const FREE_SCAN_LIMIT: NamedLimit = {
  name: 'free-scan',
  maxRequests: 3, // 3 anonymous scans per day per IP
  windowMs: 24 * 60 * 60 * 1000
}

export const FREE_SCAN_LEAD_LIMIT: NamedLimit = {
  name: 'free-scan-lead',
  maxRequests: 5, // 5 lead-capture emails per day per IP
  windowMs: 24 * 60 * 60 * 1000
}

export const NEWSLETTER_LIMIT: NamedLimit = {
  name: 'newsletter',
  maxRequests: 5, // 5 signups per day per IP
  windowMs: 24 * 60 * 60 * 1000
}

/**
 * Fixed-window counter in Upstash via the REST pipeline API.
 * Returns null when Upstash is not configured or unreachable.
 */
async function upstashRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const redisKey = `rl:${key}`
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify([
        ['INCR', redisKey],
        // NX: only set the expiry on first increment of the window (Redis >= 7)
        ['PEXPIRE', redisKey, String(windowMs), 'NX'],
        ['PTTL', redisKey]
      ]),
      signal: AbortSignal.timeout(3000)
    })

    if (!res.ok) {
      console.error(`[rate-limit] Upstash HTTP ${res.status}; falling back to in-memory`)
      return null
    }

    const results = (await res.json()) as Array<{ result?: unknown; error?: string }>
    const count = Number(results?.[0]?.result)
    const ttl = Number(results?.[2]?.result)
    if (!Number.isFinite(count)) {
      console.error('[rate-limit] Unexpected Upstash response; falling back to in-memory')
      return null
    }

    const resetTime = Date.now() + (Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs)
    return {
      success: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime,
      limit: maxRequests
    }
  } catch (error) {
    console.error('[rate-limit] Upstash unreachable; falling back to in-memory:', error)
    return null
  }
}

/**
 * Distributed per-IP rate limit for a request. Uses Upstash when configured,
 * in-memory otherwise.
 */
export async function checkRateLimit(
  req: NextRequest,
  limit: NamedLimit
): Promise<RateLimitResult> {
  const key = `${limit.name}:${getDefaultIdentifier(req)}`
  const redis = await upstashRateLimit(key, limit.maxRequests, limit.windowMs)
  if (redis) return redis
  return checkKeyedRateLimit(key, limit.maxRequests, limit.windowMs)
}

/**
 * Distributed keyed rate limit for server actions / non-Request contexts.
 */
export async function checkKeyedRateLimitDistributed(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = await upstashRateLimit(key, maxRequests, windowMs)
  if (redis) return redis
  return checkKeyedRateLimit(key, maxRequests, windowMs)
}

/**
 * Keyed rate limit for server actions / non-Request contexts (same store as HTTP limiters).
 */
export function checkKeyedRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const storeKey = `keyed:${key}`
  const now = Date.now()
  const resetTime = now + windowMs

  let entry = rateLimitStore.get(storeKey)

  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime }
    rateLimitStore.set(storeKey, entry)
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime,
      limit: maxRequests
    }
  }

  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: maxRequests
    }
  }

  entry.count++
  rateLimitStore.set(storeKey, entry)

  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
    limit: maxRequests
  }
}