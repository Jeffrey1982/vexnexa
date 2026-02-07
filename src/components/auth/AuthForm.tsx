"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client-new'
import { useTranslations } from 'next-intl'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations(mode === 'login' ? 'auth.login' : 'auth.register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'register') {
        const isLocalhost: boolean = window.location.hostname === 'localhost'
        const origin: string = isLocalhost
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin)

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
          },
        })

        if (error) throw error

        setMessage(t('errors.success') || 'Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'login' ? t('title') : t('title')}</CardTitle>
        <CardDescription>
          {mode === 'login' 
            ? t('subtitle')
            : t('subtitle')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('emailPlaceholder')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('passwordPlaceholder')}
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading 
              ? (mode === 'login' ? t('signingIn') : t('creatingAccount')) 
              : (mode === 'login' ? t('title') : t('title'))
            }
          </Button>

          <div className="text-center text-sm">
            {mode === 'login' ? (
              <>
                {t('noAccount')}?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => router.push('/auth/register')}
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                {t('haveAccount')}?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => router.push('/auth/login')}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}