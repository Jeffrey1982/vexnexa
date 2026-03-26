'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * Auth-specific error boundary.
 * Catches runtime errors on any /auth/* page and shows a branded recovery page
 * instead of the generic Next.js "Application error" crash screen.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for diagnostics — never log full tokens/secrets
    console.error('[Auth Error Boundary]', {
      message: error.message,
      digest: error.digest,
      // Capture the pathname without query params (which may contain tokens)
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--vn-border)] bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur shadow-elev3 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-[#1E1E1E] dark:text-gray-50">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm text-[#5A5A5A] dark:text-[#C0C3C7] max-w-sm">
              We hit an unexpected error on this page. This is usually temporary.
              Try again or use the links below to continue.
            </p>

            <div className="mt-6 flex flex-col gap-3 w-full">
              <Button onClick={reset} className="w-full gradient-primary text-white">
                Try again
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/login">Go to login</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">Back to home</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-[#5A5A5A] dark:text-[#C0C3C7]">
              If this keeps happening, email{' '}
              <a className="underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
