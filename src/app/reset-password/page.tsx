"use client"

import { useEffect } from 'react'

/**
 * Compatibility redirect: /reset-password → /auth/reset-password
 *
 * Supabase recovery emails may land on /reset-password (without /auth/ prefix)
 * depending on dashboard config or template mismatch. This page preserves the
 * hash fragment (which contains access_token, refresh_token, type=recovery)
 * and query params, then redirects client-side so the hash is not lost.
 *
 * Server-side redirects (next.config redirects / middleware) strip the hash
 * fragment, so a client-side redirect is required here.
 */
export default function ResetPasswordRedirect(): JSX.Element {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const target: string =
      '/auth/reset-password' + window.location.search + window.location.hash

    console.log('[ResetPasswordRedirect] Forwarding to:', '/auth/reset-password' + window.location.search + (window.location.hash ? '#[hash-present]' : ''))

    window.location.replace(target)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
        <p className="text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">
          Redirecting to password reset...
        </p>
      </div>
    </div>
  )
}
