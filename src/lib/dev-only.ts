import { NextResponse } from 'next/server'

/**
 * Middleware to protect development/test endpoints
 * Returns 404 in production to hide test routes
 */
export function requireDevelopment() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }
  return null
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production'
}
