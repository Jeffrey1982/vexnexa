import { createClient } from '@/lib/supabase/server-new'
import { NextRequest, NextResponse } from 'next/server'
import { requireDevelopment } from '@/lib/dev-only'

export async function GET(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck


  const supabase = await createClient()

  try {
    // Test email signup with a test account
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    console.log('Testing signup with:', testEmail)

    const startTime = Date.now()
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    })
    const endTime = Date.now()

    const duration = endTime - startTime

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        duration,
        details: error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      duration,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        confirmed: data.user?.confirmed_at !== null
      },
      session: data.session ? 'created' : 'not created (email confirmation required)'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
