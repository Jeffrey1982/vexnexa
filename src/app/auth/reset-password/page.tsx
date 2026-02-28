"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client-new'
import { useTranslations } from 'next-intl'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Copy
} from 'lucide-react'

type PageState = 'loading' | 'ready' | 'invalid_link' | 'error' | 'pwa_standalone'

/** Detect if a Supabase auth error indicates an expired or invalid token/code. */
function isTokenError(error: any): boolean {
  if (!error) return false
  const status: number | undefined = error.status
  if (status === 400 || status === 401 || status === 403) return true
  const msg: string = (error.message || '').toLowerCase()
  return (
    msg.includes('expired') ||
    msg.includes('invalid') ||
    msg.includes('token') ||
    msg.includes('otp') ||
    msg.includes('not found') ||
    msg.includes('already used')
  )
}

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword')
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [pageError, setPageError] = useState('')
  const [urlCopied, setUrlCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Run-once guard: prevent re-execution on React strict mode or searchParam changes
  const sessionAttempted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionAttempted.current) return
    sessionAttempted.current = true

    // ── PWA standalone detection ──
    // If the page is opened inside an installed PWA, auth tokens often fail
    // because the PWA context can interfere with hash fragments and cookies.
    // Show a warning and offer to open in the system browser instead.
    const isStandalone: boolean =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      console.log('[ResetPassword] PWA standalone mode detected — showing browser redirect prompt')
      setPageState('pwa_standalone')
      return
    }

    const establishSession = async (): Promise<void> => {
      try {
        // ── Gather all available token sources ──
        const rawHash: string = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(rawHash)
        const accessToken: string | null = hashParams.get('access_token')
        const refreshToken: string | null = hashParams.get('refresh_token')
        const hashError: string | null = hashParams.get('error')
        const hashErrorDesc: string | null = hashParams.get('error_description')

        const code: string | null = searchParams.get('code')
        const tokenHash: string | null = searchParams.get('token_hash')
        const otpType: string | null = searchParams.get('type')
        const urlError: string | null = searchParams.get('error')
        const urlErrorDesc: string | null = searchParams.get('error_description')

        // ── Diagnostics (no token values logged) ──
        const detectedFlow: string =
          code ? 'pkce_code' :
          tokenHash ? 'otp_token_hash' :
          (accessToken && refreshToken) ? 'hash_tokens' :
          'none'
        console.log('[ResetPassword] diagnostics', {
          hasSearchParams: !!(code || tokenHash || otpType),
          hashLength: rawHash.length,
          detectedFlow,
        })

        // ── (0) Check for error params in hash or query ──
        if (hashError) {
          console.error('[ResetPassword] Hash error:', hashError)
          window.history.replaceState(null, '', window.location.pathname)
          setPageError(hashErrorDesc || hashError)
          setPageState('invalid_link')
          return
        }
        if (urlError) {
          console.error('[ResetPassword] URL error:', urlError)
          setPageError(urlErrorDesc || urlError)
          setPageState('invalid_link')
          return
        }

        // ── (1) Existing session (e.g. redirected from /auth/callback after PKCE recovery) ──
        // Check this FIRST — if the callback route already exchanged the code and created
        // a session, we should just use it rather than trying to re-exchange a spent code.
        const { data: { user: existingUser } } = await supabase.auth.getUser()
        if (existingUser) {
          console.log('[ResetPassword] recovery_flow=existing_session, user:', existingUser.email)
          // Clean URL to remove any leftover params
          if (code || tokenHash || rawHash.length > 0) {
            window.history.replaceState(null, '', window.location.pathname)
          }
          setPageState('ready')
          return
        }

        // ── (2) PKCE code in query params (PREFERRED — survives redirects) ──
        if (code) {
          console.log('[ResetPassword] recovery_flow=pkce_code')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            const reason: string = isTokenError(exchangeError) ? 'expired_or_invalid_code' : 'exchange_error'
            console.error('[ResetPassword] failure_reason=' + reason, exchangeError.message)
            if (isTokenError(exchangeError)) {
              setPageError('This reset link has expired. Please request a new one.')
              setPageState('invalid_link')
              return
            }
            setPageError(exchangeError.message)
            setPageState('error')
            return
          }
          window.history.replaceState(null, '', window.location.pathname)
          setPageState('ready')
          return
        }

        // ── (3) OTP token_hash flow (?token_hash=...&type=recovery) ──
        if (tokenHash && otpType === 'recovery') {
          console.log('[ResetPassword] recovery_flow=otp_token_hash')
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          })
          if (otpError) {
            const reason: string = isTokenError(otpError) ? 'expired_or_invalid_otp' : 'otp_error'
            console.error('[ResetPassword] failure_reason=' + reason, otpError.message)
            if (isTokenError(otpError)) {
              setPageError('This reset link has expired. Please request a new one.')
              setPageState('invalid_link')
              return
            }
            setPageError(otpError.message)
            setPageState('error')
            return
          }
          window.history.replaceState(null, '', window.location.pathname)
          setPageState('ready')
          return
        }

        // ── (4) Legacy hash tokens (fallback — fragile, easily lost during redirects) ──
        if (accessToken && refreshToken) {
          console.log('[ResetPassword] recovery_flow=hash_tokens (legacy)')
          window.history.replaceState(null, '', window.location.pathname)
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) {
            const reason: string = isTokenError(sessionError) ? 'expired_or_invalid_token' : 'session_error'
            console.error('[ResetPassword] failure_reason=' + reason, sessionError.message)
            if (isTokenError(sessionError)) {
              setPageError('This reset link has expired. Please request a new one.')
              setPageState('invalid_link')
              return
            }
            setPageError(sessionError.message)
            setPageState('error')
            return
          }
          const { data: { user } } = await supabase.auth.getUser()
          console.log('[ResetPassword] Session established for:', user?.email ?? 'unknown')
          setPageState('ready')
          return
        }

        // ── (5) No tokens, no session — invalid link ──
        console.warn('[ResetPassword] recovery_flow=none — no tokens or session found', {
          href: window.location.href.replace(/[?#].*/, '…'),
          searchPresent: window.location.search.length > 1,
          hashLength: rawHash.length,
          selectedFlow: 'none',
        })
        setPageError('This link is missing required parameters. Please request a new reset email.')
        setPageState('invalid_link')
      } catch (err: any) {
        console.error('[ResetPassword] Unexpected error:', err)
        setPageError(err?.message || 'An unexpected error occurred')
        setPageState('error')
      }
    }

    establishSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError(t('errors.passwordsMatch'))
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError(t('errors.passwordLength'))
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage(t('success'))

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-4">
      <div className="w-full max-w-md">
        {/* Floating elements for visual interest */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#D45A00] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#FFD166] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#0F5C5C] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-[#1E1E1E]/90 shadow-2xl border border-[#C0C3C7]/20">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold font-display text-[#1E1E1E] dark:text-white">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-base text-[#5A5A5A] dark:text-[#C0C3C7]">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* --- PWA standalone warning --- */}
            {pageState === 'pwa_standalone' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                  <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                    <strong>This link needs to be opened in your browser.</strong><br />
                    Password reset links don&apos;t work inside the installed app.
                    Tap the button below or use your device&apos;s menu (⋯) and choose
                    &quot;Open in Browser&quot;.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => {
                    // Attempt to open the current URL (with hash/query) in the system browser
                    window.open(window.location.href, '_blank', 'noopener,noreferrer')
                  }}
                  className="w-full h-12 gradient-primary hover:opacity-90 text-white font-medium rounded-lg shadow-lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Browser
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href)
                      setUrlCopied(true)
                      setTimeout(() => setUrlCopied(false), 2500)
                    } catch { /* clipboard not available */ }
                  }}
                  className="w-full"
                >
                  {urlCopied ? (
                    <><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy link to clipboard</>
                  )}
                </Button>
                <p className="text-xs text-[#5A5A5A] dark:text-[#C0C3C7]">
                  After opening in your browser, you can close this window.
                </p>
              </div>
            )}

            {/* --- Loading state --- */}
            {pageState === 'loading' && (
              <div className="text-center space-y-4 py-8">
                <div className="w-12 h-12 border-4 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">Verifying your reset link...</p>
              </div>
            )}

            {/* --- Invalid / expired link state --- */}
            {pageState === 'invalid_link' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    {pageError || 'This reset link is invalid or has expired.'}
                  </AlertDescription>
                </Alert>
                <Link href="/auth/forgot-password">
                  <Button className="w-full h-12 gradient-primary hover:opacity-90 text-white font-medium rounded-lg">
                    Request a new reset email
                  </Button>
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm text-[#5A5A5A] hover:text-[#FF6B35] transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            )}

            {/* --- Generic error state --- */}
            {pageState === 'error' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <Alert variant="destructive">
                  <AlertDescription>
                    {pageError || 'Something went wrong. Please try again.'}
                  </AlertDescription>
                </Alert>
                <Link href="/auth/forgot-password">
                  <Button variant="outline" className="w-full">
                    Request a new reset email
                  </Button>
                </Link>
              </div>
            )}

            {/* --- Ready: show form or success --- */}
            {pageState === 'ready' && (
              <>
                {message ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        {message}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          {t('passwordLabel')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder={t('passwordPlaceholder')}
                            aria-describedby={error ? 'reset-error' : undefined}
                            className="h-12 bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border-[#C0C3C7] dark:border-[#444] transition-all duration-200 pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          {t('confirmPasswordLabel')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder={t('confirmPasswordPlaceholder')}
                            aria-describedby={error ? 'reset-error' : undefined}
                            className="h-12 bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border-[#C0C3C7] dark:border-[#444] transition-all duration-200 pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div aria-live="assertive" aria-atomic="true">
                      {error && (
                        <Alert variant="destructive" className="animate-in slide-in-from-top-1" id="reset-error">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 gradient-primary hover:opacity-90 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          {t('resetting')}
                        </div>
                      ) : (
                        t('resetButton')
                      )}
                    </Button>
                  </form>
                )}

                {/* Security tips */}
                {!message && (
                  <div className="pt-4 border-t border-[#C0C3C7] dark:border-[#444]">
                    <div className="text-xs text-[#5A5A5A] dark:text-[#C0C3C7] space-y-1">
                      <p className="font-medium">Tips for a strong password:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>At least 8 characters long</li>
                        <li>Combination of letters, numbers and symbols</li>
                        <li>Not guessable from personal information</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}