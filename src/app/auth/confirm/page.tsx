"use client"

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client-new'
import { ensureUserInDatabase } from '@/lib/user-sync'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

type PageState = 'loading' | 'success' | 'error'

/**
 * Map the `type` param from the email template to a valid Supabase OTP type.
 * Supabase accepts: 'signup', 'invite', 'email_change', 'recovery', 'magiclink', 'email'.
 * Our email templates send: 'signup', 'invite', 'email_change'.
 * Handle edge cases: 'email' → 'signup', 'confirmation' → 'signup'.
 */
function normalizeOtpType(type: string | null): string | null {
  if (!type) return null
  const t = type.toLowerCase().trim()
  if (t === 'email' || t === 'confirmation') return 'signup'
  if (['signup', 'invite', 'email_change', 'magiclink', 'recovery'].includes(t)) return t
  return null
}

function ConfirmClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const attempted = useRef(false)

  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const tokenHash = searchParams.get('token_hash')
    const rawType = searchParams.get('type')
    const otpType = normalizeOtpType(rawType)

    console.log('[Confirm] init', {
      hasTokenHash: !!tokenHash,
      rawType,
      normalizedType: otpType,
    })

    if (!tokenHash || !otpType) {
      console.warn('[Confirm] Missing or invalid params', { tokenHash: !!tokenHash, rawType })
      setErrorMessage(
        !tokenHash
          ? 'This verification link is missing a required token. It may have been truncated — try copying the full link from your email.'
          : `Unknown verification type "${rawType}". Please contact support if this persists.`
      )
      setPageState('error')
      return
    }

    const verify = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          type: otpType as any,
          token_hash: tokenHash,
        })

        if (error) {
          console.error('[Confirm] verifyOtp error:', error.message, error.status)
          const isExpiredOrUsed =
            error.message?.includes('expired') ||
            error.message?.includes('invalid') ||
            error.message?.includes('already') ||
            error.status === 403
          setErrorMessage(
            isExpiredOrUsed
              ? 'This verification link has expired or has already been used. Please request a new one.'
              : `Verification failed: ${error.message}`
          )
          setPageState('error')
          return
        }

        // Clean sensitive params from URL
        try {
          window.history.replaceState(null, '', window.location.pathname)
        } catch {
          // Non-critical
        }

        // Sync user to database (non-fatal)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await ensureUserInDatabase(user)
          }
        } catch (syncErr) {
          console.warn('[Confirm] DB sync failed (non-fatal):', syncErr)
        }

        setPageState('success')

        // Redirect to verified page
        setTimeout(() => {
          router.replace('/auth/verified')
        }, 1500)
      } catch (err: any) {
        console.error('[Confirm] Unexpected error:', err)
        setErrorMessage(err?.message || 'An unexpected error occurred during verification.')
        setPageState('error')
      }
    }

    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--vn-border)] bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur shadow-elev3 p-8">
          <div className="flex flex-col items-center text-center">
            {pageState === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-[#0F5C5C] animate-spin" />
                <h1 className="mt-5 text-xl font-bold text-[#1E1E1E] dark:text-gray-50">
                  Verifying your email...
                </h1>
                <p className="mt-2 text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">
                  Please wait while we confirm your account.
                </p>
              </>
            )}

            {pageState === 'success' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="mt-5 text-xl font-bold text-[#1E1E1E] dark:text-gray-50">
                  Email verified!
                </h1>
                <p className="mt-2 text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">
                  Redirecting you now...
                </p>
              </>
            )}

            {pageState === 'error' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="mt-5 text-xl font-bold text-[#1E1E1E] dark:text-gray-50">
                  Verification failed
                </h1>
                <Alert className="mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-300">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
                <div className="mt-6 flex flex-col gap-3 w-full">
                  <Button asChild className="w-full gradient-primary text-white">
                    <Link href="/auth/register">Sign up again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login">Go to login</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/">Back to home</Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-[#5A5A5A] dark:text-[#C0C3C7]">
                  Need help? Email{' '}
                  <a className="underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E]">
        <Loader2 className="w-12 h-12 text-[#0F5C5C] animate-spin" />
      </div>
    }>
      <ConfirmClient />
    </Suspense>
  )
}
