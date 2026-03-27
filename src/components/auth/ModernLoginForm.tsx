"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client-new'
import { getSiteUrl } from '@/lib/urls'
import { useTranslations } from 'next-intl'
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react'
import VexnexaLogo from '@/components/brand/VexnexaLogo'

// OAuth provider icons as SVG components
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)



export default function ModernLoginForm() {
  const t = useTranslations('auth.login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [interceptingRecovery, setInterceptingRecovery] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const recoveryChecked = useRef(false)

  // ── Recovery interception ──
  // If the login page is reached with recovery-related params (hash tokens, ?code=, ?token_hash=,
  // ?type=recovery, or ?next=/auth/reset-password), forward everything to /auth/reset-password.
  // Uses window.location.replace (not router.replace) to preserve hash fragments.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (recoveryChecked.current) return
    recoveryChecked.current = true

    const hash: string = window.location.hash
    const search: string = window.location.search
    const hashParams = new URLSearchParams(hash.substring(1))

    // Legacy implicit-grant hash tokens
    const hasRecoveryHash: boolean =
      !!hashParams.get('access_token') &&
      !!hashParams.get('refresh_token')

    // PKCE code or OTP token_hash in query params
    const hasCode: boolean = !!searchParams.get('code')
    const hasTokenHash: boolean = !!searchParams.get('token_hash')

    // "next" param or type=recovery
    const nextParam: string | null = searchParams.get('next')
    const nextPointsToReset: boolean =
      typeof nextParam === 'string' && nextParam.includes('/auth/reset-password')
    const isRecoveryType: boolean = searchParams.get('type') === 'recovery'

    if (hasRecoveryHash || hasCode || hasTokenHash || nextPointsToReset || isRecoveryType) {
      console.log('[Login] intercepted_recovery_link=true', {
        hasRecoveryHash,
        hasCode,
        hasTokenHash,
        nextPointsToReset,
        isRecoveryType,
      })
      setInterceptingRecovery(true)
      // Preserve BOTH search params and hash so reset-password can consume them
      window.location.replace('/auth/reset-password' + search + hash)
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check if user is already logged in and redirect (skip if intercepting recovery)
  useEffect(() => {
    if (interceptingRecovery) return

    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // User is already logged in, redirect to dashboard or intended page
        const redirect = searchParams.get('redirect') || '/dashboard'
        router.push(redirect)
        router.refresh()
      }
    }

    checkAuthStatus()
  }, [supabase, router, searchParams, interceptingRecovery])

  // Handle OAuth errors from URL params
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      switch (oauthError) {
        case 'oauth_error':
          setError(t('errors.oauthError'))
          break
        case 'session_error':
          setError(t('errors.sessionError'))
          break
        case 'unexpected_error':
          setError(t('errors.unexpectedError'))
          break
        default:
          setError(t('errors.genericError'))
      }
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!email || !password) {
      setError(t('errors.emailRequired'))
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('errors.invalidEmail'))
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check for redirect parameter - force dashboard if no specific redirect
      const redirect = searchParams.get('redirect') || '/dashboard'
      console.log('🔐 Login successful, redirecting to:', redirect)

      // Add delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 1000))

      router.push(redirect)
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const redirect = searchParams.get('redirect') || '/dashboard'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?redirect=${encodeURIComponent(redirect)}`
        }
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  // Show minimal redirecting UI while forwarding recovery tokens — prevents login form flash
  if (interceptingRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary"></div>
          <p className="text-sm text-[#5A5A5A] dark:text-[#C0C3C7]">Redirecting to password reset...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-4 -top-4 h-72 w-72 animate-blob rounded-full bg-primary/10 mix-blend-multiply opacity-60 blur-xl filter"></div>
          <div className="animation-delay-2000 absolute -right-4 -top-4 h-72 w-72 animate-blob rounded-full bg-blue-500/10 mix-blend-multiply opacity-50 blur-xl filter"></div>
          <div className="animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 animate-blob rounded-full bg-primary/5 mix-blend-multiply opacity-70 blur-xl filter"></div>
        </div>

        <Card className="border-border bg-card/95 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <VexnexaLogo size={56} />
            </div>
            <CardTitle className="text-2xl font-bold font-display text-[#1E1E1E] dark:text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-[#5A5A5A] dark:text-[#C0C3C7]">
              Sign in to VexNexa
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="h-12 bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border-[#C0C3C7] dark:border-[#444] transition-all duration-200"
                    aria-required="true"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="h-12 bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border-[#C0C3C7] dark:border-[#444] transition-all duration-200 pr-12"
                      aria-required="true"
                      aria-describedby={error ? 'login-error' : undefined}
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
              </div>

              <div aria-live="assertive" aria-atomic="true">
                {error && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-1" id="login-error">
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
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <div className="text-sm">
                <a
                  href="/auth/forgot-password"
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </a>
              </div>

              {/* OAuth Section */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#C0C3C7] dark:border-[#444]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#1E1E1E] px-2 text-[#5A5A5A] dark:text-[#C0C3C7]">
                    Of sign in with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleOAuthLogin}
                className="h-12 w-full gap-2 border-2 border-border transition-all duration-200 hover:border-primary hover:bg-muted dark:hover:bg-muted/50"
                aria-label="Sign in with Google"
              >
                <GoogleIcon />
                <span className="text-sm font-medium">Continue with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#C0C3C7] dark:border-[#444]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#1E1E1E] px-2 text-[#5A5A5A] dark:text-[#C0C3C7]">
                    New to VexNexa?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-2 border-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                onClick={() => router.push('/auth/register')}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Free Account
                </div>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="pt-4 border-t border-[#C0C3C7] dark:border-[#444]">
              <div className="flex items-center justify-center gap-6 text-xs text-[#5A5A5A] dark:text-[#C0C3C7]">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-primary" aria-hidden="true" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FFD166]" aria-hidden="true" />
                  <span>Free plan</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
                  <span>No credit card</span>
                </div>
              </div>
            </div>
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