"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  Shield
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setMessage(t('success'))
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
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#FF6B35] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('backToLogin')}
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="w-4 h-4" />
                      {t('emailLabel')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t('emailPlaceholder')}
                      className="h-12 bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border-[#C0C3C7] dark:border-[#444] transition-all duration-200"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 gradient-primary hover:opacity-90 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        {t('sending')}
                      </div>
                    ) : (
                      t('sendButton')
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-[#5A5A5A] hover:text-[#FF6B35] transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Terug naar inloggen
                  </Link>
                </div>
              </>
            )}

            {/* Info text */}
            <div className="pt-4 border-t border-[#C0C3C7] dark:border-[#444]">
              <p className="text-xs text-[#5A5A5A] dark:text-[#C0C3C7] text-center">
                Als je een account hebt, ontvang je binnen enkele minuten een email met instructies.
              </p>
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