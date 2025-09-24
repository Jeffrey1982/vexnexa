import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // TEMPORARILY DISABLED ALL AUTH MIDDLEWARE TO FIX CACHING ISSUES
  // Just handle legacy dashboard redirect
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/main-dashboard', request.url))
  }
  
  // UTM parameter capture
  const url = request.nextUrl
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
    response.cookies.set('tp_utm', JSON.stringify(cleanUtmParams), {
      httpOnly: false, // Allow JavaScript access for analytics
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    // Optionally redirect to clean URL (remove UTM parameters from URL)
    // Uncomment if you want clean URLs:
    /*
    if (url.pathname === '/' || url.pathname.startsWith('/features') || url.pathname.startsWith('/pricing')) {
      const cleanUrl = new URL(url.toString())
      Object.keys(utmParams).forEach(param => {
        cleanUrl.searchParams.delete(param)
      })
      
      if (cleanUrl.toString() !== url.toString()) {
        return NextResponse.redirect(cleanUrl)
      }
    }
    */
  }
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  
  // CSP header for additional security with Supabase support
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com wss://*.supabase.co",
    "img-src 'self' blob: data: https: https://*.supabase.co",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  return response
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}