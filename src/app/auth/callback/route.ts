import { createClient } from '@/lib/supabase/server-new'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

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
        console.error('Session exchange error:', error)
        return NextResponse.redirect(new URL('/auth/login?error=session_error', request.url))
      }

      if (data.user) {
        console.log('OAuth login successful for user:', data.user.email)

        // TODO: Re-enable user database sync once Prisma build issues are resolved
        console.log('User logged in successfully:', data.user.email)

        // Get redirect parameter - default to dashboard
        const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'
        console.log('🔐 Auth callback, redirecting to:', redirect)

        // Check if this is a new user (first time login)
        const isNewUser = data.user.created_at === data.user.last_sign_in_at

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