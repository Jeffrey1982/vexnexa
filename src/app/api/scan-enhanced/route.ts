import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runEnhancedAccessibilityScan } from '@/lib/scanner-enhanced'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const ScanRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
})

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth()

    // Parse and validate request
    const body = await request.json()
    const validation = ScanRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { url } = validation.data

    if (process.env.NODE_ENV === 'development') {
      console.log('Scanning URL:', url)
    }

    // Run enhanced accessibility scan
    const startTime = Date.now()
    const result = await runEnhancedAccessibilityScan(url)
    const scanTime = Date.now() - startTime

    if (process.env.NODE_ENV === 'development') {
      console.log('Enhanced scan completed in', scanTime, 'ms, score:', result.score)
      console.log('Keyboard navigation:', result.keyboardNavigation.score)
      console.log('Screen reader:', result.screenReaderCompatibility.score)
      console.log('Mobile accessibility:', result.mobileAccessibility.score)
    }

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        scanTime,
        timestamp: new Date().toISOString(),
        enhanced: true,
        version: '2.0'
      }
    })

  } catch (error) {
    console.error('Enhanced scan error:', error)

    return NextResponse.json(
      {
        error: 'Scan failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}