import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Email verified | VexNexa',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifiedPage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-[var(--vn-border)] bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-elev3 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--vn-primary)] text-white flex items-center justify-center shadow-elev3">
              <span className="text-2xl font-semibold">✓</span>
            </div>

            <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Email verified — you’re all set.
            </h1>

            <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-prose">
              Your account is confirmed. Next, head to your dashboard to connect a site and run your first accessibility scan.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-[var(--vn-border)] bg-[var(--vn-muted)]/50 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Next steps</h2>
            <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-200">
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
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/">Back to home</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
            If you didn’t mean to verify this email, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
