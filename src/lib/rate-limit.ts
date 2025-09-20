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
  for (const [key, entry] of rateLimitStore.entries()) {
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
  maxRequests: 3, // 3 signups per day
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