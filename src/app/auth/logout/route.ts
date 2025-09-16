import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Redirect to the home page after successful logout
    return NextResponse.redirect(new URL('/', req.url))

  } catch (error: any) {
    console.error('Logout failed:', error)
    return NextResponse.json({
      error: 'Logout failed',
      details: error.message
    }, { status: 500 })
  }
}

// Also support GET method for direct navigation
export async function GET(req: NextRequest) {
  return POST(req)
}