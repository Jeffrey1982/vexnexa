"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

type MolliePaymentStatus =
  | 'open'
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'canceled'
  | 'expired'
  | 'failed'

type ApiResponse = {
  paymentId: string
  status: MolliePaymentStatus
  plan: string | null
  billingInterval: string | null
  type?: string | null
  isOneOffCheckout?: boolean
  user: { plan: string; subscriptionStatus: string }
}

type UiState =
  | { kind: 'processing' }
  | { kind: 'paid' }
  | { kind: 'canceled' }
  | { kind: 'expired' }
  | { kind: 'failed' }
  | { kind: 'error'; message: string; paymentId?: string }

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 30_000
const REDIRECT_DELAY_MS = 1500

export default function CheckoutReturnClient() {
  const t = useTranslations('checkout.return')
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('paymentId') ?? searchParams.get('id')

  const [state, setState] = useState<UiState>({ kind: 'processing' })
  const startedAtRef = useRef<number>(Date.now())
  const cancelledRef = useRef<boolean>(false)

  useEffect(() => {
    if (!paymentId) {
      setState({ kind: 'error', message: 'missing_id' })
      return
    }

    cancelledRef.current = false
    startedAtRef.current = Date.now()

    const poll = async () => {
      if (cancelledRef.current) return

      try {
        const res = await fetch(
          `/api/mollie/payment-status?id=${encodeURIComponent(paymentId)}`,
          { cache: 'no-store' }
        )

        if (!res.ok) {
          // 401 = session expired, 403 = not the owner, 404 = not found
          if (res.status === 401) {
            router.push(`/auth/login?redirect=/checkout/return?paymentId=${paymentId}`)
            return
          }
          setState({
            kind: 'error',
            message: `http_${res.status}`,
            paymentId,
          })
          return
        }

        const data: ApiResponse = await res.json()

        // Terminal failure states — show message immediately
        if (data.status === 'canceled') {
          setState({ kind: 'canceled' })
          scheduleRedirect('/pricing?checkout=cancelled')
          return
        }
        if (data.status === 'expired') {
          setState({ kind: 'expired' })
          scheduleRedirect('/pricing?checkout=expired')
          return
        }
        if (data.status === 'failed') {
          setState({ kind: 'failed' })
          scheduleRedirect('/pricing?checkout=failed')
          return
        }

        // Paid AND webhook has already upgraded the user → redirect
        if (data.status === 'paid' && (data.user.plan !== 'FREE' || data.isOneOffCheckout)) {
          setState({ kind: 'paid' })
          scheduleRedirect('/dashboard?checkout=success')
          return
        }

        // Otherwise: still processing (open / pending / authorized, OR
        // paid but webhook hasn't propagated yet). Keep polling until timeout.
        const elapsed = Date.now() - startedAtRef.current
        if (elapsed >= POLL_TIMEOUT_MS) {
          // After 30s: if Mollie says paid, send the user to dashboard anyway
          // (the webhook may catch up in the background). Otherwise show error.
          if (data.status === 'paid') {
            setState({ kind: 'paid' })
            scheduleRedirect('/dashboard?checkout=success')
          } else {
            setState({
              kind: 'error',
              message: 'timeout',
              paymentId,
            })
          }
          return
        }

        setTimeout(poll, POLL_INTERVAL_MS)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown'
        setState({ kind: 'error', message, paymentId })
      }
    }

    const scheduleRedirect = (target: string) => {
      setTimeout(() => {
        if (!cancelledRef.current) router.push(target)
      }, REDIRECT_DELAY_MS)
    }

    void poll()

    return () => {
      cancelledRef.current = true
    }
  }, [paymentId, router])

  // Render
  if (state.kind === 'processing') {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <CardTitle className="text-2xl font-bold">{t('processing.title')}</CardTitle>
          <CardDescription className="text-base pt-2">
            {t('processing.subtitle')}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (state.kind === 'paid') {
    return (
      <ResultCard
        icon={<CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />}
        iconBg="bg-green-100 dark:bg-green-900/30"
        title={t('success.title')}
        subtitle={t('success.subtitle')}
      />
    )
  }

  if (state.kind === 'canceled') {
    return (
      <ResultCard
        icon={<XCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        title={t('canceled.title')}
        subtitle={t('canceled.subtitle')}
        primary={{ href: '/pricing', label: t('action.pricing') }}
      />
    )
  }

  if (state.kind === 'expired') {
    return (
      <ResultCard
        icon={<Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        title={t('expired.title')}
        subtitle={t('expired.subtitle')}
        primary={{ href: '/pricing', label: t('action.tryAgain') }}
      />
    )
  }

  if (state.kind === 'failed') {
    return (
      <ResultCard
        icon={<XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />}
        iconBg="bg-red-100 dark:bg-red-900/30"
        title={t('failed.title')}
        subtitle={t('failed.subtitle')}
        primary={{ href: '/pricing', label: t('action.tryAgain') }}
      />
    )
  }

  // error
  return (
    <ResultCard
      icon={<AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/30"
      title={t('error.title')}
      subtitle={t('error.subtitle')}
      paymentRef={state.paymentId}
      primary={{ href: '/dashboard', label: t('action.dashboard') }}
      secondary={{ href: '/contact', label: t('action.contactSupport') }}
    />
  )
}

function ResultCard(props: {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  paymentRef?: string
  primary?: { href: string; label: string }
  secondary?: { href: string; label: string }
}) {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="text-center pb-2">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${props.iconBg}`}>
          {props.icon}
        </div>
        <CardTitle className="text-2xl font-bold">{props.title}</CardTitle>
        <CardDescription className="text-base pt-2">{props.subtitle}</CardDescription>
      </CardHeader>
      {(props.primary || props.secondary || props.paymentRef) && (
        <CardContent className="space-y-4 pt-2">
          {props.paymentRef && (
            <div className="rounded-lg border bg-muted/40 p-3 text-center text-xs font-mono break-all">
              {props.paymentRef}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {props.primary && (
              <Button asChild className="w-full h-12">
                <Link href={props.primary.href}>{props.primary.label}</Link>
              </Button>
            )}
            {props.secondary && (
              <Button asChild variant="outline" className="w-full h-12">
                <Link href={props.secondary.href}>{props.secondary.label}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
