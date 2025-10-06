"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client-new'
import { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    try {
      // Clear localStorage and sessionStorage first
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Sign out from Supabase client-side
      await supabase.auth.signOut()

      // Call server-side logout to clear all cookies
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Force a hard redirect to clear all state
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even if signout fails
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => router.push('/auth/login')}
        variant="ghost"
        size="sm"
      >
        Login
      </Button>
      <Button
        onClick={() => router.push('/auth/register')}
        size="sm"
      >
        Sign up
      </Button>
    </div>
  )
}