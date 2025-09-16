import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.redirect(new URL('/?error=logout_failed', req.url))
    }

    // Create redirect response to home page
    const response = NextResponse.redirect(new URL('/', req.url))

    // Clear any cookies and set cache headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error: any) {
    console.error('Logout failed:', error)
    return NextResponse.redirect(new URL('/?error=logout_failed', req.url))
  }
}

// Also support GET method for direct navigation
export async function GET(req: NextRequest) {
  return POST(req)
}