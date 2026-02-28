"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

/** Default cooldown in seconds (configurable via NEXT_PUBLIC_AUTH_COOLDOWN_SEC). */
const DEFAULT_COOLDOWN_SEC: number = 180

function getCooldownSeconds(): number {
  const envVal: string | undefined = process.env.NEXT_PUBLIC_AUTH_COOLDOWN_SEC
  if (envVal) {
    const parsed: number = parseInt(envVal, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_COOLDOWN_SEC
}

/** localStorage key for persisting cooldown expiry per email + action. */
function storageKey(action: string, email: string): string {
  return `vx:cooldown:${action}:${email.toLowerCase().trim()}`
}

/**
 * Detects whether a Supabase auth error is a 429 rate-limit response.
 *
 * Supabase can return the rate-limit signal in several ways:
 * - error.status === 429
 * - error.message contains "rate" (e.g. "over_email_send_rate_limit")
 * - error.__isAuthError with status 429
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false
  if (error.status === 429) return true
  if (typeof error.message === 'string') {
    const msg: string = error.message.toLowerCase()
    if (msg.includes('rate') && msg.includes('limit')) return true
    if (msg.includes('over_email_send_rate_limit')) return true
    if (msg.includes('429')) return true
  }
  return false
}

interface UseAuthCooldownReturn {
  /** Seconds remaining on the cooldown (0 = ready). */
  remainingSeconds: number
  /** Human-readable countdown string, e.g. "02:59". */
  countdownLabel: string
  /** Whether the action is currently blocked by cooldown. */
  isCoolingDown: boolean
  /** Start or restart the cooldown timer (call after a successful send or 429). */
  startCooldown: () => void
  /** Manually clear the cooldown (e.g. on email change). */
  clearCooldown: () => void
}

/**
 * Hook that manages a per-email cooldown timer persisted in localStorage.
 *
 * @param action  — Identifier like "recover" or "signup-resend"
 * @param email   — The email address (cooldown is scoped per-email)
 */
export function useAuthCooldown(action: string, email: string): UseAuthCooldownReturn {
  const cooldownSec: number = getCooldownSeconds()
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Restore cooldown from localStorage on mount / email change
  useEffect(() => {
    if (!email) {
      setRemainingSeconds(0)
      return
    }

    const key: string = storageKey(action, email)
    try {
      const stored: string | null = localStorage.getItem(key)
      if (stored) {
        const expiresAt: number = parseInt(stored, 10)
        const diff: number = Math.ceil((expiresAt - Date.now()) / 1000)
        if (diff > 0) {
          setRemainingSeconds(diff)
        } else {
          localStorage.removeItem(key)
          setRemainingSeconds(0)
        }
      } else {
        setRemainingSeconds(0)
      }
    } catch {
      setRemainingSeconds(0)
    }
  }, [action, email])

  // Tick down every second
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const next: number = prev - 1
          if (next <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            // Clean up localStorage
            if (email) {
              try { localStorage.removeItem(storageKey(action, email)) } catch { /* noop */ }
            }
            return 0
          }
          return next
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [remainingSeconds > 0, action, email])

  const startCooldown = useCallback((): void => {
    const expiresAt: number = Date.now() + cooldownSec * 1000
    setRemainingSeconds(cooldownSec)
    if (email) {
      try { localStorage.setItem(storageKey(action, email), String(expiresAt)) } catch { /* noop */ }
    }
  }, [action, email, cooldownSec])

  const clearCooldown = useCallback((): void => {
    setRemainingSeconds(0)
    if (email) {
      try { localStorage.removeItem(storageKey(action, email)) } catch { /* noop */ }
    }
  }, [action, email])

  const isCoolingDown: boolean = remainingSeconds > 0

  const minutes: number = Math.floor(remainingSeconds / 60)
  const seconds: number = remainingSeconds % 60
  const countdownLabel: string = isCoolingDown
    ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : ''

  return {
    remainingSeconds,
    countdownLabel,
    isCoolingDown,
    startCooldown,
    clearCooldown,
  }
}
