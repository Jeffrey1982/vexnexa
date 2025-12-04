import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standardized API response utilities for consistent error handling
 */

export interface ApiError {
  error: string
  code?: string
  details?: any
  timestamp?: string
}

export interface ApiSuccess<T = any> {
  success: true
  data?: T
  message?: string
  timestamp?: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Standard error codes
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
} as const

/**
 * Create a standardized success response
 */
export function successResponse<T = any>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error,
      code,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Handle Zod validation errors
 */
export function validationErrorResponse(zodError: ZodError): NextResponse {
  return errorResponse(
    'Validation failed',
    400,
    ErrorCodes.VALIDATION_ERROR,
    zodError.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }))
  )
}

/**
 * Unauthorized error (401)
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse {
  return errorResponse(message, 401, ErrorCodes.UNAUTHORIZED)
}

/**
 * Forbidden error (403)
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return errorResponse(message, 403, ErrorCodes.FORBIDDEN)
}

/**
 * Not found error (404)
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return errorResponse(`${resource} not found`, 404, ErrorCodes.NOT_FOUND)
}

/**
 * Conflict error (409)
 */
export function conflictResponse(message: string = 'Resource already exists'): NextResponse {
  return errorResponse(message, 409, ErrorCodes.ALREADY_EXISTS)
}

/**
 * Rate limit exceeded error (429)
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      retryAfter,
      timestamp: new Date().toISOString()
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString()
      }
    }
  )
}

/**
 * Internal server error (500)
 */
export function internalErrorResponse(
  message: string = 'An unexpected error occurred',
  details?: any
): NextResponse {
  // Log the error details server-side
  if (details) {
    console.error('Internal error:', details)
  }
  
  // Only send error details in development
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return errorResponse(
    message,
    500,
    ErrorCodes.INTERNAL_ERROR,
    isDevelopment ? details : undefined
  )
}

/**
 * Database error (500)
 */
export function databaseErrorResponse(message: string = 'Database operation failed'): NextResponse {
  return errorResponse(message, 500, ErrorCodes.DATABASE_ERROR)
}
