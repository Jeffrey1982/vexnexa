import { createClient } from '@/lib/supabase/server-new'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserInDatabase } from '@/lib/user-sync'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')

  console.log('[Callback] Request params:', { code: code?.substring(0, 10), error, type, next })

  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=oauth_error', request.url))
  }

  if (code) {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Callback] Session exchange error:', error)
        return NextResponse.redirect(new URL('/auth/login?error=session_error', request.url))
      }

      if (data.user) {
        console.log('[Callback] Session created for user:', data.user.email)

        // Check if this is a password recovery/reset flow
        // Can be detected via type param OR next param pointing to reset-password
        if (type === 'recovery' || next === '/auth/reset-password') {
          console.log('[Callback] Password recovery flow detected, redirecting to reset-password')
          // Create a new response that sets the session cookie and redirects
          const response = NextResponse.redirect(new URL('/auth/reset-password', request.url))
          return response
        }

        // Database sync - re-enabled
        let dbSyncSuccess = false
        let dbUser = null

        try {
          dbUser = await ensureUserInDatabase(data.user)
          dbSyncSuccess = true
          console.log('Database sync successful for user:', data.user.email)
        } catch (dbError) {
          console.error('[Callback] ⚠️  Database sync failed (non-fatal):', dbError)
        }

        // Get redirect parameter - default to dashboard
        const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'
        console.log('🔐 Auth callback, redirecting to:', redirect)

        // Check if this is a new user (first time login)
        // Small tolerance for timestamp comparison (1 second)
        const createdAt = new Date(data.user.created_at).getTime()
        const lastSignIn = new Date(data.user.last_sign_in_at!).getTime()
        const isNewUser = Math.abs(createdAt - lastSignIn) < 1000

        // Send welcome email for new users (only if DB sync succeeded and we have user data)
        if (isNewUser && dbSyncSuccess && dbUser?.firstName) {
          try {
            await sendWelcomeEmail({
              email: data.user.email!,
              firstName: dbUser.firstName,
              trialEndsAt: dbUser.trialEndsAt || undefined,
            })
            console.log('Welcome email sent to:', data.user.email)
          } catch (emailError) {
            console.error('[Callback] ⚠️  Welcome email failed (non-fatal):', emailError)
          }
        }

        if (isNewUser) {
          // Redirect to dashboard with welcome for new users
          return NextResponse.redirect(new URL('/dashboard?welcome=true', request.url))
        } else {
          // Redirect to the intended page for existing users
          return NextResponse.redirect(new URL(redirect, request.url))
        }
      }
    } catch (exchangeError) {
      console.error('Unexpected error during OAuth callback:', exchangeError)
      return NextResponse.redirect(new URL('/auth/login?error=unexpected_error', request.url))
    }
  }

  // If no code or other issues, redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
