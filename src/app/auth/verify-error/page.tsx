import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Verification issue | VexNexa',
  robots: {
    index: false,
    follow: false,
  },
}

interface VerifyErrorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getFirstParamValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

export default async function VerifyErrorPage({ searchParams }: VerifyErrorPageProps) {
  const params = await searchParams
  const reason: string | undefined = getFirstParamValue(params?.reason)
  const flow: string | undefined = getFirstParamValue(params?.flow)

  // Determine which recovery action to show based on the flow
  const isRecoveryFlow = flow === 'recovery' || reason?.includes('recovery') || reason?.includes('reset')
  const isSignupFlow = flow === 'signup' || flow === 'invite'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-[var(--vn-border)] bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-elev3 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-elev3">
              <span className="text-2xl font-semibold">!</span>
            </div>

            <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {isRecoveryFlow
                ? 'Password reset link failed'
                : "We couldn't verify your email"}
            </h1>

            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-prose">
              {isRecoveryFlow
                ? 'This password reset link may have expired or already been used. You can request a new one below.'
                : 'This can happen if the link has already been used, expired, or was opened in a different browser.'}
            </p>
          </div>

          {reason ? (
            <div className="mt-6 rounded-xl border border-[var(--vn-border)] bg-[var(--vn-muted)]/50 p-4">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Details</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-words">{reason}</p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3">
            {/* Flow-specific primary action */}
            {isRecoveryFlow ? (
              <Button asChild size="lg" className="w-full gradient-primary text-white">
                <Link href="/auth/forgot-password">Request a new reset link</Link>
              </Button>
            ) : isSignupFlow ? (
              <Button asChild size="lg" className="w-full gradient-primary text-white">
                <Link href="/auth/register">Sign up again</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full gradient-primary text-white">
                <Link href="/auth/login">Go to login</Link>
              </Button>
            )}

            {/* Secondary actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!isRecoveryFlow && (
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto flex-1">
                  <Link href="/auth/login">Go to login</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto flex-1">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground dark:text-gray-400 text-center">
            Need help? Email{' '}
            <a className="underline" href="mailto:info@vexnexa.com">
              info@vexnexa.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
