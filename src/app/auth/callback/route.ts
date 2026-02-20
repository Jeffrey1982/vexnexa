import { createClient } from '@/lib/supabase/server-new'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserInDatabase } from '@/lib/user-sync'
import { sendWelcomeEmail, sendNewUserNotification } from '@/lib/email'

function buildRedirectUrl(params: {
  requestUrl: URL
  pathname: string
  searchParams?: Record<string, string>
}): URL {
  const redirectUrl: URL = new URL(params.pathname, params.requestUrl)

  if (params.searchParams) {
    for (const [key, value] of Object.entries(params.searchParams)) {
      redirectUrl.searchParams.set(key, value)
    }
  }

  return redirectUrl
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Supabase PKCE flow does NOT send type= as a query param for email verification.
  // We detect it via: (a) explicit ?type= param, (b) our custom ?flow=verify hint,
  // (c) after code exchange, by checking email_confirmed_at freshness.
  const flow = requestUrl.searchParams.get('flow')
  const isVerificationHint: boolean =
    type === 'signup' || type === 'email_change' || flow === 'verify'

  console.log('[Callback] Request params:', { code: code?.substring(0, 10), error, type, flow, next })

  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error)
    // Any error with a verification hint → show verify-error page
    if (isVerificationHint) {
      return NextResponse.redirect(
        buildRedirectUrl({
          requestUrl,
          pathname: '/auth/verify-error',
          searchParams: {
            reason: errorDescription || error,
          },
        })
      )
    }

    return NextResponse.redirect(new URL('/auth/login?error=oauth_error', request.url))
  }

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Callback] Session exchange error:', error)

        // Detect verification-related errors even without type= param
        const isVerificationError: boolean =
          isVerificationHint ||
          error.message?.includes('expired') ||
          error.message?.includes('Email link') ||
          error.message?.includes('otp') ||
          error.message?.includes('token')

        if (isVerificationError) {
          return NextResponse.redirect(
            buildRedirectUrl({
              requestUrl,
              pathname: '/auth/verify-error',
              searchParams: {
                reason: error.message,
              },
            })
          )
        }

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

        // Detect email verification: email_confirmed_at was set within the last 2 minutes
        // This works regardless of whether type=signup was in the URL
        const emailConfirmedAt = data.user.email_confirmed_at
          ? new Date(data.user.email_confirmed_at).getTime()
          : 0
        const justVerified: boolean =
          emailConfirmedAt > 0 && (Date.now() - emailConfirmedAt) < 120_000 // 2 min

        const isVerificationFlow: boolean = isVerificationHint || justVerified

        if (isVerificationFlow) {
          console.log('[Callback] Email verification detected for:', data.user.email, {
            justVerified,
            isVerificationHint,
            emailConfirmedAt: data.user.email_confirmed_at,
          })
        }

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

          // Send admin notification for new user registration
          try {
            await sendNewUserNotification({
              email: data.user.email!,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName || undefined,
              company: dbUser.company || undefined,
              jobTitle: dbUser.jobTitle || undefined,
              phoneNumber: dbUser.phoneNumber || undefined,
              website: dbUser.website || undefined,
              country: dbUser.country || undefined,
              marketingEmails: dbUser.marketingEmails,
              productUpdates: dbUser.productUpdates,
              trialEndsAt: dbUser.trialEndsAt || undefined,
            })
            console.log('Admin notification sent for new user:', data.user.email)
          } catch (adminEmailError) {
            console.error('[Callback] ⚠️  Admin notification failed (non-fatal):', adminEmailError)
          }
        }

        if (isVerificationFlow) {
          return NextResponse.redirect(new URL('/auth/verified', request.url))
        }

        if (isNewUser) {
          // Check if profile is complete (has first and last name)
          const hasFirstName = data.user.user_metadata?.first_name || data.user.user_metadata?.given_name
          const hasLastName = data.user.user_metadata?.last_name || data.user.user_metadata?.family_name

          if (!hasFirstName || !hasLastName) {
            // OAuth user without complete profile - redirect to onboarding
            console.log('[Callback] New OAuth user needs to complete profile')
            return NextResponse.redirect(new URL('/onboarding', request.url))
          }

          // Profile is complete - redirect to dashboard with welcome
          return NextResponse.redirect(new URL('/dashboard?welcome=true', request.url))
        } else {
          // Redirect to the intended page for existing users
          return NextResponse.redirect(new URL(redirect, request.url))
        }
      }
    } catch (exchangeError) {
      console.error('Unexpected error during OAuth callback:', exchangeError)
      if (isVerificationHint) {
        return NextResponse.redirect(
          buildRedirectUrl({
            requestUrl,
            pathname: '/auth/verify-error',
            searchParams: {
              reason: 'unexpected_error',
            },
          })
        )
      }

      return NextResponse.redirect(new URL('/auth/login?error=unexpected_error', request.url))
    }
  }

  // If no code or other issues, redirect to login
  if (isVerificationHint) {
    return NextResponse.redirect(
      buildRedirectUrl({
        requestUrl,
        pathname: '/auth/verify-error',
        searchParams: {
          reason: 'missing_code',
        },
      })
    )
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
