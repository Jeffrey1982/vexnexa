import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * CSRF Protection using Double Submit Cookie pattern
 */

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or create CSRF token
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!token) {
    token = generateToken()
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })
  }

  return token
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(request: NextRequest): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return cookieToken === headerToken
}

/**
 * Middleware helper to check CSRF token
 */
export function requireCSRF(request: NextRequest): boolean {
  const isValid = verifyCSRFToken(request)
  
  if (!isValid) {
    console.warn('CSRF token validation failed', {
      method: request.method,
      url: request.url,
      hasCoookie: !!request.cookies.get(CSRF_TOKEN_NAME),
      hasHeader: !!request.headers.get(CSRF_HEADER_NAME)
    })
  }
  
  return isValid
}
