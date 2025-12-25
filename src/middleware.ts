import { NextRequest, NextResponse } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  // Legacy Shopify URL patterns
  const SHOPIFY_PATTERNS = [
    /^\/products\//,
    /^\/collections\//,
    /^\/cart\/?$/,
    /^\/checkout/,
    /^\/blogs\//,
    /^\/account/,
    /^\/search/,
  ] as const

  // Check if URL matches legacy Shopify pattern
  const isShopifyUrl = SHOPIFY_PATTERNS.some(pattern =>
    pattern.test(pathname.toLowerCase())
  )

  if (isShopifyUrl) {
    return new NextResponse(null, {
      status: 410,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    })
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Different rate limits for different endpoints
    let rateLimitResult

    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/sync-user')) {
      // Stricter rate limit for auth endpoints
      rateLimitResult = authLimiter(request)
    } else {
      // Standard rate limit for all other API endpoints
      rateLimitResult = apiLimiter(request)
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }

  const response = NextResponse.next()

  // Prevent indexing of ALL API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // Handle locale cookie if not set, default to 'en'
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', 'en', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
  }

  // UTM parameter capture
  const searchParams = url.searchParams

  // UTM parameters we want to track
  const utmParams = {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    utm_term: searchParams.get('utm_term'),
  }

  // Check if any UTM parameters are present
  const hasUtmParams = Object.values(utmParams).some(param => param !== null)

  if (hasUtmParams) {
    // Filter out null values and create clean UTM data
    const cleanUtmParams = Object.fromEntries(
      Object.entries(utmParams).filter(([_, value]) => value !== null)
    )

    // Store UTM parameters in a cookie for 7 days
    response.cookies.set('vn_utm', JSON.stringify(cleanUtmParams), {
      httpOnly: false, // Allow JavaScript access for analytics
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  }

  // Enhanced Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Enhanced CSP header for additional security with Supabase support
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.vexnexa.com https://vexnexa.com https://*.supabase.co https://va.vercel-scripts.com wss://*.supabase.co https://*.mollie.com https://www.google.com https://*.gstatic.com https://*.google-analytics.com",
    "img-src 'self' blob: data: https: https://*.supabase.co https://*.gstatic.com",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.mollie.com",
    "frame-ancestors 'none'",
    "frame-src https://*.mollie.com",
    "upgrade-insecure-requests",
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths including API routes
     * Exclude only static files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
