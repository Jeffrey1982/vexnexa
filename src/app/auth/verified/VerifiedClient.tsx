"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client-new'
import type { User } from '@supabase/supabase-js'

export default function VerifiedClient(): JSX.Element {
  type RouterType = ReturnType<typeof useRouter>
  type SupabaseClientType = ReturnType<typeof createClient>

  const router: RouterType = useRouter()
  const supabase: SupabaseClientType = useMemo((): SupabaseClientType => createClient(), [])

  const [secondsLeft, setSecondsLeft] = useState<number>(15)
  const [checkingSession, setCheckingSession] = useState<boolean>(true)

  useEffect((): (() => void) => {
    let intervalId: number | undefined
    let timeoutId: number | undefined
    let cancelled: boolean = false

    type GetUserResult = { data: { user: User | null } }

    const run = async (): Promise<void> => {
      try {
        const { data }: GetUserResult = await supabase.auth.getUser()
        if (cancelled) return

        if (!data.user) {
          router.replace('/auth/login?error=session_expired')
          return
        }

        setCheckingSession(false)

        intervalId = window.setInterval((): void => {
          setSecondsLeft((prev: number): number => {
            if (prev <= 1) return 0
            return prev - 1
          })
        }, 1000)

        timeoutId = window.setTimeout((): void => {
          router.replace('/dashboard')
        }, 15000)
      } catch {
        router.replace('/auth/login?error=session_error')
      }
    }

    void run()

    return (): void => {
      cancelled = true
      if (intervalId !== undefined) window.clearInterval(intervalId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [router, supabase])

  const handleGoNow = (): void => {
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-6">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-[var(--vn-border)] bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur shadow-elev3 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-elev3">
              <span className="text-2xl font-semibold">✓</span>
            </div>

            <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight text-[#1E1E1E] dark:text-gray-50">
              Email verified — you’re all set.
            </h1>

            <p className="mt-3 text-sm md:text-base text-[#5A5A5A] dark:text-[#C0C3C7] max-w-prose">
              Your account is confirmed. We’ll take you to your dashboard automatically.
            </p>

            <p className="mt-4 text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">
              {checkingSession ? (
                'Checking your session…'
              ) : (
                <>Redirecting in <span className="font-semibold text-[#0F5C5C]">{secondsLeft}</span> seconds…</>
              )}
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-[var(--vn-border)] bg-[var(--vn-muted)]/50 p-5">
            <h2 className="text-sm font-semibold text-[#1E1E1E] dark:text-gray-100">Next steps</h2>
            <div className="mt-3 grid gap-2 text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">
              <div className="flex gap-2">
                <span className="text-[var(--vn-primary)]">1.</span>
                <span>Connect your first website</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[var(--vn-primary)]">2.</span>
                <span>Run your first scan</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[var(--vn-primary)]">3.</span>
                <span>Review your report and recommendations</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="w-full sm:w-auto gradient-primary text-white" onClick={handleGoNow}>
              Go to dashboard now
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/">Back to home</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-[#5A5A5A] dark:text-[#C0C3C7] text-center">
            If you didn’t mean to verify this email, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
