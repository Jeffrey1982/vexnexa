import { createClient } from '@/lib/supabase/server-new'
import { ensureUserInDatabase } from '@/lib/user-sync'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Ensure user exists in database
    const dbUser = await ensureUserInDatabase(user)

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        plan: dbUser.plan,
        profileCompleted: dbUser.profileCompleted
      }
    })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ error: 'User sync failed' }, { status: 500 })
  }
}